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
/** Her yazmadan önceki hâl buraya kopyalanıyor — bkz. write() */
const HISTORY_PREFIX = "catalog/yedek/";

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
   * OKUMA HATASI ASLA TOHUM VERİYE DÜŞMEZ.
   *
   * Eskiden düşüyordu ve bu gerçek bir felakete yol açtı: yazma işlemleri
   * önce okuyup sonra yazdığı için, tek bir geçici okuma hatası (404, 5xx)
   * katalogun tamamının üzerine 41 demo ürünü yazdırıyordu. Kullanıcının
   * eklediği bütün ürünler bir kaydetmeyle siliniyordu.
   *
   * "Depo bomboş" ile "geçici arıza" ayrımı artık tahminle değil, ayrı bir
   * listeleme çağrısıyla yapılıyor: dosya listede yoksa gerçekten ilk
   * kurulumdur, tohum veri dönebilir. Listede varsa ama okunamıyorsa bu bir
   * arızadır ve yukarı fırlar — hiçbir yazma işlemi eksik veriyle devam
   * etmez.
   */
  async read() {
    const found = await get(CATALOG_KEY, { access: "public", useCache: false });
    if (found && found.statusCode === 200) {
      const text = await new Response(found.stream).text();
      return catalogSchema.parse(JSON.parse(text));
    }

    const { blobs } = await list({ prefix: CATALOG_KEY, limit: 1 });
    if (blobs.length === 0) return seedProducts;

    throw new Error(
      "Katalog dosyası depoda duruyor ama şu an okunamıyor. Hiçbir şey " +
        "yazılmadı; birkaç saniye sonra tekrar deneyin.",
    );
  },

  async readRaw() {
    const found = await get(CATALOG_KEY, { access: "public", useCache: false });
    if (!found || found.statusCode !== 200) return null;
    return await new Response(found.stream).text();
  },

  /** Yedek sürümler — en yenisi başta */
  async listBackups() {
    const { blobs } = await list({ prefix: HISTORY_PREFIX });
    return blobs
      .map((b) => ({ key: b.pathname, at: b.uploadedAt.toISOString() }))
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  async readBackup(key) {
    if (!key.startsWith(HISTORY_PREFIX)) throw new Error("Geçersiz yedek.");
    const found = await get(key, { access: "public", useCache: false });
    if (!found || found.statusCode !== 200) throw new Error("Yedek okunamadı.");
    const text = await new Response(found.stream).text();
    return catalogSchema.parse(JSON.parse(text));
  },

  /**
   * Depodaki ürün görselleri.
   *
   * Katalog dosyası kaybolsa bile fotoğraflar ayrı nesneler olarak duruyor;
   * kurtarma ekranı ürünleri bunlardan yeniden kuruyor.
   */
  async listImages() {
    const { blobs } = await list({ prefix: "products/" });
    return blobs
      .map((b) => {
        const parca = b.pathname.split("/");
        return { slug: parca[1] ?? "", filename: parca[2] ?? "", source: b.url };
      })
      .filter((g) => g.slug && g.filename);
  },

  /**
   * Katalogu yazar ve yazdığının geri okunabildiğini DOĞRULAR.
   *
   * Doğrulama olmadan şu oluyordu: panelden fotoğraf yükleniyor, yazma
   * başarılı dönüyor, ama hemen ardından yapılan okuma deponun eski hâlini
   * getiriyordu — fotoğraf görünmüyordu. Kullanıcı aynı fotoğrafı tekrar
   * yüklüyordu ve asıl tehlike buydu: ikinci yükleme de eski listeyi okuyup
   * üzerine yazdığı için ilk fotoğrafı düşürebiliyordu.
   *
   * Artık yazma, içerik geri okunana kadar bitmiş sayılmıyor. Birkaç kısa
   * deneme yetiyor; yerleşmezse hata verilmiyor (veri yazıldı, yalnızca
   * görünmesi gecikti) ama en azından bekleniyor.
   */
  async write(products) {
    const valid = catalogSchema.parse(products);
    const body = JSON.stringify(valid, null, 2);

    /**
     * Üzerine yazmadan ÖNCE mevcut hâli yedekle.
     *
     * Katalog tek bir dosya ve her kaydetme onu baştan yazıyor; yani bir
     * hata bütün ürünleri götürebiliyor. Bir kere götürdü de. Yedek, bu
     * sınıftaki her kazayı geri alınabilir kılıyor — maliyeti kaydetme
     * başına birkaç kilobayt.
     *
     * Yedeklenemezse kaydetme yine de sürüyor: yedek bir güvence, kapı
     * değil. Panelin çalışmaz hâle gelmesi daha kötü olurdu.
     */
    try {
      const onceki = await get(CATALOG_KEY, { access: "public", useCache: false });
      if (onceki?.statusCode === 200) {
        const eski = await new Response(onceki.stream).text();
        const damga = new Date().toISOString().replace(/[:.]/g, "-");
        await put(`${HISTORY_PREFIX}${damga}.json`, eski, {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 0,
        });
      }
    } catch {
      // Yedek alınamadı; kaydetmeyi engellemiyoruz
    }

    await put(CATALOG_KEY, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });

    for (let deneme = 0; deneme < 5; deneme++) {
      try {
        const found = await get(CATALOG_KEY, { access: "public", useCache: false });
        if (found?.statusCode === 200) {
          const text = await new Response(found.stream).text();
          if (text === body) return;
        }
      } catch {
        // Geçici bir okuma hatası; aşağıda tekrar denenecek
      }
      await new Promise((r) => setTimeout(r, 120 * (deneme + 1)));
    }
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
