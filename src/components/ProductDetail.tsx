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
import { cx, formatDimensions, formatPrice, whatsappUrl } from "@/lib/utils";

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
  /** Seçili rengin kaçıncı fotoğrafı büyük alanda duruyor */
  const [imageIndex, setImageIndex] = useState(0);
  /** Dokunmatikte büyüteç açık mı — masaüstünde hover hallediyor */
  const [zoomAcik, setZoomAcik] = useState(false);
  const color = product.colors[colorIndex];

  /** Renk değişince galeri başa döner — yeni rengin fotoğraf sayısı farklı */
  function selectColor(i: number) {
    setColorIndex(i);
    setImageIndex(0);
    setZoomAcik(false);
  }

  function selectImage(i: number) {
    setImageIndex(i);
    setZoomAcik(false);
  }

  /**
   * Büyüteç: imlecin görsel içindeki yüzdelik konumu, yakınlaşmanın
   * merkezi oluyor. Durum React'te tutulmuyor — her fare hareketinde
   * yeniden render etmek gereksiz; doğrudan CSS değişkeni yazılıyor.
   */
  function zoomOdagi(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--zoom-x",
      `${((e.clientX - r.left) / r.width) * 100}%`,
    );
    e.currentTarget.style.setProperty(
      "--zoom-y",
      `${((e.clientY - r.top) / r.height) * 100}%`,
    );
  }

  /**
   * Dokunmatikte tek dokunuş yakınlaştırıyor, ikincisi geri çıkarıyor.
   * Masaüstünde hover zaten hallediyor, orada tıklamanın bir işi yok —
   * ayrımı ekranın kendisi söylüyor, cihaz tahmin edilmiyor.
   */
  function onZoomTap(e: React.MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(hover: hover)").matches) return;
    zoomOdagi(e);
    setZoomAcik((v) => !v);
  }

  const askMessage = `${t.selection.whatsappIntro}\n\n• ${product.name[locale]} (${product.code}) — ${color.name[locale]}\n\n${t.selection.whatsappOutro}`;

  return (
    <article className={cx("grid gap-7 lg:grid-cols-2 lg:gap-16", compact && "lg:gap-12")}>
      {/* ── Görsel ── */}
      <div>
        <motion.div
          key={`${color.key}-${imageIndex}`}
          initial={{ opacity: reduce ? 1 : 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className={cx("zoom-alan", zoomAcik && "zoom-acik")}
            onMouseMove={zoomOdagi}
            onClick={onZoomTap}
          >
            <ProductMedia
              product={product}
              colorIndex={colorIndex}
              imageIndex={imageIndex}
              locale={locale}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </motion.div>

        {/* Seçili rengin diğer fotoğrafları.
            Burada eskiden renk şeridi vardı ama aşağıdaki isimli renk
            pastilleri aynı işi yapıyordu; ikinci ve üçüncü fotoğraflar ise
            hiçbir yerde görünmüyordu. Şerit artık galeri. */}
        {color.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {color.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => selectImage(i)}
                aria-pressed={i === imageIndex}
                aria-label={`${product.name[locale]} — ${i + 1}`}
                className={cx(
                  "rounded-tile border transition-colors",
                  i === imageIndex ? "border-ink" : "border-transparent hover:border-line-strong",
                )}
              >
                <ProductMedia
                  product={product}
                  colorIndex={colorIndex}
                  imageIndex={i}
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
              <span className="mb-3 inline-block rounded-tile bg-ink px-2.5 py-1 text-caption font-medium uppercase text-ground">
                {t.product.new}
              </span>
            )}
            <h1
              className={cx(
                "font-whisper leading-[1.06] tracking-[-0.04em] text-ink",
                compact ? "text-[clamp(1.8rem,3.4vw,38px)]" : "text-[clamp(2rem,4.4vw,58px)]",
              )}
            >
              {product.name[locale]}
            </h1>
            <p className="mt-2 text-body text-ink-60">{t.forms[product.form]}</p>
            {typeof product.price === "number" && (
              <p className="mt-5 text-heading-sm text-ink tabular-nums">
                {formatPrice(product.price, locale)}
              </p>
            )}
          </div>
          {product.name[locale] !== product.code && (
            <span className="shrink-0 pt-2 text-caption text-ink-40 tabular-nums">
              {product.code}
            </span>
          )}
        </div>

        {/* Renk seçimi */}
        <div className="mt-8">
          <p className="eyebrow text-ink-40">{t.product.colors}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {product.colors.map((c, i) => (
              <button
                key={c.key}
                type="button"
                onClick={() => selectColor(i)}
                aria-pressed={i === colorIndex}
                title={c.name[locale]}
                className={cx(
                  "flex items-center gap-2 rounded-card border bg-ground-2 py-1.5 pl-1.5 pr-3.5 text-caption transition-colors",
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

        {/*
          Aksiyonlar künyeden ÖNCE.
          Ölçüm: eskiden buton sayfanın 813 px altındaydı; 1440×760
          dizüstünde ve mobilde (1230 px) kaydırmadan hiç görünmüyordu.
          Ürünü sepete atma kararı, malzeme ve ölçü okumadan önce verilir.
        */}
        <div className="mt-9 flex flex-wrap gap-3 border-t border-line pt-7">
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
            className="inline-flex items-center rounded-card border border-line-strong bg-ground-2 px-6 py-4 text-body font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
          >
            {t.product.askOnWhatsApp}
          </a>
        </div>

        {/* Teknik künye */}
        <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-7 text-body">
          <div>
            <dt className="eyebrow text-ink-40">
              {t.product.material}
            </dt>
            <dd className="mt-1.5 text-ink">{materialName(product.material)[locale]}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-40">
              {t.product.dimensions}{" "}
              <span className="normal-case tracking-normal">({t.product.dimensionsHint})</span>
            </dt>
            <dd className="mt-1.5 tabular-nums text-ink">
              {formatDimensions(product.dimensions, t.common.cm)}
            </dd>
          </div>
          {product.strap && (
            <div>
              <dt className="eyebrow text-ink-40">
                {t.product.strap}
              </dt>
              <dd className="mt-1.5 text-ink">{t.product.strapLabels[product.strap]}</dd>
            </div>
          )}
        </dl>

        {/* Detaylar */}
        <div className="mt-8 border-t border-line pt-7">
          <p className="eyebrow text-ink-40">{t.product.features}</p>
          <ul className="mt-3 space-y-1.5 text-body text-ink-60">
            {product.features.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="text-ink-40">
                  —
                </span>
                {f[locale]}
              </li>
            ))}
          </ul>
        </div>

        {!compact && (
          <Link
            href={`/${locale}/koleksiyon`}
            className="mt-10 self-start border-b border-line-strong pb-1 text-body text-ink-60 hover:text-ink"
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
