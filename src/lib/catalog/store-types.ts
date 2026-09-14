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
