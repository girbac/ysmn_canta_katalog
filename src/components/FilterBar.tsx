"use client";

import Link from "next/link";
import { useState } from "react";
import type { Form, Locale, Segment } from "@/data/types";
import type { MaterialKey } from "@/data/materials";
import { materialName } from "@/data/materials";
import {
  activeFilterCount,
  buildQuery,
  hasActiveFilters,
  type Filters,
  type Sort,
} from "@/lib/filters";
import { BagSilhouette } from "./BagSilhouette";
import { cx } from "@/lib/utils";

export type FilterLabels = {
  color: string;
  form: string;
  material: string;
  all: string;
  clear: string;
  showFilters: string;
  hideFilters: string;
  removeFilter: string;
  sortLabel: string;
  sorts: Record<Sort, string>;
  forms: Record<Form, string>;
  segments: Record<Segment, string>;
  colorNames: Record<string, string>;
  materialNames: Record<string, string>;
};

/** Silüet tonlaması — deri rengi, iki modda da zeminden ayrışıyor */
const TILE_HEX = "#8A6A4F";

/**
 * Filtre bir duvar değil, araç.
 *
 * Her zaman açık olan tek şey **form** — çünkü insan çantayı önce
 * "nasıl taşıyacağım" diye seçer. Bölüm/renk/malzeme/sıralama "Filtrele"
 * düğmesinin arkasında durur; seçilenler panel kapalıyken de silinebilir
 * etiket olarak görünür, yani ne seçtiğini görmek için paneli açman gerekmez.
 *
 * Durum URL'de: her seçim bir <Link>. Paylaşılabilir adres, çalışan geri tuşu,
 * sunucuda render edilen sonuçlar.
 *
 * Sunulan seçenekler o anki bölüme göre süzülür (bkz. availableOptions) —
 * sıfır sonuca götüren bir filtre hiç gösterilmez.
 */
