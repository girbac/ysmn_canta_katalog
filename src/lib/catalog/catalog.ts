import "server-only";
import { cache } from "react";
import type { Localized, Product } from "@/data/types";
import { getStore } from "./store";
import { seedProducts } from "./seed";
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
  /**
   * Okuma burada dayanıklı: depoya ulaşılamasa bile genel site boş
   * görünmesin diye pakete gömülü tohum veriyle devam ediliyor.
   *
   * Yazma yolları bu işlevi KULLANMIYOR; onlar store.read()'i doğrudan
   * çağırıyor ve hata alırsa duruyorlar. Ayrım bilinçli: gösterirken
   * eldekiyle idare etmek iyi, yazarken eksik veriyle devam etmek
   * katalogun üzerine yazmak demek olurdu.
   */
  try {
    return withOrder(await getStore().read());
  } catch {
    return withOrder(seedProducts);
  }
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | undefined> => {
  return (await getCatalog()).find((p) => p.slug === slug);
});

/** Katalogdan türetilen, sayfaların ihtiyaç duyduğu görünümler */
export async function getCatalogViews() {
  const products = await getCatalog();

  /**
   * Filtrenin renk künyesi ürünlerin KENDİSİNDEN toplanıyor, hazır
   * paletten değil. Panelde palet dışı renk tanımlanabildiği için ad ve
   * ton yalnızca ürünün içinde tam olarak biliniyor; palete bakmak
   * kullanıcının yazdığı adı ("Gül Kurusu") anahtarın okunuşuna
   * ("Gul Kurusu") düşürürdü. İlk karşılaşılan tanım geçerli sayılıyor.
   */
  const meta = new Map<string, { name: Localized; hex: string }>();
  for (const p of products) {
    for (const c of p.colors) {
      if (!meta.has(c.key)) meta.set(c.key, { name: c.name, hex: c.hex });
    }
  }

  return {
    products,
    women: products.filter((p) => p.segment === "kadin"),
    men: products.filter((p) => p.segment === "erkek"),
    featured: products.filter((p) => p.isNew),
    /** Katalogda gerçekten kullanılan renkler — filtre yalnızca bunları gösterir */
    usedColorKeys: [...meta.keys()],
    /** renk anahtarı → hex (istemciye düz nesne olarak geçer) */
    colorHex: Object.fromEntries(
      [...meta].map(([key, v]) => [key, v.hex] as const),
    ) as Record<string, string>,
    /** renk anahtarı → iki dilli ad */
    colorNames: Object.fromEntries(
      [...meta].map(([key, v]) => [key, v.name] as const),
    ) as Record<string, Localized>,
  };
}

/**
 * Panelin katalog okuması — tohum veriye DÜŞMEZ.
 *
 * getCatalog(), depoya ulaşılamadığında pakete gömülü demo veriyle devam
 * ediyor: genel site hiçbir koşulda boş görünmesin diye. Panelde ise bu
 * tehlikeli. Kullanıcı 41 demo ürünü kendi katalogu sanıp üzerinde işlem
 * yapıyor, oysa ortada okunamayan bir depo var. Panel gerçeği göstermeli:
 * veri okunamıyorsa liste değil hata çıkar.
 */
export async function getCatalogForAdmin(): Promise<
  { ok: true; products: Product[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, products: withOrder(await getStore().read()) };
  } catch (cause) {
    const detay = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, error: detay.trim() || "Katalog okunamadı." };
  }
}
