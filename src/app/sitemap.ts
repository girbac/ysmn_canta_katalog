import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { locales } from "@/i18n/config";
import { products } from "@/data/products";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/koleksiyon", "/atolye"];
  const lastModified = new Date();

  /** Her adres için TR/EN karşılıkları hreflang olarak verilir */
  const alternates = (path: string) => ({
    languages: Object.fromEntries(
      locales.map((l) => [l, `${site.url}/${l}${path}`]),
    ),
  });

  return [
    ...locales.flatMap((locale) =>
      staticPaths.map((path) => ({
        url: `${site.url}/${locale}${path}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: path === "" ? 1 : 0.8,
        alternates: alternates(path),
      })),
    ),
    ...locales.flatMap((locale) =>
      products.map((p) => ({
        url: `${site.url}/${locale}/urun/${p.slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: alternates(`/urun/${p.slug}`),
      })),
    ),
  ];
}
