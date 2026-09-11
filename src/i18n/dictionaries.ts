import "server-only";
import type { Locale } from "@/data/types";
import tr from "./tr.json";
import en from "./en.json";

export type Dictionary = typeof tr;

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en: en as Dictionary };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
