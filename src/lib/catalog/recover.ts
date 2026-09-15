import "server-only";
import type { StoredProduct } from "./schema";
import { findColor, FALLBACK_HEX } from "@/data/colors";

/**
 * Fotoğraflardan katalog kurtarma.
 *
 * Katalog tek bir JSON dosyası ve her kaydetme onu baştan yazıyor —
 * dolayısıyla kaybolabiliyor. Fotoğraflar ise ayrı nesneler: depoda
 * `products/<adres>/<renk>-<damga>-<sıra>.<uzantı>` olarak duruyorlar ve
 * katalog gitse bile yerlerinde kalıyorlar.
 *
 * Buradaki iş, o dosya adlarından ürün iskeletlerini geri kurmak. Geri
 * gelen: hangi ürünler vardı, her birinin hangi renkleri ve hangi
 * fotoğrafları. Geri GELMEYEN: ad, fiyat, ölçü, malzeme, detaylar — onlar
 * yalnızca katalog dosyasında duruyordu. Bu yüzden kurtarılan ürünler
 * makul varsayılanlarla geliyor ve panelde düzeltilmeyi bekliyor.
 */

export type RecoveredProduct = StoredProduct & { kurtarildi: true };

/**
 * `taba-mu1fqxkr-0.webp` → renk anahtarı `taba`, damga `mu1fqxkr`, sıra `0`
 *
 * Sondan ayrıştırılıyor: renk anahtarının kendisi tire içerebiliyor
 * (`gul-kurusu`), ama damga ile sıra numarası her zaman son iki parça.
 */
function dosyayiCoz(filename: string): { colorKey: string; damga: string; sira: number } | null {
  const uzantisiz = filename.replace(/\.[a-z0-9]+$/i, "");
  const parca = uzantisiz.split("-");
  if (parca.length < 3) return null;

  const sira = Number(parca[parca.length - 1]);
  const damga = parca[parca.length - 2];
  const colorKey = parca.slice(0, -2).join("-");
  if (!colorKey || !Number.isFinite(sira)) return null;
  return { colorKey, damga, sira };
}

/** `meridyen-tote` → `Meridyen Tote` */
function adaCevir(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr") + p.slice(1))
    .join(" ");
}

/** Adrese bakarak forma tahmin yürütür — panelde düzeltilebilir */
function formTahmin(slug: string): StoredProduct["form"] {
  if (/sirt|sırt/.test(slug)) return "sirt";
  if (/evrak/.test(slug)) return "evrak";
  if (/seyahat|postaci/.test(slug)) return "postaci";
  if (/clutch/.test(slug)) return "clutch";
  if (/baguette/.test(slug)) return "baguette";
  if (/omuz/.test(slug)) return "omuz";
  return "tote";
}

/**
 * Depodaki görsellerden ürün listesi kurar.
 *
 * Aynı rengin fotoğrafları yüklendikleri sıraya göre diziliyor (damga +
 * sıra numarası), böylece kapak görseli eskiden neyse yine o oluyor.
 */
export function rebuildFromImages(
  images: Array<{ slug: string; filename: string; source: string }>,
): RecoveredProduct[] {
  const urunler = new Map<
    string,
    Map<string, Array<{ damga: string; sira: number; source: string }>>
  >();

  for (const g of images) {
    const cozum = dosyayiCoz(g.filename);
    if (!cozum) continue;
    if (!urunler.has(g.slug)) urunler.set(g.slug, new Map());
    const renkler = urunler.get(g.slug)!;
    if (!renkler.has(cozum.colorKey)) renkler.set(cozum.colorKey, []);
    renkler.get(cozum.colorKey)!.push({
      damga: cozum.damga,
      sira: cozum.sira,
      source: g.source,
    });
  }

  const sonuc: RecoveredProduct[] = [];
  for (const [slug, renkler] of urunler) {
    const colors = [...renkler].map(([key, dosyalar]) => {
      const hazir = findColor(key);
      return {
        key,
        // Palet dışı bir renkse adı anahtardan okunuyor; gerçek adı
        // yalnızca katalog dosyasında duruyordu.
        name: hazir ? { tr: hazir.tr, en: hazir.en } : { tr: adaCevir(key), en: adaCevir(key) },
        hex: hazir?.hex ?? FALLBACK_HEX,
        images: dosyalar
          .sort((a, b) => a.damga.localeCompare(b.damga) || a.sira - b.sira)
          .map((d) => d.source),
      };
    });
    if (colors.length === 0) continue;

    const ad = adaCevir(slug);
    sonuc.push({
      slug,
      code: slug.toLocaleUpperCase("tr"),
      name: { tr: ad, en: ad },
      segment: "kadin",
      form: formTahmin(slug),
      material: "deri",
      // Ölçüler katalogda duruyordu, fotoğrafta değil: makul bir başlangıç
      dimensions: { w: 30, h: 30, d: 12 },
      colors,
      features: [],
      kurtarildi: true,
    });
  }

  return sonuc.sort((a, b) => a.slug.localeCompare(b.slug, "tr"));
}
