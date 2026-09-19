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

/**
 * Stok bilgisini genel siteye giden veriden çıkarır.
 *
 * "Panelde göster, müşteri görmesin" yalnızca ekranda gizlemekle olmuyor:
 * ürün verisi istemci bileşenlerine (kartlar, sepet) aktarıldığı için
 * sayfanın kaynağında okunabilir hâlde duruyor. Bu yüzden alan, genel
 * okuma yolunda veriden tamamen siliniyor. Panel kendi yolundan okuyor
 * (getCatalogForAdmin → store.read) ve stoğu görüyor.
 */
function withoutStock(list: Product[]): Product[] {
  return list.map((p) => ({
    ...p,
    colors: p.colors.map((renk) => {
      const temiz = { ...renk };
      delete temiz.stock;
      return temiz;
    }),
  }));
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
    return withoutStock(withOrder(await getStore().read()));
  } catch {
    return withoutStock(withOrder(seedProducts));
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
    // Taze: panel, önbellekte kalmış bir listeyle işlem yaptırmamalı
    return { ok: true, products: withOrder(await getStore().read(true)) };
  } catch (cause) {
    const detay = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, error: detay.trim() || "Katalog okunamadı." };
  }
}

/**
 * Panelin tek ürün okuması.
 *
 * Düzenleme ekranı eskiden genel okumayı (getProductBySlug) kullanıyordu;
 * iki sakıncası vardı: stok alanı orada siliniyor (panelde boş görünüyordu)
 * ve depo okunamadığında sayfa pakete gömülü demo ürünü gerçek sanıp
 * düzenlemeye açıyordu. Panel kendi yolundan okumalı.
 */
export async function getProductForAdmin(
  slug: string,
): Promise<{ ok: true; product: Product } | { ok: false; error: string }> {
  const okuma = await getCatalogForAdmin();
  if (!okuma.ok) return okuma;

  const product = okuma.products.find((p) => p.slug === slug);
  return product
    ? { ok: true, product }
    : { ok: false, error: "Ürün bulunamadı." };
}
