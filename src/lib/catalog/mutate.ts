import "server-only";
import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import { findColor } from "@/data/colors";
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

    /**
     * Seçki ve onun A4 baskı görünümü de katalogu okuyor.
     *
     * Baskı sayfası derleme anında üretiliyor (SSG) ve burada
     * tazelenmediği için elindeki katalog derlemeden kalma oluyordu:
     * panelden eklenen fotoğraf PDF'e hiç girmiyor, sonradan
     * değiştirilen renk ve fiyat PDF'te ESKİ hâliyle basılıyordu.
     * Müşteriye giden belge bu; en son tazelenmesi gereken yer burası.
     */
    revalidatePath(`/${locale}/secki`);
    revalidatePath(`/${locale}/secki/yazdir`);
  }
  // Yeni ürün ekleniyorsa henüz üretilmemiş yollar da kalıbıyla işaretlenir
  revalidatePath("/[locale]/urun/[slug]", "page");
  revalidatePath("/sitemap.xml");

  /**
   * Panelin kendi sayfaları da tazelenmeli.
   *
   * Eskiden yalnızca genel sitenin yolları işaretleniyordu. Panel sayfaları
   * force-dynamic olduğu için sunucuda önbelleğe girmiyor, ama istemcideki
   * router önbelleği bir yazma sonrası eski RSC yükünü sunmaya devam
   * ediyordu: renk işaretleyip Kaydet'e basınca alt taraf değişmiyor,
   * ancak sayfadan çıkıp girince düzeliyordu.
   */
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/urun/${slug}`);
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

  const store = getStore();
  const list = await store.read();

  const index = originalSlug ? list.findIndex((p) => p.slug === originalSlug) : -1;

  if (originalSlug && index === -1) {
    return { ok: false, errors: { _: "Düzenlenecek ürün bulunamadı." } };
  }

  /**
   * Fotoğraflar formdan DEĞİL, depodan geliyor.
   *
   * Form eskiden sayfa açıldığı andaki fotoğraf listesini gizli bir alanda
   * taşıyıp Kaydet'te geri yazıyordu. Sayfa açıldıktan sonra yüklenen her
   * fotoğrafı bu sessizce siliyordu: ikinci bir sekme, geri tuşuyla dönülen
   * eski bir sayfa ya da yükleme sonrası tazelemenin gecikmesi yetiyordu.
   * Kullanıcı fotoğrafı tekrar yüklüyor, yine kaydediyor, yine kaybediyordu.
   *
   * Artık kaydetme fotoğraflara hiç karışmıyor: her rengin görselleri
   * yazmadan hemen önce okunan depodaki hâliyle korunuyor. Fotoğraf eklemek
   * ve silmek kendi akışında (bkz. addImages, removeImage). Seçimden
   * çıkarılan rengin görselleri ise bilerek düşüyor — panel bunu önceden
   * uyarıyor.
   */
  const onceki = new Map(
    (index === -1 ? [] : list[index].colors).map((c) => [c.key, c.images]),
  );
  const product: StoredProduct = {
    ...parsed.product,
    colors: parsed.product.colors.map((c) => ({
      ...c,
      images: onceki.get(c.key) ?? c.images,
    })),
  };

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

/**
 * Bir renk varyantına bir ya da daha fazla görsel ekler.
 *
 * Dosyalar tek seferde işleniyor: hepsi yüklendikten sonra katalog bir kez
 * yazılıyor. Dosya başına ayrı oku-yaz yapılsaydı aynı anda giden
 * yüklemeler birbirinin sonucunu eziyordu.
 *
 * SIRA ÖNEMLİ: önce dosyalar yükleniyor, katalog EN SON okunup hemen
 * yazılıyor. Eskiden katalog en başta okunuyordu; fotoğraflar yüklenirken
 * geçen sürede (canlıda her dosya ayrı bir ağ yüklemesi, saniyeler sürüyor)
 * kullanıcı Kaydet'e basarsa, yükleme sonunda o eski katalogu geri yazıyor
 * ve az önce kaydedilen fiyat, isim, ölçü ne varsa siliniyordu. Artık okuma
 * ile yazma arasında yavaş hiçbir iş yok.
 */
export async function addImages(params: {
  slug: string;
  colorKey: string;
  /** Renk üründe henüz yoksa buradan kuruluyor; yoksa hazır palete bakılıyor */
  colorName?: { tr: string; en: string };
  colorHex?: string;
  files: Array<{ filename: string; contentType: string; body: Buffer }>;
}): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  if (params.files.length === 0) return { ok: false, error: "Dosya seçilmedi." };

  const store = getStore();

  // Ürün gerçekten var mı? Megabaytlarca dosyayı boşuna yüklememek için
  // önden bakılıyor; asıl okuma aşağıda, yazmadan hemen önce.
  if (!(await store.read()).some((p) => p.slug === params.slug)) {
    return { ok: false, error: "Ürün bulunamadı." };
  }

  // Yavaş kısım: dosyaların kendisi.
  const sources: string[] = [];
  for (const file of params.files) {
    sources.push(
      await store.putImage({
        slug: params.slug,
        filename: file.filename,
        contentType: file.contentType,
        body: file.body,
      }),
    );
  }

  // Katalog artık okunuyor — ve hemen aşağıda yazılıyor.
  const list = await store.read();
  const index = list.findIndex((p) => p.slug === params.slug);
  if (index === -1) return { ok: false, error: "Ürün bulunamadı." };

  const product = list[index];

  /**
   * Renk üründe yoksa yükleme sırasında ekleniyor.
   *
   * Eskiden "önce Kaydet'e basın" deniyordu: renk işaretlemek yetmiyordu,
   * fotoğraf yükleyebilmek için önce formu kaydetmek gerekiyordu. Oysa
   * fotoğraf yüklemek zaten rengi seçmiş olmak demek; ayrıca bir adım
   * istemenin karşılığı yok.
   */
  let colors = product.colors;
  if (!colors.some((c) => c.key === params.colorKey)) {
    /**
     * Rengin adı ve tonu panelden geliyor (palet dışı renkler de var);
     * gelmediyse hazır palete düşülüyor. İkisi de yoksa renk kurulamaz.
     */
    const hazir = findColor(params.colorKey);
    const ad = params.colorName ?? (hazir && { tr: hazir.tr, en: hazir.en });
    const ton = params.colorHex ?? hazir?.hex;
    if (!ad || !ton) {
      return { ok: false, error: "Bu rengin adı ve tonu bilinmiyor — önce Kaydet'e basın." };
    }

    /**
     * Yeni renk listenin SONUNA ekleniyor; mevcut renklerin sırası
     * olduğu gibi kalıyor. Araya sokmak ya da listeyi yeniden dizmek,
     * ilk renk kapak görseli olduğu için ürünün kartlarda görünen
     * rengini değiştirirdi — fotoğraf yüklemenin böyle bir yan etkisi
     * olmamalı. Panelde de aynı kural işliyor (bkz. orderColors).
     */
    colors = [...colors, { key: params.colorKey, name: ad, hex: ton, images: [] }];
  }
  const colorIndex = colors.findIndex((c) => c.key === params.colorKey);

  const next: StoredProduct[] = [...list];
  next[index] = {
    ...product,
    colors: colors.map((c, i) => {
      if (i !== colorIndex) return c;
      const fresh = sources.filter((src) => !c.images.includes(src));
      return { ...c, images: [...c.images, ...fresh] };
    }),
  };

  await store.write(next);
  revalidateCatalog(params.slug);
  return { ok: true, added: sources.length };
}

/**
 * Bir görseli o rengin başına alır — yani kapak yapar.
 *
 * Kartlarda ve listede ilk görsel gösteriliyor. Bir renge birkaç fotoğraf
 * yüklenebildiğine göre hangisinin kapak olacağı da seçilebilmeli; yoksa
 * tek yol istenmeyeni silmek olurdu.
 */
export async function makeCover(params: {
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
      c.key === params.colorKey && c.images.includes(params.source)
        ? { ...c, images: [params.source, ...c.images.filter((i) => i !== params.source)] }
        : c,
    ),
  };

  await store.write(next);
  revalidateCatalog(params.slug);
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
