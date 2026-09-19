"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale, Product } from "@/data/types";
import { ProductMedia } from "./ProductMedia";
import { SelectionButton } from "./SelectionButton";
import { cx, formatPrice } from "@/lib/utils";

export type CardLabels = {
  add: string;
  added: string;
  remove: string;
  isNew: string;
  form: string;
  colorCount: string;
};

/**
 * Katalog kartı.
 *
 * Fotoğraf kartın kahramanı: aydınlık bir yüzeyde, kırpılmadan, nefes
 * payıyla duruyor. İmleç üzerine gelince kart hafifçe yükseliyor; görsel
 * değişmiyor — bir ara üzerine gelince ikinci fotoğrafa geçiyordu,
 * kaldırıldı. Diğer kareler ürünün kendi sayfasında görülüyor.
 *
 * Eskiden kart imlece göre eğiliyordu (3B tilt); çerçeveli bir kartta o
 * eğim kenarları eğriltip ucuzlatıyordu, yerini yükselme aldı.
 */
export function ProductCard({
  product,
  locale,
  labels,
  priority = false,
  sizes = "(max-width: 768px) 50vw, 33vw",
  className,
}: {
  product: Product;
  locale: Locale;
  labels: CardLabels;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [colorIndex, setColorIndex] = useState(0);

  const colorLabel = product.colors[colorIndex]?.name[locale] ?? "";

  return (
    <div className={cx("group relative", className)}>
      <Link
        href={`/${locale}/urun/${product.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`${product.name[locale]} — ${labels.form}`}
      >
        <div className="relative overflow-hidden rounded-card border border-line bg-ground-3 transition-[translate,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-24px_rgb(13_13_13/0.45)] motion-reduce:translate-none motion-reduce:transition-none">
          <ProductMedia
            product={product}
            colorIndex={colorIndex}
            locale={locale}
            sizes={sizes}
            priority={priority}
            contain
          />

          {product.isNew && (
            <span className="pointer-events-none absolute left-4 top-4 rounded-tile bg-ink px-2.5 py-1 text-caption font-medium uppercase text-ground">
              {labels.isNew}
            </span>
          )}
        </div>
      </Link>

      {/* Seçkiye ekle — kartın dışında ki link tıklamasıyla çakışmasın */}
      <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
        <SelectionButton
          slug={product.slug}
          color={product.colors[colorIndex]?.key}
          labels={labels}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-subheading text-ink">
            <Link href={`/${locale}/urun/${product.slug}`} className="hover:text-ink-60">
              {product.name[locale]}
            </Link>
          </h3>
          <p className="mt-0.5 text-caption text-ink-60">{labels.form}</p>
          {/* Fiyat girilmemişse satır hiç çıkmaz — "—" ya da "0" göstermek,
              fiyatı henüz belirlenmemiş bir parçayı bedavaymış gibi okutur. */}
          {typeof product.price === "number" && (
            <p className="mt-1.5 text-body text-ink tabular-nums">
              {formatPrice(product.price, locale)}
            </p>
          )}
        </div>
        {/* Ad koddan üretilmişse (panelde yalnızca kod giriliyor) kodu
            ikinci kez yazmak gereksiz tekrar olur. */}
        {product.name[locale] !== product.code && (
          <span className="shrink-0 pt-1 text-caption text-ink-40 tabular-nums">
            {product.code}
          </span>
        )}
      </div>

      {/* Renk pastilleri — üzerine gelince kartın görseli o renge döner */}
      {product.colors.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5">
          {product.colors.map((c, i) => (
            <button
              key={c.key}
              type="button"
              onMouseEnter={() => setColorIndex(i)}
              onFocus={() => setColorIndex(i)}
              onClick={() => setColorIndex(i)}
              aria-label={c.name[locale]}
              aria-pressed={i === colorIndex}
              title={c.name[locale]}
              className={cx(
                "h-4 w-4 rounded-full border transition-transform duration-200",
                i === colorIndex ? "scale-110 border-ink" : "border-line-strong hover:scale-110",
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          <span className="sr-only" aria-live="polite">
            {colorLabel}
          </span>
        </div>
      )}
    </div>
  );
}
