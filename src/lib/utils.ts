import type { Locale } from "@/data/types";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** "{n} ürün" → "12 ürün" */
export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, key) =>
    key in values ? String(values[key]) : m,
  );
}

/**
 * Ürün ölçüsünü okunur hale getirir: 30 × 36 × 13 cm
 *
 * Sıra yükseklik → en → derinlik. Alan adları (w/h/d) veride olduğu gibi
 * kalıyor; değişen yalnızca okunuş sırası, ve yönetim formundaki alanlar
 * da aynı sırada duruyor ki panelde girilenle sitede görünen karışmasın.
 */
export function formatDimensions(d: { w: number; h: number; d: number }, cm: string) {
  return `${d.h} × ${d.w} × ${d.d} ${cm}`;
}

/**
 * Fiyatı para birimiyle yazar: ₺12.500
 *
 * Kuruş gösterilmiyor — katalog fiyatları tam sayı, ".00" kuyruğu
 * tipografiyi bozuyor. Biçim seçenekleri açıkça veriliyor (varsayılana
 * bırakılmıyor) ki sunucuda basılan metin ile tarayıcının hidrasyonda
 * ürettiği metin birebir aynı olsun.
 */
export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Seçkinin toplamı.
 *
 * Fiyatı girilmemiş ürünler toplama katılmaz ama sayılır — arayüz
 * "bu toplam eksik" diyebilsin diye. Fiyatsız ürünü sıfır saymak
 * müşteriye yanlış bir rakam göstermek olurdu.
 */
export function selectionTotal(
  rows: Array<{ price?: number; qty: number }>,
): { total: number; priced: number; unpriced: number } {
  let total = 0;
  let priced = 0;
  let unpriced = 0;
  for (const r of rows) {
    if (typeof r.price === "number") {
      total += r.price * r.qty;
      priced++;
    } else {
      unpriced++;
    }
  }
  return { total, priced, unpriced };
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
