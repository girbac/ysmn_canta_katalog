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

/**
 * Canlıda dosya sistemi yazılamaz: Vercel'de kod /var/task altında salt
 * okunur çalışır. Bu adaptör oraya düşmüşse eksik olan tek şey Blob
 * bağlantısıdır; hata mesajı da bunu söylesin, ham ENOENT/EROFS değil.
 */
function notWritable(what: string, cause: unknown): Error {
  return new Error(
    `${what}: sunucunun dosya sistemi salt okunur. Bu, Vercel Blob deposunun ` +
      "bu projeye bağlı olmadığı anlamına gelir. Vercel'de projenin Storage " +
      "bölümünden bir Blob deposu bağlayın, sonra yeniden yayınlayın.",
    { cause },
  );
}

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
      throw notWritable("Katalog kaydedilemedi", cause);
    }
  },

  async putImage({ slug, filename, body }) {
    const dir = path.join(IMAGE_ROOT, slug);
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), body);
    } catch (cause) {
      // Eskiden ham Node hatası dışarı sızıyordu: kullanıcı panelde
      // "ENOENT: no such file or directory, mkdir '/var/task/public/...'"
      // görüyordu. O mesaj doğru ama hiçbir şey anlatmıyor.
      throw notWritable("Fotoğraf yüklenemedi", cause);
    }
    return filename;
  },

  async deleteImage(source, slug) {
    // Yalnızca bu depoya ait dosyaları siliyoruz; uzak URL'lere dokunmuyoruz
    if (/^https?:\/\//.test(source)) return;
    const filename = path.basename(source);
    await rm(path.join(IMAGE_ROOT, slug, filename), { force: true });
  },
};
