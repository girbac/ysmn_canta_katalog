import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Seçki kişiye özel ve paylaşım bağlantılı — dizine girmesin
      disallow: ["/tr/secki", "/en/secki"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
