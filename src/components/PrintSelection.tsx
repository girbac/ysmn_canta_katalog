"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Locale, Product } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { materialName } from "@/data/materials";
import { itemKey, useHydrated, useSelection } from "@/store/selection";
import { BagSilhouette } from "./BagSilhouette";
import { formatDimensions } from "@/lib/utils";

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

  useEffect(() => {
    if (!hydrated || rows.length === 0) return;
    // Yazı tipleri yerleşsin, sonra yazdırma penceresi açılsın
    const id = setTimeout(() => window.print(), 700);
    return () => clearTimeout(id);
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
            href={`/${locale}/secki`}
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
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, product }) => {
                  const p = product!;
                  const color = p.colors.find((c) => c.key === item.color) ?? p.colors[0];
                  return (
                    <tr
                      key={itemKey(item.slug, item.color)}
                      className="print-break border-b border-black/12 align-top text-[11px] text-ink print:text-black"
                    >
                      <td className="py-3">
                        <div className="w-[62px] bg-ground-2 print:bg-[#f2efe9]">
                          <BagSilhouette
                            form={p.form}
                            hex={color.hex}
                            idSuffix={`print-${p.slug}`}
                            className="w-full"
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-[10px] tracking-wide">{p.code}</td>
                      <td className="py-3 pr-3">
                        <span className="block font-whisper text-[13px] leading-tight">
                          {p.name[locale]}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-40 print:text-black/60">
                          {t.forms[p.form]} · {color.name[locale]}
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
                      <td className="py-3 text-right tabular-nums">{item.qty}</td>
                    </tr>
                  );
                })}
              </tbody>
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
