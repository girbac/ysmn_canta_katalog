import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export const dynamic = "force-static";

/**
 * Katalog hazırlanırken arama motorlarına kapalı.
 *
 * Site şu an linki olan herkese açık — tanıdıklara gösterilebilsin diye.
 * Ama içerik hâlâ demo ürünler ve örnek iletişim bilgileri içeriyor;
 * bunların Google'a düşmesi istenmez. Marka bilgileri ve ürünler gerçek
 * olduğunda `HAZIR` true yapılır, indeksleme açılır.
 */
const HAZIR = false;

export default function robots(): MetadataRoute.Robots {
  if (!HAZIR) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Seçki kişiye özel ve paylaşım bağlantılı
        "/tr/secki",
        "/en/secki",
        // Yönetim paneli
        "/admin",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
