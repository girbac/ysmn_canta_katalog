/**
 * Katalogda saklanan görsel kaynağını tarayıcının kullanabileceği
 * adrese çevirir. Üç biçim destekleniyor:
 *
 *  - "taba-1.webp"             → /products/<slug>/taba-1.webp
 *  - "/products/x/taba-1.webp" → olduğu gibi
 *  - "https://.../taba-1.webp" → olduğu gibi (Vercel Blob)
 *
 * Tek yerde durması önemli: hem genel site hem admin paneli aynı
 * çözümlemeyi kullanıyor, yani depo değişince tek dosya değişiyor.
 */
export function resolveImageSource(source: string, slug: string): string {
  if (/^https?:\/\//.test(source) || source.startsWith("/")) return source;
  return `/products/${slug}/${source}`;
}
