import "server-only";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { getStore } from "./store";
import { parseProduct, type StoredProduct } from "./schema";

/**
 * Katalog yazma işlemleri.
 *
 * Her yazmadan sonra genel sitenin ilgili yolları tazeleniyor; böylece
 * sayfalar statik hızını koruyup içerik panelden değiştirilebiliyor.
 */

/** Ürün listesini etkileyen tüm genel yollar */
function revalidateCatalog(slug?: string) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/koleksiyon`);
    if (slug) revalidatePath(`/${locale}/urun/${slug}`);
  }
  // Yeni ürün ekleniyorsa henüz üretilmemiş yollar da kalıbıyla işaretlenir
  revalidatePath("/[locale]/urun/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export type SaveResult =
  | { ok: true; slug: string }
  | { ok: false; errors: Record<string, string> };

/**
 * Ürün kaydeder (yeni ya da mevcut).
 *
 * `originalSlug` verilirse o kayıt güncellenir; verilmezse yeni eklenir.
 * Slug katalog kimliği olduğu için çakışma kontrol ediliyor.
 */
export async function saveProduct(
  input: unknown,
  originalSlug?: string,
): Promise<SaveResult> {
  const parsed = parseProduct(input);
  if (!parsed.ok) return parsed;

  const product = parsed.product;
  const store = getStore();
  const list = await store.read();

  const index = originalSlug ? list.findIndex((p) => p.slug === originalSlug) : -1;

  if (originalSlug && index === -1) {
    return { ok: false, errors: { _: "Düzenlenecek ürün bulunamadı." } };
  }

  const clash = list.findIndex((p) => p.slug === product.slug);
  if (clash !== -1 && clash !== index) {
    return { ok: false, errors: { slug: "Bu adres başka bir ürüne ait." } };
  }

  const next = [...list];
  if (index === -1) next.push(product);
  else next[index] = product;

  await store.write(next);
  revalidateCatalog(product.slug);
  if (originalSlug && originalSlug !== product.slug) revalidateCatalog(originalSlug);

  return { ok: true, slug: product.slug };
}

export async function deleteProduct(slug: string): Promise<void> {
  const store = getStore();
  const list = await store.read();
  const product = list.find((p) => p.slug === slug);

  await store.write(list.filter((p) => p.slug !== slug));

  // Ürüne ait görseller de gitsin, yoksa depoda yetim dosyalar birikir
  if (product) {
    for (const color of product.colors) {
      for (const image of color.images) {
        await store.deleteImage(image, slug).catch(() => {});
      }
    }
  }

  revalidateCatalog(slug);
}

/** Bir ürünün tek renk varyantına görsel ekler */
export async function addImage(params: {
  slug: string;
  colorKey: string;
  filename: string;
  contentType: string;
  body: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = getStore();
  const list = await store.read();
  const index = list.findIndex((p) => p.slug === params.slug);
  if (index === -1) return { ok: false, error: "Ürün bulunamadı." };

  const product = list[index];
  const colorIndex = product.colors.findIndex((c) => c.key === params.colorKey);
  if (colorIndex === -1) return { ok: false, error: "Bu üründe böyle bir renk yok." };

  const source = await store.putImage({
    slug: params.slug,
    filename: params.filename,
    contentType: params.contentType,
    body: params.body,
  });

  const next: StoredProduct[] = [...list];
  const colors = product.colors.map((c, i) =>
    i === colorIndex
      ? { ...c, images: c.images.includes(source) ? c.images : [...c.images, source] }
      : c,
  );
  next[index] = { ...product, colors };

  await store.write(next);
  revalidateCatalog(params.slug);
  return { ok: true };
}

/** Bir görseli varyanttan çıkarır ve depodan siler */
export async function removeImage(params: {
  slug: string;
  colorKey: string;
  source: string;
}): Promise<void> {
  const store = getStore();
  const list = await store.read();
  const index = list.findIndex((p) => p.slug === params.slug);
  if (index === -1) return;

  const product = list[index];
  const next: StoredProduct[] = [...list];
  next[index] = {
    ...product,
    colors: product.colors.map((c) =>
      c.key === params.colorKey
        ? { ...c, images: c.images.filter((i) => i !== params.source) }
        : c,
    ),
  };

  await store.write(next);
  await store.deleteImage(params.source, params.slug).catch(() => {});
  revalidateCatalog(params.slug);
}

/** Katalog sırasını değiştirir (ürünü listede yukarı/aşağı taşır) */
export async function moveProduct(slug: string, direction: -1 | 1): Promise<void> {
  const store = getStore();
  const list = await store.read();
  const from = list.findIndex((p) => p.slug === slug);
  if (from === -1) return;

  const to = from + direction;
  if (to < 0 || to >= list.length) return;

  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];

  await store.write(next);
  revalidateCatalog();
}
