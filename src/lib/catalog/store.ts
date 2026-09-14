import "server-only";
import type { CatalogStore } from "./store-types";
import { blobStore } from "./store-blob";
import { fsStore } from "./store-fs";

/**
 * Hangi depo kullanılacak?
 *
 * Vercel Blob bağlıysa Blob, değilse dosya sistemi. Bu sayede panelin
 * tamamı yayına çıkmadan önce yerelde uçtan uca çalıştırılıp test
 * edilebiliyor; canlıya geçişte değişen tek şey bu bağlantı oluyor.
 *
 * İKİ ayrı kimlik yolu var ve ikisine de bakmak şart:
 *
 *  - BLOB_READ_WRITE_TOKEN — statik token (eski bağlantı biçimi, ayrıca
 *    `vercel env pull` ile yerelde kullanılabiliyor).
 *  - BLOB_STORE_ID — Vercel'in bugünkü Blob bağlantısının kurduğu yol.
 *    Statik token vermiyor; kimlik doğrulama çalışma anında enjekte
 *    edilen VERCEL_OIDC_TOKEN ile yapılıyor. (Bkz. @vercel/blob içindeki
 *    kimlik çözümü: önce OIDC + storeId, sonra read-write token.)
 *
 * Yalnızca token'a bakmak, depo doğru biçimde bağlanmış projelerde bile
 * dosya sistemine düşmeye ve canlıda "salt okunur" hatasına yol açıyordu.
 */
export function getStore(): CatalogStore {
  const hasBlob = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
  return hasBlob ? blobStore : fsStore;
}

export type { CatalogStore };
