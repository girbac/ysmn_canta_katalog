/**
 * Katalogda saklanan görsel kaynağını tarayıcının kullanabileceği
 * adrese çevirir. Üç biçim destekleniyor:
 *
 *  - "taba-1.webp"             → /foto/<slug>/taba-1.webp
 *  - "/products/x/taba-1.webp" → olduğu gibi (eski kayıtlar)
 *  - "https://.../taba-1.webp" → olduğu gibi (eski kayıtlar)
 *
 * Fotoğraflar GitHub deposunda duruyor ve /foto yolundan servis ediliyor
 * (src/app/foto): yüklenen fotoğraf, sitenin yeniden yayınlanması
 * beklenmeden anında görünüyor.
 *
 * Tek yerde durması önemli: hem genel site hem admin paneli aynı
 * çözümlemeyi kullanıyor, yani depo değişince tek dosya değişiyor.
 */
export function resolveImageSource(source: string, slug: string): string {
  if (source.startsWith("/")) return source;
  /*
   * Tam adresler artık kullanılmıyor.
   *
   * Katalogda Vercel Blob döneminden kalma https adresleri olabilir; o depo
   * silindi, yani o adresler ölü. Üstelik next/image tanımadığı bir alan
   * adını optimize etmeyi reddedip sayfayı tamamen çökertiyor. Boş dönüyoruz:
   * ProductMedia bunu "fotoğraf yok" sayıp silüeti çiziyor, ürün sayfası
   * ayakta kalıyor.
   */
  if (/^https?:\/\//.test(source)) return "";
  return `/foto/${slug}/${source}`;
}
