"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { saveOrderAction, type OrderState } from "../actions";

export type OrderItem = {
  slug: string;
  /** Ekran okuyucu etiketlerinde ve taşıma çubuğunda geçen ad */
  ad: string;
  /** Satırın kendisi — sunucuda üretiliyor, burada yalnızca sırası değişiyor */
  icerik: ReactNode;
};

/**
 * Katalog sıralaması.
 *
 * Sıra burada, tarayıcıda diziliyor; depoya yalnızca "Sırayı kaydet" ile
 * tek seferde gidiyor. Eskiden her ok tıklaması ayrı bir yazma işlemiydi
 * ve katalogun tamamını baştan yazıyordu: canlıda her tıklama saniyeler
 * sürdüğü için kırk bir ürünlük listeyi elle dizmek pratikte mümkün
 * değildi.
 *
 * Üç yol da aynı listeyi düzenliyor, hepsi anında:
 *  · tutamaçtan sürükleyip bırakmak (fare ve dokunmatik, tek kod yolu),
 *  · ok düğmeleri — bir satır yukarı/aşağı,
 *  · "başa al" — uzun listede en sık gereken hamle.
 */
export function CatalogOrder({ items }: { items: OrderItem[] }) {
  const baslangic = items.map((i) => i.slug);
  const [sira, setSira] = useState<string[]>(baslangic);
  const [state, action, pending] = useActionState<OrderState | null, FormData>(
    saveOrderAction,
    null,
  );

  const icerik = new Map(items.map((i) => [i.slug, i]));
  const degisti = sira.join(",") !== baslangic.join(",");

  /* ── Sürükleme ──
     Satırlar sürükleme boyunca yerinden oynamıyor: ekranda yalnızca
     "buraya girecek" çizgisi hareket ediyor, dizilim bırakınca
     değişiyor. Canlı yeniden dizmek, ölçülen geometriyi sürekli
     bozduğu için satırların titremesine yol açıyordu. */
  const [tasinan, setTasinan] = useState<string | null>(null);
  const [hedef, setHedef] = useState<number | null>(null);
  const satirlar = useRef(new Map<string, HTMLLIElement | null>());
  const olcu = useRef<Array<{ orta: number }>>([]);
  const kaydirmaYonu = useRef(0);

  /** Kenara yaklaşınca sayfa kendi kendine kayar — parmak listeyi terk etmesin */
  useEffect(() => {
    if (!tasinan) return;
    let acik = true;
    const adim = () => {
      if (!acik) return;
      if (kaydirmaYonu.current !== 0) window.scrollBy(0, kaydirmaYonu.current * 12);
      requestAnimationFrame(adim);
    };
    requestAnimationFrame(adim);
    return () => {
      acik = false;
      kaydirmaYonu.current = 0;
    };
  }, [tasinan]);

  const basla = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, slug: string) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      // Geometri bir kez ölçülüyor; sürükleme boyunca satırlar sabit duruyor
      olcu.current = sira.map((s) => {
        const el = satirlar.current.get(s);
        const r = el?.getBoundingClientRect();
        return { orta: r ? r.top + window.scrollY + r.height / 2 : 0 };
      });
      setTasinan(slug);
      setHedef(sira.indexOf(slug));
    },
    [sira],
  );

  const hareket = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!tasinan) return;
      const kenar = 90;
      kaydirmaYonu.current =
        e.clientY < kenar ? -1 : e.clientY > window.innerHeight - kenar ? 1 : 0;

      const y = e.clientY + window.scrollY;
      const yer = olcu.current.findIndex((o) => y < o.orta);
      setHedef(yer === -1 ? olcu.current.length : yer);
    },
    [tasinan],
  );

  const bitir = useCallback(() => {
    kaydirmaYonu.current = 0;
    if (tasinan !== null && hedef !== null) {
      setSira((onceki) => {
        const nereden = onceki.indexOf(tasinan);
        if (nereden === -1) return onceki;
        const yeni = [...onceki];
        yeni.splice(nereden, 1);
        // Kendi yerini boşalttığı için ondan sonraki hedefler bir kayıyor
        const nereye = hedef > nereden ? hedef - 1 : hedef;
        yeni.splice(Math.max(0, Math.min(nereye, yeni.length)), 0, tasinan);
        return yeni;
      });
    }
    setTasinan(null);
    setHedef(null);
  }, [tasinan, hedef]);

  /* ── Düğmeler ── */
  function tasi(slug: string, nereye: number) {
    setSira((onceki) => {
      const nereden = onceki.indexOf(slug);
      if (nereden === -1) return onceki;
      const hedefYer = Math.max(0, Math.min(nereye, onceki.length - 1));
      if (hedefYer === nereden) return onceki;
      const yeni = [...onceki];
      yeni.splice(nereden, 1);
      yeni.splice(hedefYer, 0, slug);
      return yeni;
    });
  }

  return (
    <>
      {/* Sürüklerken metin seçilmesin, dokunmatikte sayfa kaymasın */}
      <ul
        className={`mt-6 divide-y divide-[var(--line)] border-y border-line ${
          tasinan ? "select-none" : ""
        }`}
      >
        {sira.map((slug, i) => {
          const item = icerik.get(slug);
          if (!item) return null;
          const suruklenen = tasinan === slug;

          return (
            <li
              key={slug}
              ref={(el) => {
                satirlar.current.set(slug, el);
              }}
              className={`relative flex flex-wrap items-center gap-3 py-4 ${
                suruklenen ? "opacity-50" : ""
              }`}
            >
              {/* Bırakma çizgisi — satır bu aralığa girecek */}
              {tasinan && hedef === i && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -top-px h-0.5 rounded bg-ink"
                />
              )}
              {tasinan && hedef === sira.length && i === sira.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-ink"
                />
              )}

              <button
                type="button"
                onPointerDown={(e) => basla(e, slug)}
                onPointerMove={hareket}
                onPointerUp={bitir}
                onPointerCancel={bitir}
                aria-label={`${item.ad} — sürükleyerek taşı`}
                title="Sürükleyerek taşı"
                className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-card text-ink-40 hover:text-ink active:cursor-grabbing"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ⠿
                </span>
              </button>

              <span className="w-6 shrink-0 text-caption tabular-nums text-ink-40">
                {i + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                {item.icerik}
              </div>

              {/* Dar ekranda düğmeler kendi satırına iniyor: aynı satırda
                  kalınca ürün adına ve künyesine yer kalmıyor, her satır
                  dört kelimelik bir sütuna dönüşüyordu. */}
              <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => tasi(slug, 0)}
                  disabled={i === 0}
                  aria-label={`${item.ad} — başa al`}
                  title="Başa al"
                  className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink disabled:opacity-30"
                >
                  ⤒
                </button>
                <button
                  type="button"
                  onClick={() => tasi(slug, i - 1)}
                  disabled={i === 0}
                  aria-label={`${item.ad} — bir satır yukarı`}
                  title="Bir satır yukarı"
                  className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => tasi(slug, i + 1)}
                  disabled={i === sira.length - 1}
                  aria-label={`${item.ad} — bir satır aşağı`}
                  title="Bir satır aşağı"
                  className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Kaydetme çubuğu yalnızca sıra değiştiyse çıkıyor: değişiklik
          yokken ekranda duran bir "Kaydet" düğmesi, kaydedilecek bir şey
          olup olmadığını belirsiz bırakıyor. */}
      {degisti && (
        <form
          action={action}
          className="sticky bottom-0 z-10 mt-2 flex flex-wrap items-center gap-3 border-t border-line bg-ground py-4"
        >
          <input type="hidden" name="sira" value={sira.join(",")} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-card bg-ink px-6 py-3 text-body font-medium text-ground disabled:opacity-50"
          >
            {pending ? "Kaydediliyor…" : "Sırayı kaydet"}
          </button>
          <button
            type="button"
            onClick={() => setSira(baslangic)}
            className="text-caption text-ink-60 underline-offset-4 hover:text-ink hover:underline"
          >
            Geri al
          </button>
          <span className="text-caption text-ink-60">
            Sıra değişti — kaydedilmedi.
          </span>
        </form>
      )}

      {state?.ok && !degisti && (
        <p className="mt-4 text-caption text-ink-60">Sıra kaydedildi.</p>
      )}
      {state && !state.ok && (
        <p role="alert" className="mt-4 text-caption text-ink">
          {state.error}
        </p>
      )}
    </>
  );
}
