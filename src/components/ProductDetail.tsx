"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Locale, Product } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { materialName } from "@/data/materials";
import { ProductMedia } from "./ProductMedia";
import { ScaleCompare } from "./ScaleCompare";
import { SelectionButton } from "./SelectionButton";
import { cx, formatDimensions, whatsappUrl } from "@/lib/utils";

/**
 * Ürün detayı. Hem tam sayfada hem de ızgaradan açılan modalda
 * aynı bileşen kullanılıyor — tek kaynak, iki kadraj.
 */
export function ProductDetail({
  product,
  locale,
  t,
  whatsapp,
  compact = false,
}: {
  product: Product;
  locale: Locale;
  t: Dictionary;
  whatsapp: string;
  /** Modal içinde: daha dar boşluklar, geri bağlantısı yok */
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const [colorIndex, setColorIndex] = useState(0);
  const color = product.colors[colorIndex];

  const askMessage = `${t.selection.whatsappIntro}\n\n• ${product.name[locale]} (${product.code}) — ${color.name[locale]}\n\n${t.selection.whatsappOutro}`;

  return (
    <article className={cx("grid gap-10 lg:grid-cols-2 lg:gap-16", compact && "lg:gap-12")}>
      {/* ── Görsel ── */}
      <div>
        <motion.div
          key={color.key}
          initial={{ opacity: reduce ? 1 : 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <ProductMedia
            product={product}
            colorIndex={colorIndex}
            locale={locale}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </motion.div>

        {product.colors.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {product.colors.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-pressed={i === colorIndex}
                aria-label={c.name[locale]}
                className={cx(
                  "border transition-colors",
                  i === colorIndex ? "border-ink" : "border-transparent hover:border-line-strong",
                )}
              >
                <ProductMedia
                  product={product}
                  colorIndex={i}
                  locale={locale}
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Künye ── */}
      <div className={cx("flex flex-col", compact ? "lg:pt-2" : "lg:pt-6")}>
        <div className="flex items-start justify-between gap-6">
          <div>
            {product.isNew && (
              <span className="mb-3 inline-block bg-ink px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-ground">
                {t.product.new}
              </span>
            )}
            <h1
              className={cx(
                "font-display leading-[1.06] tracking-[-0.02em] text-ink",
                compact ? "text-[clamp(1.6rem,3.4vw,2.6rem)]" : "text-[clamp(1.9rem,4.4vw,3.4rem)]",
              )}
            >
              {product.name[locale]}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-40">
              {t.forms[product.form]}
            </p>
          </div>
          <span className="shrink-0 pt-1 font-mono text-[11px] tracking-wider text-ink-40">
            {product.code}
          </span>
        </div>

        {/* Renk seçimi */}
        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-40">
            {t.product.colors}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.colors.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-pressed={i === colorIndex}
                title={c.name[locale]}
                className={cx(
                  "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition-colors",
                  i === colorIndex
                    ? "border-ink text-ink"
                    : "border-line-strong text-ink-60 hover:border-ink hover:text-ink",
                )}
              >
                <span
                  className="h-5 w-5 rounded-full border border-line"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name[locale]}
              </button>
            ))}
          </div>
        </div>

        {/* Teknik künye */}
        <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-7 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-40">
              {t.product.material}
            </dt>
            <dd className="mt-1.5 text-ink">{materialName(product.material)[locale]}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-40">
              {t.product.dimensions}{" "}
              <span className="normal-case tracking-normal">({t.product.dimensionsHint})</span>
            </dt>
            <dd className="mt-1.5 tabular-nums text-ink">
              {formatDimensions(product.dimensions, t.common.cm)}
            </dd>
          </div>
          {product.strap && (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-40">
                {t.product.strap}
              </dt>
              <dd className="mt-1.5 text-ink">{t.product.strapLabels[product.strap]}</dd>
            </div>
          )}
        </dl>

        {/* Detaylar */}
        <div className="mt-8 border-t border-line pt-7">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-40">
            {t.product.features}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-60">
            {product.features.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="text-accent">
                  —
                </span>
                {f[locale]}
              </li>
            ))}
          </ul>
        </div>

        {/* Aksiyonlar */}
        <div className="mt-10 flex flex-wrap gap-3">
          <SelectionButton
            slug={product.slug}
            color={color.key}
            variant="full"
            labels={{ add: t.product.add, added: t.product.added, remove: t.product.remove }}
          />
          <a
            href={whatsappUrl(whatsapp, askMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center border border-line-strong px-6 py-3 text-sm uppercase tracking-wide text-ink-60 transition-colors hover:border-ink hover:text-ink"
          >
            {t.product.askOnWhatsApp}
          </a>
        </div>

        {!compact && (
          <Link
            href={`/${locale}/koleksiyon`}
            className="mt-10 self-start border-b border-line-strong pb-1 text-xs uppercase tracking-[0.16em] text-ink-40 hover:text-ink"
          >
            ← {t.product.backToCollection}
          </Link>
        )}
      </div>

      {/* ── Ölçek ── */}
      <div className="lg:col-span-2">
        <ScaleCompare
          product={product}
          labels={{
            title: t.product.scaleTitle,
            lead: t.product.scaleLead,
            a4: t.product.scaleA4,
            phone: t.product.scalePhone,
            person: t.product.scalePerson,
            cm: t.common.cm,
          }}
        />
      </div>
    </article>
  );
}
