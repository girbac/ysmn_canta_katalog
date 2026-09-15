import "server-only";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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
const HISTORY_DIR = path.join(process.cwd(), "src", "data", "yedek");

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

  async probe() {
    // Yerel geliştirmede dosya sistemi yazılabilir; canlıda buraya
    // düşülmesi zaten AdminShell'de ayrıca uyarılıyor.
    return { ok: true as const };
  },

  async read() {
    let raw: string;
    try {
      raw = await readFile(DATA_FILE, "utf8");
    } catch (cause) {
      // Yalnızca "dosya yok" tohuma düşer (ilk kurulum). Başka her hata
      // yukarı çıkar: yazma işlemleri önce okuduğu için, yutulan bir hata
      // katalogun üzerine tohum verinin yazılmasına yol açardı.
      if ((cause as NodeJS.ErrnoException)?.code === "ENOENT") return seedProducts;
      throw cause;
    }
    return catalogSchema.parse(JSON.parse(raw));
  },

  async write(products) {
    const valid = catalogSchema.parse(products);

    // Üzerine yazmadan önce mevcut hâli yedekle (bkz. store-types)
    try {
      const eski = await readFile(DATA_FILE, "utf8");
      await mkdir(HISTORY_DIR, { recursive: true });
      const damga = new Date().toISOString().replace(/[:.]/g, "-");
      await writeFile(path.join(HISTORY_DIR, `${damga}.json`), eski, "utf8");
    } catch {
      // Yedek bir güvence, kapı değil: alınamazsa kaydetme yine sürüyor
    }

    try {
      await writeFile(DATA_FILE, JSON.stringify(valid, null, 2) + "\n", "utf8");
    } catch (cause) {
      throw notWritable("Katalog kaydedilemedi", cause);
    }
  },

  async readRaw() {
    try {
      return await readFile(DATA_FILE, "utf8");
    } catch {
      return null;
    }
  },

  async listBackups() {
    let dosyalar: string[];
    try {
      dosyalar = await readdir(HISTORY_DIR);
    } catch {
      return [];
    }
    return dosyalar
      .filter((d) => d.endsWith(".json"))
      .map((d) => ({ key: d, at: d.replace(/\.json$/, "") }))
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  async readBackup(key) {
    // Yol geçişi olmasın: yalnızca yedek klasöründeki düz dosya adları
    if (key.includes("/") || key.includes("..")) throw new Error("Geçersiz yedek.");
    const raw = await readFile(path.join(HISTORY_DIR, key), "utf8");
    return catalogSchema.parse(JSON.parse(raw));
  },

  async listImages() {
    let klasorler: string[];
    try {
      klasorler = await readdir(IMAGE_ROOT);
    } catch {
      return [];
    }
    const bulunan: Array<{ slug: string; filename: string; source: string }> = [];
    for (const slug of klasorler) {
      const yol = path.join(IMAGE_ROOT, slug);
      try {
        if (!(await stat(yol)).isDirectory()) continue;
        for (const filename of await readdir(yol)) {
          if (/\.(webp|avif|jpe?g|png)$/i.test(filename)) {
            bulunan.push({ slug, filename, source: filename });
          }
        }
      } catch {
        // Okunamayan klasörü atla
      }
    }
    return bulunan;
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
