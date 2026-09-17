"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Locale, Product } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { materialName } from "@/data/materials";
import { itemKey, useHydrated, useSelection } from "@/store/selection";
import { ProductMedia } from "./ProductMedia";
import { formatDimensions, formatPrice, interpolate, selectionTotal } from "@/lib/utils";

/**
 * Seçkinin A4 baskı görünümü.
 *
 * PDF için kütüphane kullanmıyoruz: tarayıcının kendi "PDF olarak kaydet"
 * çıktısı hem daha keskin tipografi veriyor hem de sıfır bağımlılık.
 * Sayfa açılır açılmaz yazdırma penceresi geliyor.
 */
export function PrintSelection({
  locale,
  t,
  brand,
  contact,
  /** Katalogun tamamı sunucudan gelir — bkz. SelectionView */
  catalog,
}: {
  locale: Locale;
  t: Dictionary;
  brand: string;
  contact: { whatsapp: string; email: string; url: string };
  catalog: Product[];
}) {
  const getProduct = (slug: string) => catalog.find((p) => p.slug === slug);
  const hydrated = useHydrated();
  const items = useSelection((s) => s.items);

  const rows = items
    .map((item) => ({ item, product: getProduct(item.slug) }))
    .filter((r) => r.product);

  const sum = selectionTotal(
    rows.map(({ item, product }) => ({ price: product?.price, qty: item.qty })),
  );

  useEffect(() => {
    if (!hydrated || rows.length === 0) return;
    let iptal = false;

    /**
     * Yazdırma penceresi, sayfa gerçekten hazır olunca açılıyor.
     *
     * Eskiden sabit 700 ms bekleniyordu; yazı tipleri için yetiyordu ama
     * fotoğraflar için yetmiyordu. Fotoğrafı geç yüklenen satır PDF'te
     * boş kutu olarak çıkıyordu. Artık hem yazı tipleri hem de sayfadaki
     * bütün görseller bitene kadar bekleniyor (hata verenler dahil —
     * yoksa tek bozuk dosya yazdırmayı sonsuza kadar bekletirdi).
     */
    async function hazirOlunca() {
      await Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((bitti) => {
                img.addEventListener("load", () => bitti(), { once: true });
                img.addEventListener("error", () => bitti(), { once: true });
              }),
        ),
      );
      await document.fonts?.ready;
      if (!iptal) window.print();
    }

    const id = setTimeout(hazirOlunca, 200);
    return () => {
      iptal = true;
      clearTimeout(id);
    };
  }, [hydrated, rows.length]);

  if (!hydrated) return <div className="p-16 text-sm text-ink-40">{t.common.loading}…</div>;

  const date = new Date().toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div data-mode="kadin" className="min-h-screen bg-ground print:bg-white">
      <div className="mx-auto max-w-[820px] px-8 py-16 print:px-0 print:py-0">
        {/* Ekranda görünen, baskıya girmeyen kontroller */}
        <div className="no-print mb-10 flex flex-wrap items-center gap-4">
          <Link
            href={`/${locale}/sepet`}
            className="border-b border-line-strong pb-1 text-body text-ink-60 hover:text-ink"
          >
            ← {t.selection.printBack}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-card bg-ink px-6 py-4 text-body font-medium text-ground"
          >
            {t.selection.printNow}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-heading-sm font-whisper text-ink">{t.selection.empty}</p>
        ) : (
          <>
            <header className="flex items-end justify-between gap-6 border-b-2 border-black/80 pb-5 print:border-black">
              <div>
                <p className="font-whisper text-3xl text-ink print:text-black">
                  {brand}
                </p>
                <p className="mt-1 text-xs uppercase text-ink-40 print:text-black/60">
                  {t.selection.printTitle}
                </p>
              </div>
              <div className="text-right text-[11px] leading-relaxed text-ink-60 print:text-black/70">
                <p>
                  {t.selection.printDate}: {date}
                </p>
                <p>{contact.email}</p>
                <p>wa.me/{contact.whatsapp}</p>
              </div>
            </header>

            <table className="mt-8 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black/30 text-[9px] uppercase text-ink-40 print:text-black/60">
                  <th className="w-[74px] pb-2 font-normal"> </th>
                  <th className="pb-2 font-normal">{t.product.code}</th>
                  <th className="pb-2 font-normal">{t.common.product}</th>
                  <th className="pb-2 font-normal">{t.product.material}</th>
                  <th className="pb-2 font-normal">{t.product.dimensions}</th>
                  <th className="pb-2 text-right font-normal">{t.selection.quantity}</th>
                  <th className="pb-2 text-right font-normal">{t.product.price}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, product }) => {
                  const p = product!;
                  const colorIndex = Math.max(
                    0,
                    p.colors.findIndex((c) => c.key === item.color),
                  );
                  const color = p.colors[colorIndex];
                  return (
                    <tr
                      key={itemKey(item.slug, item.color)}
                      className="print-break border-b border-black/12 align-top text-[11px] text-ink print:text-black"
                    >
                      {/* Gerçek ürün fotoğrafı — fotoğrafı olmayan renkte
                          silüete düşer. Burası eskiden doğrudan silüet
                          çiziyordu, yani ürünün fotoğrafı olsa bile PDF'e
                          çizim giriyordu. Fotoğraf sınırı tek yerde
                          (ProductMedia) kalsın diye artık o kullanılıyor. */}
                      <td className="py-3">
                        <div className="w-[62px]">
                          <ProductMedia
                            product={p}
                            colorIndex={colorIndex}
                            locale={locale}
                            sizes="62px"
                            eager
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-[12px] font-medium tracking-wide">{p.code}</td>
                      <td className="py-3 pr-3">
                        <span className="block font-whisper text-[13px] leading-tight">
                          {p.name[locale]}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-40 print:text-black/60">
                          {t.forms[p.form]} ·
                          {/* Renk noktası SVG, CSS arka planı değil: tarayıcının
                              "arka plan grafikleri" seçeneği kapalıyken de basılsın.
                              Renk PDF'te yalnızca isimle kalmıyor, gözle de görünüyor. */}
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 8 8"
                            aria-hidden="true"
                            className="shrink-0"
                          >
                            <circle cx="4" cy="4" r="3.6" fill={color.hex} stroke="#00000033" strokeWidth="0.8" />
                          </svg>
                          {color.name[locale]}
                        </span>
                        {item.note?.trim() && (
                          <span className="mt-1 block text-[10px] italic text-ink-60 print:text-black/70">
                            {t.selection.note}: {item.note.trim()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">{materialName(p.material)[locale]}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {formatDimensions(p.dimensions, t.common.cm)}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums">{item.qty}</td>
                      <td className="py-3 text-right tabular-nums">
                        {typeof p.price === "number"
                          ? formatPrice(p.price * item.qty, locale)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {sum.priced > 0 && (
                <tfoot>
                  <tr className="text-[11px] text-ink print:text-black">
                    <td colSpan={5} className="pt-4 text-right">
                      {t.selection.total}
                    </td>
                    <td className="pt-4 text-right font-whisper text-[15px] tabular-nums">
                      {formatPrice(sum.total, locale)}
                    </td>
                  </tr>
                  {sum.unpriced > 0 && (
                    <tr className="text-[9px] text-ink-40 print:text-black/60">
                      <td colSpan={6} className="pt-1 text-right">
                        {interpolate(t.selection.totalPartial, { n: sum.unpriced })}
                      </td>
                    </tr>
                  )}
                </tfoot>
              )}
            </table>

            <footer className="mt-10 border-t border-black/30 pt-4 text-[10px] text-ink-40 print:text-black/60">
              {contact.url}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
