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
  /** Kanonik site adresi (sitemap + hreflang + paylaşım linkleri için) */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const;
