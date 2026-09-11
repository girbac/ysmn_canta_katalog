"use client";

import Link from "next/link";
import type { Form, Locale, Segment } from "@/data/types";
import type { MaterialKey } from "@/data/materials";
import { materialName } from "@/data/materials";
import { buildQuery, hasActiveFilters, type Filters, type Sort } from "@/lib/filters";
import { cx } from "@/lib/utils";

export type FilterLabels = {
  filters: string;
  color: string;
  form: string;
  material: string;
  segment: string;
  all: string;
  clear: string;
  sortLabel: string;
  sorts: Record<Sort, string>;
  forms: Record<Form, string>;
  segments: Record<Segment, string>;
  colorNames: Record<string, string>;
};

/**
 * Dropdown yok. Filtreler fiziksel: renk pastilleri, form ve malzeme etiketleri.
 * Her seçim bir <Link> — yani durum URL'de. Paylaşılabilir, geri tuşu çalışır,
 * sonuçlar sunucuda render edilir.
 */
export function FilterBar({
  locale,
  filters,
  colors,
  materials,
  colorHex,
  labels,
}: {
  locale: Locale;
  filters: Filters;
  colors: string[];
  materials: MaterialKey[];
  /** renk anahtarı → hex (sunucudan düz nesne olarak gelir) */
  colorHex: Record<string, string>;
  labels: FilterLabels;
}) {
  const base = `/${locale}/koleksiyon`;
  const to = (patch: Partial<Filters>) => `${base}${buildQuery(filters, patch)}`;

  const FORMS: Form[] = ["tote", "omuz", "baguette", "clutch", "sirt", "evrak", "postaci"];
  const SEGMENTS: Segment[] = ["kadin", "erkek"];
  const SORTS: Sort[] = ["katalog", "yeni", "isim"];

  return (
    <div className="no-print border-y border-line py-6">
      <div className="flex flex-col gap-6">
        <Row label={labels.segment}>
          <Pill href={to({ bolum: undefined })} active={!filters.bolum}>
            {labels.all}
          </Pill>
          {SEGMENTS.map((s) => (
            <Pill
              key={s}
              href={to({ bolum: filters.bolum === s ? undefined : s })}
              active={filters.bolum === s}
            >
              {labels.segments[s]}
            </Pill>
          ))}
        </Row>

        <Row label={labels.form}>
          <Pill href={to({ form: undefined })} active={!filters.form}>
            {labels.all}
          </Pill>
          {FORMS.map((f) => (
            <Pill
              key={f}
              href={to({ form: filters.form === f ? undefined : f })}
              active={filters.form === f}
            >
              {labels.forms[f]}
            </Pill>
          ))}
        </Row>

        <Row label={labels.color}>
          <div className="flex flex-wrap items-center gap-2">
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
                    "relative grid h-8 w-8 place-items-center rounded-full border transition-transform duration-200 hover:scale-110",
                    active ? "scale-110 border-ink" : "border-line-strong",
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: colorHex[key] ?? "#8A6A4F" }}
                  />
                  {/* Renk körü / ekran okuyucu kullanıcıları için isim */}
                  <span className="sr-only">{name}</span>
                </Link>
              );
            })}
            {filters.renk && (
              <Link
                href={to({ renk: undefined })}
                className="ml-1 text-xs uppercase tracking-[0.14em] text-ink-40 underline-offset-4 hover:text-ink hover:underline"
              >
                {labels.all}
              </Link>
            )}
          </div>
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

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <Row label={labels.sortLabel}>
            {SORTS.map((s) => (
              <Pill key={s} href={to({ sirala: s })} active={filters.sirala === s}>
                {labels.sorts[s]}
              </Pill>
            ))}
          </Row>

          {hasActiveFilters(filters) && (
            <Link
              href={base}
              className="text-xs uppercase tracking-[0.14em] text-accent underline-offset-4 hover:underline"
            >
              {labels.clear}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="w-20 shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-40">
        {label}
      </span>
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
        "rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors duration-200",
        active
          ? "border-ink bg-ink text-ground"
          : "border-line-strong text-ink-60 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
