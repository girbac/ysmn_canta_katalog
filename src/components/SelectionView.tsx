"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { getProduct, productsBySlug } from "@/data/products";
import { materialName } from "@/data/materials";
import {
  decodeSelection,
  encodeSelection,
  useHydrated,
  useSelection,
  type SelectionItem,
} from "@/store/selection";
import { ProductMedia } from "./ProductMedia";
import { cx, formatDimensions, interpolate, whatsappUrl } from "@/lib/utils";

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
  /** Adreste paylaşılmış bir seçki varsa ham dizesi */
  sharedRaw,
}: {
  locale: Locale;
  t: Dictionary;
  whatsapp: string;
  siteUrl: string;
  sharedRaw?: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useSelection((s) => s.items);
  const { remove, setQty, setNote, setColor, clear, merge } = useSelection();
  const [copied, setCopied] = useState(false);

  const shared = useMemo(
    () => decodeSelection(sharedRaw, (slug) => productsBySlug.has(slug)),
    [sharedRaw],
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

  const waMessage = [
    t.selection.whatsappIntro,
    "",
    ...rows.map(({ item, product }) => {
      const color = product.colors.find((c) => c.key === item.color) ?? product.colors[0];
      const qty = item.qty > 1 ? ` × ${item.qty}` : "";
      const note = item.note?.trim() ? `\n  ${t.selection.note}: ${item.note.trim()}` : "";
      return `• ${product.name[locale]} (${product.code}) — ${color.name[locale]}${qty}${note}`;
    }),
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
                  key={s.slug}
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
                <li key={item.slug} className="grid gap-5 py-7 sm:grid-cols-[110px_1fr_auto]">
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
                      <span className="text-caption text-ink-40 tabular-nums">{product.code}</span>
                    </div>

                    <p className="mt-1 text-caption text-ink-60">
                      {t.forms[product.form]} · {materialName(product.material)[locale]} ·{" "}
                      {formatDimensions(product.dimensions, t.common.cm)}
                    </p>

                    {/* Renk seçimi — seçkide renk değiştirilebilsin */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {product.colors.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setColor(item.slug, c.key)}
                          aria-pressed={c.key === color.key}
                          title={c.name[locale]}
                          className={cx(
                            "flex items-center gap-1.5 rounded-card border bg-ground-2 py-1 pl-1 pr-3 text-caption transition-colors",
                            c.key === color.key
                              ? "border-ink text-ink"
                              : "border-line-strong text-ink-40 hover:border-ink hover:text-ink",
                          )}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-line"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name[locale]}
                        </button>
                      ))}
                    </div>

                    <label className="mt-4 block">
                      <span className="sr-only">{t.selection.note}</span>
                      <input
                        type="text"
                        value={item.note ?? ""}
                        onChange={(e) => setNote(item.slug, e.target.value)}
                        placeholder={t.selection.notePlaceholder}
                        className="w-full max-w-md border-b border-line bg-transparent py-2 text-body text-ink placeholder:text-ink-40 focus:border-ink focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="flex items-start gap-4 sm:flex-col sm:items-end">
                    <label className="flex items-center gap-2">
                      <span className="text-caption text-ink-40">{t.selection.quantity}</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={item.qty}
                        onChange={(e) => setQty(item.slug, Number(e.target.value))}
                        className="w-16 rounded-card border border-line-strong bg-ground-2 px-2 py-2 text-center text-body tabular-nums text-ink focus:border-ink focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(item.slug)}
                      className="text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
                    >
                      {t.product.remove}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

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
