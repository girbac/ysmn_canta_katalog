import type { StoredProduct } from "./schema";

/**
 * Katalog deposunun sözleşmesi.
 *
 * Adaptörler (dosya sistemi / Vercel Blob) bu arayüzü uyguluyor;
 * `store.ts` hangisinin kullanılacağını seçiyor. Tip bu ayrı dosyada
 * duruyor ki adaptörler ile seçici arasında döngüsel import olmasın.
 */
export type CatalogStore = {
  read(): Promise<StoredProduct[]>;
  write(products: StoredProduct[]): Promise<void>;
  /** Görseli kaydeder ve katalogda saklanacak kaynağı döner */
  putImage(params: {
    slug: string;
    filename: string;
    contentType: string;
    body: Buffer;
  }): Promise<string>;
  deleteImage(source: string, slug: string): Promise<void>;
  /**
   * Yedek sürümler (en yeni başta) ve bir yedeği okuma.
   *
   * Katalog tek bir dosya ve her kaydetme onu baştan yazıyor. Bir kez,
   * geçici bir okuma hatası yüzünden bütün ürünlerin üzerine demo veri
   * yazıldı. Yedek, bu sınıftaki kazaları geri alınabilir kılıyor.
   */
  listBackups(): Promise<Array<{ key: string; at: string }>>;
  readBackup(key: string): Promise<StoredProduct[]>;
  /**
   * Depodaki ürün görselleri.
   *
   * Fotoğraflar katalogdan ayrı nesneler; katalog kaybolsa bile duruyorlar.
   * Kurtarma ekranı ürünleri bunlardan yeniden kuruyor.
   */
  listImages(): Promise<Array<{ slug: string; filename: string; source: string }>>;
  /**
   * Depo gerçekten erişilebilir mi?
   *
   * read() okuma hatalarını yutup tohum veriyle devam ediyor — genel site
   * hiçbir koşulda boş görünmesin diye. Ama bu, bozuk bir depoyu panelde
   * de görünmez kılıyordu: ürünler listeleniyor, sorun ancak kaydetmeye
   * çalışınca ortaya çıkıyordu. Bu kontrol, sorunu yazmadan önce söylüyor.
   */
  probe(): Promise<{ ok: true } | { ok: false; error: string }>;
  /** Arayüzde hangi depoda olduğumuzu göstermek için */
  readonly kind: "fs" | "blob";
};
