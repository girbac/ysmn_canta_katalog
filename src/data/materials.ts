import type { Localized } from "./types";

/** Malzeme sözlüğü. Filtrede anahtar, arayüzde çevirisi kullanılır. */
const MATERIALS = {
  deri: { tr: "Hakiki Deri", en: "Genuine Leather" },
  tokluk: { tr: "Tokluk Deri", en: "Full-Grain Leather" },
  saffiano: { tr: "Saffiano Deri", en: "Saffiano Leather" },
  suet: { tr: "Süet", en: "Suede" },
  nubuk: { tr: "Nubuk", en: "Nubuck" },
  kanvas: { tr: "Kanvas & Deri", en: "Canvas & Leather" },
  vegan: { tr: "Vegan Deri", en: "Vegan Leather" },
} as const satisfies Record<string, Localized>;

export type MaterialKey = keyof typeof MATERIALS;

export const materialKeys = Object.keys(MATERIALS) as MaterialKey[];

export function materialName(key: MaterialKey): Localized {
  return MATERIALS[key];
}
