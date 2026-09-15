import "server-only";
import type { CatalogStore } from "./store-types";
import { gitStore, gitAyar } from "./store-git";
import { fsStore } from "./store-fs";

/**
 * Hangi depo kullanılacak?
 *
 * GitHub anahtarı varsa GitHub deposu, yoksa yerel dosya sistemi. İkincisi
 * yalnızca geliştirme için: canlıda sunucunun dosya sistemi salt okunur.
 *
 * Buradan Vercel Blob KALDIRILDI. Sebebi ders niteliğinde: Hobby planının
 * kotası dolunca depo erişimi bir aylığına kapandı, okumalar başarısız
 * oldu ve zincirin sonunda kullanıcının bütün ürünleri silindi. Kotası
 * olan, kapanabilen bir depo katalogun asıl yeri olamaz. GitHub deposu
 * zaten projenin kendi evi: ayrı bir kota yok, her değişiklik bir commit,
 * geçmiş kendiliğinden duruyor.
 */
export function getStore(): CatalogStore {
  return gitAyar() ? gitStore : fsStore;
}

export type { CatalogStore };

/**
 * Panelin üstünde gösterilen depo durumu.
 *
 * Hangi adaptörün seçildiği tek başına yetmiyor: Blob seçilmiş ama
 * ulaşılamıyor olabilir (ör. depo kimliği var olmayan bir depoyu
 * gösteriyorsa). O yüzden gerçekten bir çağrı yapılıyor.
 */
export async function getStoreStatus(): Promise<{
  kind: CatalogStore["kind"];
  error?: string;
}> {
  const store = getStore();
  const result = await store.probe();
  return result.ok ? { kind: store.kind } : { kind: store.kind, error: result.error };
}
