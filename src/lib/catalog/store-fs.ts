import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { catalogSchema } from "./schema";
import { seedProducts } from "./seed";
import type { CatalogStore } from "./store-types";

/**
 * Dosya sistemi adaptörü — geliştirme ve test için.
 *
 * Veriyi `src/data/products.json`'a, görselleri `public/products/<slug>/`
 * altına yazar. Yani panelden yapılan değişiklik doğrudan depoya girer ve
 * commit'lenebilir; küçük bir markanın içerik akışı için bu yeterli.
 */

const DATA_FILE = path.join(process.cwd(), "src", "data", "products.json");
const IMAGE_ROOT = path.join(process.cwd(), "public", "products");

export const fsStore: CatalogStore = {
  kind: "fs",

  async read() {
    try {
      const raw = await readFile(DATA_FILE, "utf8");
      return catalogSchema.parse(JSON.parse(raw));
    } catch {
      // Dosya yoksa ya da bozulmuşsa tohumla devam et — katalog hiç boş kalmasın
      return seedProducts;
    }
  },

  async write(products) {
    const valid = catalogSchema.parse(products);
    try {
      await writeFile(DATA_FILE, JSON.stringify(valid, null, 2) + "\n", "utf8");
    } catch (cause) {
      // Sunucu ortamlarında dosya sistemi salt okunurdur. Hata mesajı
      // "EROFS" demek yerine ne yapılması gerektiğini söylesin.
      throw new Error(
        "Katalog dosyaya yazılamadı. Canlı ortamda dosya sistemi salt okunur; " +
          "Vercel Blob deposu bağlayıp BLOB_READ_WRITE_TOKEN ortam değişkenini tanımlayın.",
        { cause },
      );
    }
  },

  async putImage({ slug, filename, body }) {
    const dir = path.join(IMAGE_ROOT, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), body);
    return filename;
  },

  async deleteImage(source, slug) {
    // Yalnızca bu depoya ait dosyaları siliyoruz; uzak URL'lere dokunmuyoruz
    if (/^https?:\/\//.test(source)) return;
    const filename = path.basename(source);
    await rm(path.join(IMAGE_ROOT, slug, filename), { force: true });
  },
};
