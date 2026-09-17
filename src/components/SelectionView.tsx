"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale, Product } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { materialName } from "@/data/materials";
import {
  decodeSelection,
  encodeSelection,
  itemKey,
  useHydrated,
  useSelection,
  type SelectionItem,
} from "@/store/selection";
import { ProductMedia } from "./ProductMedia";
import {
  formatDimensions,
  formatPrice,
  interpolate,
  selectionTotal,
  whatsappUrl,
} from "@/lib/utils";

/**
 * Seçki — katalogu pasif bir vitrinden aktif bir araca çeviren ekran.
 *
 * Üç çıkışı var, hiçbiri sunucu gerektirmiyor:
 *  1. WhatsApp — ürün kodları, adetler ve notlarla hazır mesaj
 *  2. Paylaşılabilir bağlantı — seçki adresin içine kodlanıyor
 *  3. PDF — ayrı bir A4 baskı görünümü
 */
export function SelectionView({
  locale,
  t,
  whatsapp,
  siteUrl,
  /**
   * Katalogun tamamı sunucudan geliyor.
   *
   * Seçki localStorage'da durduğu için hangi ürünlerin gerekeceği
   * sunucuda bilinemiyor; bu yüzden liste prop olarak aktarılıyor.
   * Veri kaynağı artık admin panelinden değişebildiği için bileşenin
   * doğrudan import etmesi doğru olmazdı.
   */
  catalog,
  /** Adreste paylaşılmış bir seçki varsa ham dizesi */
  sharedRaw,
}: {
  locale: Locale;
  t: Dictionary;
  whatsapp: string;
  siteUrl: string;
  catalog: Product[];
  sharedRaw?: string;
}) {
  const getProduct = (slug: string) => catalog.find((p) => p.slug === slug);
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useSelection((s) => s.items);
  const { remove, setQty, setNote, clear, merge } = useSelection();
  const [copied, setCopied] = useState(false);
  /**
   * Not kutusu açık olan satırlar.
   *
   * Her renge boş bir not kutusu koymak sepeti bir forma çeviriyordu.
   * Kutu artık istenince açılıyor; dolu bir not zaten kendiliğinden
   * görünüyor (bkz. notAcik).
   */
  const [acikNotlar, setAcikNotlar] = useState<Set<string>>(new Set());

  const shared = useMemo(
    () => decodeSelection(sharedRaw, (slug) => catalog.some((p) => p.slug === slug)),
    [sharedRaw, catalog],
  );

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(id);
  }, [copied]);

  /** Hidrasyon bitmeden localStorage'daki seçki bilinmiyor */
  if (!hydrated) {
    return <div className="py-24 text-sm text-ink-40">{t.common.loading}…</div>;
  }

  const rows = items
    .map((item) => ({ item, product: getProduct(item.slug) }))
    .filter((r): r is { item: SelectionItem; product: NonNullable<ReturnType<typeof getProduct>> } =>
      Boolean(r.product),
    );

  /**
   * Satırları modele göre grupla.
   *
   * Sepette bir kayıt "ürün + renk" demek; aynı çantanın üç rengi üç ayrı
   * kayıt. Ekranda ise bunlar tek bir çantanın üç rengi olarak okunmalı,
   * üç ayrı ürün olarak değil.
   *
   * Sıra, ürünün sepete ilk giren renginin sırası: kullanıcı neyi önce
   * eklediyse o üstte kalıyor, gruplama sırayı karıştırmıyor.
   */
  const gruplar: Array<{ product: Product; satirlar: typeof rows }> = [];
  for (const satir of rows) {
    const mevcut = gruplar.find((g) => g.product.slug === satir.product.slug);
    if (mevcut) mevcut.satirlar.push(satir);
    else gruplar.push({ product: satir.product, satirlar: [satir] });
  }

  const shareUrl = `${siteUrl}/${locale}/sepet?s=${encodeSelection(items)}`;

  const sum = selectionTotal(
    rows.map(({ item, product }) => ({ price: product.price, qty: item.qty })),
  );

  const waMessage = [
    t.selection.whatsappIntro,
    "",
    ...rows.map(({ item, product }) => {
      const color = product.colors.find((c) => c.key === item.color) ?? product.colors[0];
      const qty = item.qty > 1 ? ` × ${item.qty}` : "";
      const price =
        typeof product.price === "number"
          ? ` — ${formatPrice(product.price * item.qty, locale)}`
          : "";
      const note = item.note?.trim() ? `\n  ${t.selection.note}: ${item.note.trim()}` : "";
      /* Kod başta: mesajı okuyan kişi ürünü adından değil kodundan
         ayırt ediyor, adlar birbirine çok benziyor. */
      return `• ${product.code} — ${product.name[locale]} · ${color.name[locale]}${qty}${price}${note}`;
    }),
    // Fiyatı olmayan ürün varsa toplam yanıltıcı olur; o yüzden ya tam
    // toplam yazılır ya da hiç yazılmaz.
    ...(sum.priced > 0 && sum.unpriced === 0
      ? ["", `${t.selection.total}: ${formatPrice(sum.total, locale)}`]
      : []),
    "",
    t.selection.whatsappOutro,
    "",
    shareUrl,
  ].join("\n");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // Pano izni yoksa adresi seçilebilir biçimde göster
      window.prompt(t.selection.share, shareUrl);
    }
  }

  return (
    <>
      {/* ── Paylaşılan seçki bildirimi ── */}
      {shared.length > 0 && (
        <div className="no-print mb-12 rounded-card border border-line-strong bg-ground-2 p-6">
          <p className="text-heading-sm font-whisper text-ink">{t.selection.sharedTitle}</p>
          <p className="mt-2 text-body text-ink-60">{t.selection.sharedLead}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {shared.map((s) => {
              const p = getProduct(s.slug);
              return p ? (
                <li
                  key={itemKey(s.slug, s.color)}
                  className="rounded-card border border-line-strong px-3 py-1.5 text-caption text-ink-60"
                >
                  {p.name[locale]}
                  {s.qty > 1 && ` × ${s.qty}`}
                </li>
              ) : null;
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              merge(shared);
              router.replace(`/${locale}/sepet`);
            }}
            className="mt-5 rounded-card bg-ink px-6 py-4 text-body font-medium text-ground"
          >
            {t.selection.importShared}
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="py-24">
          <p className="font-whisper text-heading text-ink">{t.selection.empty}</p>
          <p className="mt-4 max-w-sm text-body text-ink-60">
            {t.selection.emptyLead}
          </p>
          <Link
            href={`/${locale}/koleksiyon`}
            className="mt-8 inline-block rounded-card bg-ink px-6 py-4 text-body font-medium text-ground"
          >
            {t.selection.browse}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-caption text-ink-40">
            {interpolate(t.selection.itemCount, { n: rows.length })}
            {gruplar.length !== rows.length &&
              ` · ${interpolate(t.selection.modelCount, { n: gruplar.length })}`}
          </p>

          {/*
            Aynı modelin renkleri tek kartta.

            Eskiden her renk ayrı bir satırdı ve her satır ürünün adını,
            kodunu, formunu, malzemesini, ölçüsünü ve bir not kutusunu
            baştan yazıyordu. Üç renkli bir çanta, aynı altı bilgiyi üç kez
            tekrarlayan bir duvara dönüşüyordu. Model künyesi artık bir kez
            yazılıyor; altında yalnızca renkler, adetleri ve fiyatları
            duruyor — göz "aynı çantanın üç rengi" diye okuyor.
          */}
          <ul className="mt-8 space-y-5">
            {gruplar.map(({ product, satirlar }) => {
              const araToplam = selectionTotal(
                satirlar.map(({ item }) => ({ price: product.price, qty: item.qty })),
              );

              return (
                <li
                  key={product.slug}
                  className="rounded-card border border-line bg-ground-2 p-5 sm:p-6"
                >
                  {/* Model künyesi — bir kez.
                      Kod önde ve okunur: modellerin adları birbirine çok
                      benziyor, iki kartı ayıran şey pratikte kod oluyor.
                      Solda soluk bir yazı olarak durduğunda göz onu
                      atlıyordu. */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {product.name[locale] !== product.code && (
                      <span className="rounded-full border border-line-strong bg-ground px-3 py-1 text-caption font-medium tracking-[0.08em] text-ink tabular-nums">
                        {product.code}
                      </span>
                    )}
                    <h2 className="text-subheading text-ink">
                      <Link href={`/${locale}/urun/${product.slug}`} className="hover:text-ink-60">
                        {product.name[locale]}
                      </Link>
                    </h2>
                  </div>
                  <p className="mt-1 text-caption text-ink-60">
                    {t.forms[product.form]} · {materialName(product.material)[locale]} ·{" "}
                    {formatDimensions(product.dimensions, t.common.cm)}
                  </p>

                  {/* Renkler — yan yana değil alt alta ama tek künye altında:
                      yan yana dizmek dar ekranda okunmaz hâle geliyordu,
                      asıl kazanç tekrarın kalkması. */}
                  <ul className="mt-5 divide-y divide-[var(--line)] border-t border-line">
                    {satirlar.map(({ item }) => {
                      const color =
                        product.colors.find((c) => c.key === item.color) ?? product.colors[0];
                      const colorIndex = product.colors.findIndex((c) => c.key === color.key);
                      const anahtar = itemKey(item.slug, item.color);
                      const notAcik = acikNotlar.has(anahtar) || Boolean(item.note?.trim());

                      return (
                        <li key={anahtar} className="py-4">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                            <Link
                              href={`/${locale}/urun/${product.slug}`}
                              className="block w-[72px] shrink-0"
                            >
                              <ProductMedia
                                product={product}
                                colorIndex={Math.max(0, colorIndex)}
                                locale={locale}
                                sizes="72px"
                              />
                            </Link>

                            <span className="flex min-w-[7rem] flex-1 items-center gap-2 text-body text-ink">
                              <span
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 rounded-full border border-line"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name[locale]}
                            </span>

                            <label className="flex items-center gap-2">
                              <span className="text-caption text-ink-40">
                                {t.selection.quantity}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={item.qty}
                                onChange={(e) =>
                                  setQty(item.slug, item.color, Number(e.target.value))
                                }
                                className="w-16 rounded-card border border-line-strong bg-ground px-2 py-2 text-center text-body tabular-nums text-ink focus:border-ink focus:outline-none"
                              />
                            </label>

                            {typeof product.price === "number" && (
                              <span className="min-w-[5.5rem] text-right text-body tabular-nums text-ink">
                                {formatPrice(product.price * item.qty, locale)}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => remove(item.slug, item.color)}
                              aria-label={`${product.name[locale]} — ${color.name[locale]} · ${t.product.remove}`}
                              title={t.product.remove}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-40 hover:bg-ground hover:text-ink"
                            >
                              ×
                            </button>
                          </div>

                          {/* Not kutusu yalnızca istenince açılıyor: her renge
                              boş bir kutu koymak sayfayı form gibi
                              gösteriyordu. */}
                          {notAcik ? (
                            <label className="mt-3 block">
                              <span className="sr-only">{t.selection.note}</span>
                              <input
                                type="text"
                                value={item.note ?? ""}
                                onChange={(e) => setNote(item.slug, item.color, e.target.value)}
                                placeholder={t.selection.notePlaceholder}
                                autoFocus={acikNotlar.has(anahtar) && !item.note}
                                className="w-full max-w-md border-b border-line bg-transparent py-1.5 text-caption text-ink placeholder:text-ink-40 focus:border-ink focus:outline-none"
                              />
                            </label>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setAcikNotlar((o) => new Set(o).add(anahtar))
                              }
                              className="mt-2 text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
                            >
                              + {t.selection.addNote}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Ara toplam yalnızca birden fazla renk varsa: tek renkte
                      satırdaki fiyatı tekrar etmekten başka işe yaramaz. */}
                  {satirlar.length > 1 && araToplam.priced > 0 && (
                    <p className="mt-4 text-right text-caption text-ink-60">
                      {t.selection.subtotal}{" "}
                      <span className="ml-2 text-body tabular-nums text-ink">
                        {formatPrice(araToplam.total, locale)}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ── Toplam ──
              Fiyatı girilmemiş ürün varsa toplam eksiktir; bunu gizlemek
              yerine kaç ürünün fiyatsız olduğu açıkça yazılıyor. */}
          {sum.priced > 0 && (
            <div className="mt-8 flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-4">
                <span className="text-body text-ink-60">{t.selection.total}</span>
                <span className="text-heading-sm text-ink tabular-nums">
                  {formatPrice(sum.total, locale)}
                </span>
              </div>
              {sum.unpriced > 0 && (
                <p className="text-caption text-ink-40">
                  {interpolate(t.selection.totalPartial, { n: sum.unpriced })}
                </p>
              )}
            </div>
          )}

          {/* ── Üç çıkış ── */}
          <div className="no-print mt-12 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl(whatsapp, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card bg-ink px-6 py-4 text-body font-medium text-ground transition-transform duration-300 hover:scale-[1.02]"
            >
              {t.selection.sendWhatsApp}
            </a>

            <button
              type="button"
              onClick={copyLink}
              className="rounded-card border border-line-strong bg-ground-2 px-6 py-4 text-body font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
            >
              {copied ? t.selection.shared : t.selection.share}
            </button>

            <Link
              href={`/${locale}/sepet/yazdir`}
              className="rounded-card border border-line-strong bg-ground-2 px-6 py-4 text-body font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
            >
              {t.selection.print}
            </Link>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.selection.clearConfirm)) clear();
              }}
              className="ml-auto text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
            >
              {t.selection.clearAll}
            </button>
          </div>

          <p className="no-print mt-4 text-caption text-ink-40">{t.selection.printHint}</p>
        </>
      )}
    </>
  );
}