export function FilterBar({
  locale,
  filters,
  forms,
  colors,
  materials,
  colorHex,
  resultCount,
  labels,
}: {
  locale: Locale;
  filters: Filters;
  /** Bu bölümde gerçekten bulunan formlar */
  forms: Form[];
  colors: string[];
  materials: MaterialKey[];
  /** renk anahtarı → hex (sunucudan düz nesne olarak gelir) */
  colorHex: Record<string, string>;
  /** Sonuç sayısı yazısı — ikincil çubukta, ayrı satır harcamadan */
  resultCount: string;
  labels: FilterLabels;
}) {
  const base = `/${locale}/koleksiyon`;
  const to = (patch: Partial<Filters>) => `${base}${buildQuery(filters, patch)}`;

  const count = activeFilterCount(filters);

  // Paylaşılan filtreli bir adrese girildiğinde panel açık başlasın ki
  // ziyaretçi neyin süzülü olduğunu görsün. Aynı route içinde gezinirken
  // App Router bu bileşeni yeniden bağlamadığı için durum korunur.
  const [open, setOpen] = useState(count > 0);

  const SORTS: Sort[] = ["katalog", "yeni", "isim"];

  /** Panel kapalıyken bile görünen, tek tıkla kaldırılabilir seçimler */
  const chips = [
    filters.bolum && {
      key: `bolum-${filters.bolum}`,
      label: labels.segments[filters.bolum],
      href: to({ bolum: undefined }),
    },
    filters.renk && {
      key: `renk-${filters.renk}`,
      label: labels.colorNames[filters.renk] ?? filters.renk,
      href: to({ renk: undefined }),
      hex: colorHex[filters.renk],
    },
    filters.malzeme && {
      key: `malzeme-${filters.malzeme}`,
      label: labels.materialNames[filters.malzeme] ?? filters.malzeme,
      href: to({ malzeme: undefined }),
    },
    filters.sirala !== "katalog" && {
      key: `sirala-${filters.sirala}`,
      label: labels.sorts[filters.sirala],
      href: to({ sirala: "katalog" }),
    },
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; hex?: string }>;

  return (
    <div className="no-print border-y border-line">
      {/* ── Birincil: form ── */}
      <div className="py-4">
        <ul className="rail-scroll flex gap-3 overflow-x-auto">
          <FormTile
            href={to({ form: undefined })}
            label={labels.all}
            active={!filters.form}
          />
          {forms.map((f) => (
            <FormTile
              key={f}
              href={to({ form: filters.form === f ? undefined : f })}
              label={labels.forms[f]}
              active={filters.form === f}
              form={f}
            />
          ))}
        </ul>
      </div>

      {/* ── İkincil: panel düğmesi, sonuç sayısı, seçili etiketler ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cx(
            "inline-flex items-center gap-2 rounded-card border px-4 py-2.5 text-body font-medium transition-colors duration-200",
            open || count > 0
              ? "border-ink bg-ground-2 text-ink"
              : "border-line-strong bg-ground-2 text-ink-60 hover:border-ink hover:text-ink",
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M1 2.5h10M3 6h6M5 9.5h2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          {open ? labels.hideFilters : labels.showFilters}
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-caption leading-none text-ground tabular-nums">
              {count}
            </span>
          )}
        </button>

        {chips.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            aria-label={`${labels.removeFilter}: ${c.label}`}
            className="group inline-flex items-center gap-2 rounded-card border border-line-strong bg-ground-2 py-2 pl-3 pr-2.5 text-caption text-ink-60 transition-colors hover:border-ink hover:text-ink"
          >
            {c.hex && (
              <span
                className="h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: c.hex }}
              />
            )}
            {c.label}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M2.5 2.5l5 5M7.5 2.5l-5 5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        ))}

        <span className="text-caption text-ink-40" aria-live="polite">
          {resultCount}
        </span>

        {hasActiveFilters(filters) && (
          <Link
            href={base}
            className="ml-auto text-caption text-ink-60 underline-offset-4 hover:text-ink hover:underline"
          >
            {labels.clear}
          </Link>
        )}
      </div>

      {/* ── Panel ── */}
      {open && (
        <div className="flex flex-col gap-5 border-t border-line py-6">
          <Row label={labels.color}>
            {colors.map((key) => {
              const active = filters.renk === key;
              const name = labels.colorNames[key] ?? key;
              return (
                <Link
                  key={key}
                  href={to({ renk: active ? undefined : (key as Filters["renk"]) })}
                  aria-label={name}
                  aria-current={active ? "true" : undefined}
                  title={name}
                  className={cx(
                    "grid h-8 w-8 place-items-center rounded-full border transition-transform duration-200 hover:scale-110",
                    active ? "scale-110 border-ink" : "border-line-strong",
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: colorHex[key] ?? TILE_HEX }}
                  />
                  {/* Renk körü / ekran okuyucu kullanıcıları için isim */}
                  <span className="sr-only">{name}</span>
                </Link>
              );
            })}
          </Row>

          <Row label={labels.material}>
            <Pill href={to({ malzeme: undefined })} active={!filters.malzeme}>
              {labels.all}
            </Pill>
            {materials.map((m) => (
              <Pill
                key={m}
                href={to({ malzeme: filters.malzeme === m ? undefined : m })}
                active={filters.malzeme === m}
              >
                {materialName(m)[locale]}
              </Pill>
            ))}
          </Row>

          <Row label={labels.sortLabel}>
            {SORTS.map((s) => (
              <Pill key={s} href={to({ sirala: s })} active={filters.sirala === s}>
                {labels.sorts[s]}
              </Pill>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

/** Form karosu — silüetin kendisi etiket görevi görüyor */
function FormTile({
  href,
  label,
  active,
  form,
}: {
  href: string;
  label: string;
  active: boolean;
  form?: Form;
}) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className="group block w-[104px]"
      >
        <div
          className={cx(
            "grid aspect-square place-items-center rounded-tile border bg-ground-2 transition-colors duration-200",
            active ? "border-ink" : "border-transparent group-hover:border-line-strong",
          )}
        >
          {form ? (
            <BagSilhouette
              form={form}
              hex={TILE_HEX}
              idSuffix={`filter-${form}`}
              backdrop={false}
              className="h-full w-full"
            />
          ) : (
            /* "Tümü" karosu: altındaki etiket zaten adını söylüyor,
               içine nötr bir ızgara işareti koyuyoruz */
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <g fill="none" stroke="var(--ink)" strokeOpacity="0.32" strokeWidth="1.4">
                <rect x="1" y="1" width="10" height="10" rx="1.5" />
                <rect x="15" y="1" width="10" height="10" rx="1.5" />
                <rect x="1" y="15" width="10" height="10" rx="1.5" />
                <rect x="15" y="15" width="10" height="10" rx="1.5" />
              </g>
            </svg>
          )}
        </div>
        <p
          className={cx(
            /* min-h: iki satıra taşan etiketler sırayı bozmasın */
            "mt-2 min-h-[2.6em] text-center text-caption leading-tight transition-colors",
            active ? "text-ink" : "text-ink-60 group-hover:text-ink",
          )}
        >
          {label}
        </p>
      </Link>
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="w-24 shrink-0 eyebrow text-ink-40">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cx(
        "rounded-card border px-4 py-2 text-caption transition-colors duration-200",
        active
          ? "border-ink bg-ink text-ground"
          : "border-line-strong bg-ground-2 text-ink-60 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
