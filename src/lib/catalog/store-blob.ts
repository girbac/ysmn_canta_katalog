import "server-only";
import { del, get, list, put } from "@vercel/blob";
import { catalogSchema } from "./schema";
import { seedProducts } from "./seed";
import type { CatalogStore } from "./store-types";

/**
 * Vercel Blob adaptörü — canlı site.
 *
 * Katalog tek bir JSON nesnesinde (`catalog/products.json`), görseller
 * `products/<slug>/<dosya>` altında durur. Görseller için Blob'un
 * döndürdüğü tam URL katalogda saklanır; ProductMedia zaten hem tam URL
 * hem göreli dosya adı kabul ediyor.
 *
 * Blob bağlı değilken bu adaptör hiç seçilmez (bkz. store.ts).
 */

const CATALOG_KEY = "catalog/products.json";

export const blobStore: CatalogStore = {
  kind: "blob",

  async probe() {
    try {
      // En ucuz gerçek çağrı: depoya bir kez bakmak. Kimlik, depo kimliği
      // ve erişim üçü birden burada sınanıyor.
      await list({ limit: 1 });
      return { ok: true as const };
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      return { ok: false as const, error: detail.trim() };
    }
  },

  /**
   * Katalogu depodan okur.
   *
   * `useCache: false` kritik: Blob'un genel URL'si CDN'den servis ediliyor
   * ve yazdıktan hemen sonra okunduğunda eski kopya gelebiliyordu. Panelde
   * fotoğraf yükledikten sonra fotoğrafın görünmemesinin, sayfadan çıkıp
   * girince bir süre sonra belirmesinin sebebi buydu. Bu seçenek isteği
   * doğrudan kaynağa götürüp en güncel içeriği garanti ediyor.
   *
   * Hatalar artık YUTULMUYOR. Eskiden her hata tohum veriye düşüyordu ve
   * bu sessiz bir felaket riskiydi: yazma işlemleri önce okuyup sonra
   * yazdığı için, geçici bir okuma hatası katalogun tamamının üzerine 41
   * demo ürünü yazdırırdı. Yalnızca "depoda henüz yok" durumu tohuma
   * düşüyor — o da ilk kurulumda sitenin boş görünmemesi için.
   */
  async read() {
    const found = await get(CATALOG_KEY, { access: "public", useCache: false });
    if (!found) return seedProducts;
    if (found.statusCode !== 200) return seedProducts;
    const text = await new Response(found.stream).text();
    return catalogSchema.parse(JSON.parse(text));
  },

  async write(products) {
    const valid = catalogSchema.parse(products);
    await put(CATALOG_KEY, JSON.stringify(valid, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  },

  async putImage({ slug, filename, contentType, body }) {
    const { url } = await put(`products/${slug}/${filename}`, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return url;
  },

  async deleteImage(source) {
    if (!/^https?:\/\//.test(source)) return;
    try {
      await del(source);
    } catch {
      // Görsel zaten silinmişse akışı bozmuyoruz
    }
  },
};
