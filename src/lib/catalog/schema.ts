import { z } from "zod";
import { materialKeys } from "@/data/materials";

/**
 * Katalogun tek doğruluk kaynağı.
 *
 * Aynı şema üç yerde kullanılıyor: depodan okunan veriyi doğrulamak,
 * admin formundan geleni doğrulamak ve TypeScript tiplerini türetmek.
 * Böylece panelden girilen bir veri, katalogun beklediğinden farklı
 * olamaz.
 */

const localized = z.object({
  tr: z.string().trim().min(1, "Türkçe karşılığı zorunlu"),
  en: z.string().trim().min(1, "İngilizce karşılığı zorunlu"),
});

export const segments = ["kadin", "erkek"] as const;
export const forms = [
  "tote",
  "omuz",
  "baguette",
  "clutch",
  "sirt",
  "evrak",
  "postaci",
] as const;
export const straps = ["ayarlanabilir", "zincir", "sabit", "yok"] as const;

/** Adres ve dosya yolunda kullanıldığı için ASCII ve küçük harf */
const slug = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Yalnızca küçük harf, rakam ve tire (ör. meridyen-tote)");

/**
 * Renk anahtarı.
 *
 * Eskiden kapalı bir liste (`z.enum`) idi; artık serbest. Panelde hazır
 * paletin dışında renk tanımlanabiliyor ve her ürün rengin adını ve tonunu
 * kendi içinde saklıyor — yani palet, kataloğun sınırı değil yalnızca bir
 * kısayol. Biçim yine de dar tutuluyor: anahtar filtre adresinde geçiyor.
 */
const colorKey = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Renk anahtarı yalnızca küçük harf, rakam ve tire içerebilir");

const colorVariant = z.object({
  key: colorKey,
  name: localized,
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /**
   * Görsel kaynağı. Üç biçim kabul edilir:
   *  - "taba-1.webp"              → public/products/<slug>/ altından
   *  - "/products/x/taba-1.webp"  → köke göre
   *  - "https://.../taba-1.webp"  → uzak depo (Vercel Blob)
   */
  images: z.array(z.string().trim().min(1)).default([]),
});

export const productSchema = z.object({
  slug,
  code: z.string().trim().min(1).max(40),
  name: localized,
  segment: z.enum(segments),
  form: z.enum(forms),
  material: z.enum(materialKeys as [string, ...string[]]),
  dimensions: z.object({
    w: z.number().int().min(1).max(200),
    h: z.number().int().min(1).max(200),
    d: z.number().int().min(1).max(100),
  }),
  colors: z.array(colorVariant).min(1, "En az bir renk gerekli"),
  features: z.array(localized).default([]),
  strap: z.enum(straps).optional(),
  isNew: z.boolean().optional(),
  price: z.number().min(0).optional(),
});

export const catalogSchema = z.array(productSchema);

/** Depodan okunan ham veri — `order` listedeki sıradan türetilir */
export type StoredProduct = z.infer<typeof productSchema>;

/**
 * Admin formundan gelen gövdeyi doğrular ve okunur hata döner.
 * Hatalar alan yoluna göre gruplanır ki form doğru yerde gösterebilsin.
 */
export function parseProduct(input: unknown):
  | { ok: true; product: StoredProduct }
  | { ok: false; errors: Record<string, string> } {
  const result = productSchema.safeParse(input);
  if (result.success) return { ok: true, product: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".") || "_";
    if (!errors[path]) errors[path] = issue.message;
  }
  return { ok: false, errors };
}
