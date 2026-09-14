import type { ColorVariant, Localized } from "./types";

/**
 * Paylaşılan renk paleti. Ürünler buradan varyant üretir ki
 * filtre pastilleri tüm katalogda tutarlı olsun.
 */
const PALETTE = {
  siyah: { tr: "Siyah", en: "Black", hex: "#14110F" },
  kahve: { tr: "Koyu Kahve", en: "Espresso", hex: "#40301F" },
  taba: { tr: "Taba", en: "Tan", hex: "#A9784E" },
  konyak: { tr: "Konyak", en: "Cognac", hex: "#8B4A2B" },
  krem: { tr: "Krem", en: "Cream", hex: "#E3D5BE" },
  bej: { tr: "Bej", en: "Beige", hex: "#C9B79C" },
  bordo: { tr: "Bordo", en: "Burgundy", hex: "#5C1F2B" },
  lacivert: { tr: "Lacivert", en: "Navy", hex: "#1E2A44" },
  pudra: { tr: "Pudra", en: "Blush", hex: "#D8AFA2" },
  zeytin: { tr: "Zeytin", en: "Olive", hex: "#4A4F35" },
  antrasit: { tr: "Antrasit", en: "Charcoal", hex: "#35373B" },
  vizon: { tr: "Vizon", en: "Taupe", hex: "#8C7B6B" },
} as const;

export type ColorKey = keyof typeof PALETTE;

export const colorKeys = Object.keys(PALETTE) as ColorKey[];

export function colorName(key: ColorKey): Localized {
  const c = PALETTE[key];
  return { tr: c.tr, en: c.en };
}

export function colorHex(key: ColorKey): string {
  return PALETTE[key].hex;
}

/** Ürün varyantı üretir. images boş bırakılır; fotoğraf geldiğinde doldurulur. */
export function variant(key: ColorKey, images: string[] = []): ColorVariant {
  return { key, name: colorName(key), hex: colorHex(key), images };
}

/**
 * Renk sırasını korur.
 *
 * Kaydetme eskiden listeyi baştan palet sırasına diziyordu. İlk renk
 * kartlarda kapak görseli olduğu için bu, ürünün adını değiştirmek gibi
 * alakasız bir işlemin kapak rengini değiştirmesine yol açıyordu — hatta
 * fotoğrafı olmayan bir rengi öne alıp ürünü fotoğrafsız gösteriyordu.
 *
 * Artık mevcut sıra olduğu gibi kalıyor, yeni işaretlenen renkler palet
 * sırasına göre araya giriyor.
 */
export function orderColors(previous: string[], selected: ColorKey[]): ColorKey[] {
  const kalan = previous.filter((k): k is ColorKey => selected.includes(k as ColorKey));
  const yeniler = colorKeys.filter((k) => selected.includes(k) && !previous.includes(k));

  const sonuc = [...kalan];
  for (const yeni of yeniler) {
    const yer = sonuc.findIndex((k) => colorKeys.indexOf(k) > colorKeys.indexOf(yeni));
    if (yer === -1) sonuc.push(yeni);
    else sonuc.splice(yer, 0, yeni);
  }
  return sonuc;
}
