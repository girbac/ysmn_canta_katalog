import "server-only";
import { cache } from "react";
import type { Product } from "@/data/types";
import { getStore } from "./store";
import type { StoredProduct } from "./schema";

/**
 * Sunucu tarafı katalog okuması.
 *
 * `cache()` aynı istek içinde depoya birden fazla gitmeyi engelliyor:
 * bir sayfa hem listeyi hem tek ürünü isteyebiliyor.
 *
 * `order` alanı listedeki sıradan türetiliyor — admin panelinde sıralama
 * elle bir sayı girmek yerine dizinin kendi sırası olarak tutuluyor.
 */

function withOrder(list: StoredProduct[]): Product[] {
  return list.map((p, i) => ({ ...p, order: i }) as Product);
}

export const getCatalog = cache(async (): Promise<Product[]> => {
  return withOrder(await getStore().read());
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | undefined> => {
  return (await getCatalog()).find((p) => p.slug === slug);
});

/** Katalogdan türetilen, sayfaların ihtiyaç duyduğu görünümler */
export async function getCatalogViews() {
  const products = await getCatalog();
  return {
    products,
    women: products.filter((p) => p.segment === "kadin"),
    men: products.filter((p) => p.segment === "erkek"),
    featured: products.filter((p) => p.isNew),
    /** Katalogda gerçekten kullanılan renkler — filtre yalnızca bunları gösterir */
    usedColorKeys: [...new Set(products.flatMap((p) => p.colors.map((c) => c.key)))],
    /** renk anahtarı → hex (istemciye düz nesne olarak geçer) */
    colorHex: Object.fromEntries(
      products.flatMap((p) => p.colors.map((c) => [c.key, c.hex] as const)),
    ) as Record<string, string>,
  };
}
