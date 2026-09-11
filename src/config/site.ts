/**
 * Marka ve iletişim ayarları.
 * Gerçek değerler .env.local dosyasından gelir; burada yalnızca güvenli varsayılanlar var.
 */
export const site = {
  brand: process.env.NEXT_PUBLIC_BRAND ?? "YSMN",
  brandLong: process.env.NEXT_PUBLIC_BRAND_LONG ?? "YSMN Leather Atelier",
  /** Uluslararası format, yalnızca rakam. Örn: 905321234567 */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "905000000000",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "info@example.com",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "ysmn",
  city: "İstanbul",
  /**
   * Kanonik site adresi (sitemap + hreflang + seçki paylaşım linkleri).
   * Kendi alan adınız NEXT_PUBLIC_SITE_URL ile verilir; verilmediğinde
   * Vercel'in atadığı adres kullanılır ki önizleme dağıtımlarında
   * paylaşım bağlantıları da çalışsın.
   */
  url: resolveUrl(),
} as const;

function resolveUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
