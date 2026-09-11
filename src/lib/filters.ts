import type { Form, Locale, Product, Segment } from "@/data/types";
import type { ColorKey } from "@/data/colors";
import type { MaterialKey } from "@/data/materials";
import { products } from "@/data/products";

export type Sort = "katalog" | "yeni" | "isim";

export type Filters = {
  bolum?: Segment;
  form?: Form;
  renk?: ColorKey;
  malzeme?: MaterialKey;
  sirala: Sort;
};

const SEGMENTS: Segment[] = ["kadin", "erkek"];
const FORMS: Form[] = ["tote", "omuz", "baguette", "clutch", "sirt", "evrak", "postaci"];
const SORTS: Sort[] = ["katalog", "yeni", "isim"];

/** Next.js searchParams değeri tek string ya da dizi olabilir */
type Raw = Record<string, string | string[] | undefined>;

function one(raw: Raw, key: string): string | undefined {
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/**
 * URL sorgu parametrelerini filtreye çevirir.
 * Tanınmayan değerler sessizce yok sayılır — elle yazılmış bir adres
 * sayfayı bozmaz.
 */
export function parseFilters(raw: Raw, knownColors: readonly string[], knownMaterials: readonly string[]): Filters {
  return {
    bolum: pick(one(raw, "bolum"), SEGMENTS),
    form: pick(one(raw, "form"), FORMS),
    renk: pick(one(raw, "renk"), knownColors as readonly ColorKey[]),
    malzeme: pick(one(raw, "malzeme"), knownMaterials as readonly MaterialKey[]),
    sirala: pick(one(raw, "sirala"), SORTS) ?? "katalog",
  };
}

export function applyFilters(f: Filters, locale: Locale): Product[] {
  const list = products.filter((p) => {
    if (f.bolum && p.segment !== f.bolum) return false;
    if (f.form && p.form !== f.form) return false;
    if (f.malzeme && p.material !== f.malzeme) return false;
    if (f.renk && !p.colors.some((c) => c.key === f.renk)) return false;
    return true;
  });

  switch (f.sirala) {
    case "yeni":
      return [...list].sort(
        (a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) || a.order - b.order,
      );
    case "isim":
      // Türkçe sıralama: "İ" ve "ı" doğru yerde dursun
      return [...list].sort((a, b) =>
        a.name[locale].localeCompare(b.name[locale], locale === "tr" ? "tr" : "en"),
      );
    default:
      return list;
  }
}

/** Aktif filtre var mı? "Temizle" düğmesini göstermek için. */
export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.bolum || f.form || f.renk || f.malzeme) || f.sirala !== "katalog";
}

/**
 * Mevcut filtrenin üstüne bir değişiklik uygulayıp sorgu dizesi üretir.
 * Aynı değere tekrar basmak o filtreyi kaldırır (aç/kapa).
 */
export function buildQuery(current: Filters, patch: Partial<Filters>): string {
  const next: Record<string, string> = {};
  const merged = { ...current, ...patch };

  if (merged.bolum) next.bolum = merged.bolum;
  if (merged.form) next.form = merged.form;
  if (merged.renk) next.renk = merged.renk;
  if (merged.malzeme) next.malzeme = merged.malzeme;
  if (merged.sirala && merged.sirala !== "katalog") next.sirala = merged.sirala;

  const qs = new URLSearchParams(next).toString();
  return qs ? `?${qs}` : "";
}
