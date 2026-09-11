import type { Locale } from "@/data/types";

export const locales = ["tr", "en"] as const;
export const defaultLocale: Locale = "tr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Bir locale'i doğrular, geçersizse varsayılana düşer. */
export function normalizeLocale(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

export const localeLabel: Record<Locale, string> = { tr: "TR", en: "EN" };

/** hreflang alternates için */
export const htmlLang: Record<Locale, string> = { tr: "tr-TR", en: "en" };
