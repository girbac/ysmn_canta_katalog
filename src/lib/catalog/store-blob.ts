import "server-only";
import { del, list, put } from "@vercel/blob";
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
 * BLOB_READ_WRITE_TOKEN olmadan bu dosya hiç yüklenmez (bkz. store.ts).
 */

const CATALOG_KEY = "catalog/products.json";

export const blobStore: CatalogStore = {
  kind: "blob",

  async read() {
    try {
      const found = await list({ prefix: CATALOG_KEY, limit: 1 });
      const entry = found.blobs.find((b) => b.pathname === CATALOG_KEY);
      if (!entry) return seedProducts;

      // Katalog admin panelinden değişiyor; CDN'den bayat sürüm gelmesin
      const res = await fetch(entry.url, { cache: "no-store" });
      if (!res.ok) return seedProducts;
      return catalogSchema.parse(await res.json());
    } catch {
      return seedProducts;
    }
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
