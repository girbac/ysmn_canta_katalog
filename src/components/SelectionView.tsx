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

  const shareUrl = `${siteUrl}/${locale}/secki?s=${encodeSelection(items)}`;

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
      return `• ${product.name[locale]} (${product.code}) — ${color.name[locale]}${qty}${price}${note}`;
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
              router.replace(`/${locale}/secki`);
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
          </p>

          <ul className="mt-8 divide-y divide-[var(--line)] border-y border-line">
            {rows.map(({ item, product }) => {
              const color = product.colors.find((c) => c.key === item.color) ?? product.colors[0];
              const colorIndex = product.colors.findIndex((c) => c.key === color.key);

              return (
                <li
                  key={itemKey(item.slug, item.color)}
                  className="grid gap-5 py-7 sm:grid-cols-[110px_1fr_auto]"
                >
                  <Link href={`/${locale}/urun/${product.slug}`} className="block w-[110px]">
                    <ProductMedia
                      product={product}
                      colorIndex={Math.max(0, colorIndex)}
                      locale={locale}
                      sizes="110px"
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h2 className="text-subheading text-ink">
                        <Link href={`/${locale}/urun/${product.slug}`} className="hover:text-ink-60">
                          {product.name[locale]}
                        </Link>
                      </h2>
                      {product.name[locale] !== product.code && (
                        <span className="text-caption text-ink-40 tabular-nums">
                          {product.code}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-caption text-ink-60">
                      {t.forms[product.form]} · {materialName(product.material)[locale]} ·{" "}
                      {formatDimensions(product.dimensions, t.common.cm)}
                    </p>

                    {/* Renk seçkiye eklendiği anda sabitlenir — burada
                        değiştirilmez, yalnızca gösterilir. Başka bir renk
                        isteniyorsa ürün sayfasından ayrı satır olarak eklenir. */}
                    <p className="mt-3 flex items-center gap-2 text-caption text-ink">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 rounded-full border border-line"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name[locale]}
                    </p>

                    <label className="mt-4 block">
                      <span className="sr-only">{t.selection.note}</span>
                      <input
                        type="text"
                        value={item.note ?? ""}
                        onChange={(e) => setNote(item.slug, item.color, e.target.value)}
                        placeholder={t.selection.notePlaceholder}
                        className="w-full max-w-md border-b border-line bg-transparent py-2 text-body text-ink placeholder:text-ink-40 focus:border-ink focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="flex items-start gap-4 sm:flex-col sm:items-end">
                    {typeof product.price === "number" && (
                      <div className="sm:text-right">
                        <p className="text-body text-ink tabular-nums">
                          {formatPrice(product.price * item.qty, locale)}
                        </p>
                        {item.qty > 1 && (
                          <p className="mt-0.5 text-caption text-ink-40 tabular-nums">
                            {formatPrice(product.price, locale)} × {item.qty}
                          </p>
                        )}
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <span className="text-caption text-ink-40">{t.selection.quantity}</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={item.qty}
                        onChange={(e) => setQty(item.slug, item.color, Number(e.target.value))}
                        className="w-16 rounded-card border border-line-strong bg-ground-2 px-2 py-2 text-center text-body tabular-nums text-ink focus:border-ink focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(item.slug, item.color)}
                      className="text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
                    >
                      {t.product.remove}
                    </button>
                  </div>
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
              href={`/${locale}/secki/yazdir`}
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
