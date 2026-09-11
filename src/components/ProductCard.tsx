"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import type { Locale, Product } from "@/data/types";
import { ProductMedia } from "./ProductMedia";
import { SelectionButton } from "./SelectionButton";
import { cx } from "@/lib/utils";

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
 * İmleç kartın üzerinde gezerken çanta hafifçe eğilir ve gölgesi derinleşir —
 * kaydırmanın "fiziği" burada başlıyor. Hareket azaltma tercihinde eğim kapanır.
 */
export function ProductCard({
  product,
  locale,
  labels,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className,
}: {
  product: Product;
  locale: Locale;
  labels: CardLabels;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [colorIndex, setColorIndex] = useState(0);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [2.5, -2.5]), {
    stiffness: 180,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-3, 3]), {
    stiffness: 180,
    damping: 20,
  });

  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    px.set(0);
    py.set(0);
  }

  const colorLabel = product.colors[colorIndex]?.name[locale] ?? "";

  return (
    <div className={cx("group relative", className)}>
      <Link
        href={`/${locale}/urun/${product.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`${product.name[locale]} — ${labels.form}`}
      >
        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{ perspective: 900 }}
        >
          <motion.div
            style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative transition-shadow duration-500 group-hover:shadow-[0_28px_60px_-24px_var(--shadow)]"
          >
            <ProductMedia
              product={product}
              colorIndex={colorIndex}
              locale={locale}
              sizes={sizes}
              priority={priority}
            />

            {product.isNew && (
              <span className="pointer-events-none absolute left-3 top-3 bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-ground">
                {labels.isNew}
              </span>
            )}
          </motion.div>
        </div>
      </Link>

      {/* Seçkiye ekle — kartın dışında ki link tıklamasıyla çakışmasın */}
      <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
        <SelectionButton
          slug={product.slug}
          color={product.colors[colorIndex]?.key}
          labels={labels}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg leading-snug text-ink">
            <Link href={`/${locale}/urun/${product.slug}`} className="hover:text-accent">
              {product.name[locale]}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-ink-40">
            {labels.form}
          </p>
        </div>
        <span className="shrink-0 pt-1 font-mono text-[10px] tracking-wider text-ink-40">
          {product.code}
        </span>
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
                i === colorIndex
                  ? "scale-110 border-ink"
                  : "border-line-strong hover:scale-110",
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
