"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSession,
  getAdminConfig,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/admin-auth";
import { isAdmin } from "@/lib/admin-session";
import {
  addImages,
  deleteProduct,
  makeCover,
  moveProduct,
  removeImage,
  saveProduct,
} from "@/lib/catalog/mutate";
import { colorHex, colorName, colorKeys, orderColors, type ColorKey } from "@/data/colors";

/** Girişten sonra yalnızca kendi sitemizdeki bir yola dönüyoruz */
function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  return raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin";
}

export async function login(formData: FormData) {
  const config = getAdminConfig();
  if (!config) redirect("/admin/giris");

  const next = safeNext(formData.get("devam"));
  const password = String(formData.get("sifre") ?? "");

  if (!(await verifyPassword(password, config))) {
    redirect(`/admin/giris?hata=1&devam=${encodeURIComponent(next)}`);
  }

  const session = await createSession(config);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.value, {
    ...sessionCookieOptions,
    maxAge: session.maxAge,
    expires: session.expires,
  });

  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/giris");
}


/**
 * Yazma uçlarının ortak kapısı.
 *
 * Proxy zaten /admin'i koruyor ama server action'lar doğrudan da
 * çağrılabilir; her yazma işlemi oturumu kendisi doğruluyor.
 */
async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Yetkisiz.");
}

/** "Manyetik kapak | Magnetic flap" satırlarını çeviri çiftlerine çevirir */
function parseFeatures(raw: string): Array<{ tr: string; en: string }> {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [tr, en] = line.split("|").map((s) => s.trim());
      return { tr: tr ?? "", en: en || tr || "" };
    });
}

/**
 * Katalog kodundan ürün adresi üretir: "2098-S" → "2098-s"
 *
 * Adres hem ürünün internet adresi hem fotoğraf klasörü adı. Panelde ayrı
 * bir kutu olarak sorulmuyor — tek yazılan şey katalog kodu — ama şema
 * ASCII küçük harf istiyor, dolayısıyla burada çevriliyor. Türkçe harfler
 * karşılıklarına iniyor ki "Çanta-Ş" gibi bir kod da geçerli bir adres versin.
 */
const TR_ASCII: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", I: "i", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

function slugFromCode(code: string): string {
  return code
    .split("")
    .map((ch) => TR_ASCII[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function num(value: FormDataEntryValue | null): number {
  return Number(String(value ?? "").replace(",", "."));
}

/**
 * Form alanlarını şemanın beklediği şekle getirir.
 *
 * Dönen nesne henüz doğrulanmamış: hata olursa aynı nesne forma geri
 * veriliyor ki kullanıcı yazdıklarını kaybetmesin.
 */
function productFromForm(formData: FormData) {
  const selected = formData.getAll("renkler").map(String).filter((k) =>
    (colorKeys as readonly string[]).includes(k),
  ) as ColorKey[];

  // Mevcut sıra korunuyor; yeni renkler palet yerine giriyor. Listeyi baştan
  // dizmek, ilk renk kapak olduğu için ürünün kapak rengini değiştirirdi.
  const oncekiSira = String(formData.get("renkSirasi") || "")
    .split(",")
    .filter(Boolean);
  const ordered = orderColors(oncekiSira, selected);

  const existing = (() => {
    try {
      return JSON.parse(String(formData.get("mevcutGorseller") || "{}")) as Record<
        string,
        string[]
      >;
    } catch {
      return {};
    }
  })();

  const strap = String(formData.get("aski") || "");
  const priceRaw = String(formData.get("fiyat") || "").trim();

  const code = String(formData.get("kod") || "").trim();

  /**
   * Adres ve ad artık panelde sorulmuyor; tek yazılan şey katalog kodu.
   *
   * Mevcut bir ürün düzenleniyorsa kendi adresi ve adı gizli alanlarda
   * taşınıyor ve olduğu gibi korunuyor — adres fotoğraf klasörü olduğu için
   * değişmesi yüklenmiş fotoğrafları koparırdı, ad da sessizce kodla
   * değiştirilmiş olurdu. Yeni üründe ikisi de koddan türetiliyor.
   */
  const carriedSlug = String(formData.get("slug") || "").trim();
  const ad = String(formData.get("adTr") || "").trim();

  /**
   * Panelde tek ad kutusu var ve o ad iki dilde de kullanılıyor.
   *
   * Çanta adları marka adları — çevrilmiyorlar. İki ayrı kutu istemek,
   * aynı şeyi iki kez yazdırmaktan başka işe yaramıyordu. Ad boş
   * bırakılırsa kodun kendisi ad oluyor; yalnızca kodla çalışmak isteyen
   * fazladan bir şey yazmasın.
   */
  return {
    slug: carriedSlug || slugFromCode(code),
    code,
    name: { tr: ad || code, en: ad || code },
    segment: String(formData.get("bolum") || ""),
    form: String(formData.get("form") || ""),
    material: String(formData.get("malzeme") || ""),
    dimensions: {
      w: num(formData.get("en")),
      h: num(formData.get("yukseklik")),
      d: num(formData.get("derinlik")),
    },
    colors: ordered.map((key) => ({
      key,
      name: colorName(key),
      hex: colorHex(key),
      images: existing[key] ?? [],
    })),
    features: parseFeatures(String(formData.get("detaylar") || "")),
    ...(strap ? { strap } : {}),
    ...(formData.get("yeni") ? { isNew: true } : {}),
    ...(priceRaw ? { price: Number(priceRaw) } : {}),
  };
}

/**
 * Yazma hatasını okunur bir cümleye çevirir.
 *
 * Sunucu eyleminden fırlayan hata, Next tarafından yutulup yerine boş bir
 * "A server error occurred" ekranı konuyor — yani teşhis için gereken tek
 * bilgi kayboluyor. Depo katmanı zaten ne yapılması gerektiğini söyleyen
 * mesajlar üretiyor ("dosya sistemi salt okunur, Blob bağlayın" gibi);
 * onları panelin içinde göstermek için yakalıyoruz.
 */
function writeError(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return detail.trim() || "Kaydetme sırasında bilinmeyen bir hata oluştu.";
}

/** Formun ham (doğrulanmamış) hali — hata durumunda geri verilir */
export type FormValues = ReturnType<typeof productFromForm>;

export type SaveState =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; values: FormValues };

export async function saveProductAction(
  _prev: SaveState | null,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();

  const original = String(formData.get("orijinalSlug") || "") || undefined;
  const values = productFromForm(formData);

  let result: Awaited<ReturnType<typeof saveProduct>>;
  try {
    result = await saveProduct(values, original);
  } catch (cause) {
    // redirect() burada çağrılmıyor, dolayısıyla yakaladığımız her şey
    // gerçek bir yazma hatası.
    return { ok: false, errors: { _: writeError(cause) }, values };
  }

  if (!result.ok) {
    // Girilenleri geri döndürüyoruz: 15 alanlı bir formun hata sonrası
    // sıfırlanması kabul edilemez.
    return { ok: false, errors: result.errors, values };
  }

  if (!original) redirect(`/admin/urun/${result.slug}?kaydedildi=1`);
  return { ok: true };
}

export async function deleteProductAction(formData: FormData) {
  await assertAdmin();
  // redirect() bilerek try'ın dışında: o da bir istisna fırlatarak
  // çalışıyor, yakalarsak yönlendirme hiç gerçekleşmez.
  let failure: string | null = null;
  try {
    await deleteProduct(String(formData.get("slug") || ""));
  } catch (cause) {
    failure = writeError(cause);
  }
  redirect(failure ? `/admin?hata=${encodeURIComponent(failure)}` : "/admin?silindi=1");
}

export async function moveProductAction(formData: FormData) {
  await assertAdmin();
  const direction = Number(formData.get("yon")) === -1 ? -1 : 1;
  try {
    await moveProduct(String(formData.get("slug") || ""), direction);
  } catch (cause) {
    redirect(`/admin?hata=${encodeURIComponent(writeError(cause))}`);
  }
}

/** Kabul edilen görsel türleri ve üst sınır */
const ALLOWED = new Map([
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);
const MAX_BYTES = 6 * 1024 * 1024;

export async function uploadImageAction(
  _prev: { error?: string; added?: number } | null,
  formData: FormData,
): Promise<{ error?: string; added?: number }> {
  await assertAdmin();

  const slug = String(formData.get("slug") || "");
  const colorKey = String(formData.get("renk") || "");
  // Tek seferde birkaç fotoğraf seçilebiliyor
  const picked = formData
    .getAll("dosya")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (picked.length === 0) return { error: "Dosya seçilmedi." };

  const stamp = Date.now().toString(36);
  const files: Array<{ filename: string; contentType: string; body: Buffer }> = [];
  const skipped: string[] = [];

  for (const [i, file] of picked.entries()) {
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      skipped.push(`${file.name} (yalnızca webp, avif, jpg, png)`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      skipped.push(`${file.name} (6 MB'tan büyük)`);
      continue;
    }
    // Dosya adı kullanıcıdan gelmiyor: renk + zaman damgası + sıra
    // numarasından üretiliyor. Yol geçişi (../) riski kalmıyor; sıra
    // numarası da aynı saniyede seçilen dosyaların birbirini ezmesini
    // engelliyor (hepsi aynı zaman damgasını alıyor).
    files.push({
      filename: `${colorKey}-${stamp}-${i}.${ext}`,
      contentType: file.type,
      body: Buffer.from(await file.arrayBuffer()),
    });
  }

  if (files.length === 0) {
    return { error: `Hiçbiri yüklenemedi: ${skipped.join(", ")}` };
  }

  try {
    const result = await addImages({ slug, colorKey, files });
    if (!result.ok) return { error: result.error };
    return skipped.length > 0
      ? { added: result.added, error: `Atlananlar: ${skipped.join(", ")}` }
      : { added: result.added };
  } catch (cause) {
    return { error: writeError(cause) };
  }
}

export async function makeCoverAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  try {
    await makeCover({
      slug,
      colorKey: String(formData.get("renk") || ""),
      source: String(formData.get("kaynak") || ""),
    });
  } catch (cause) {
    redirect(`/admin/urun/${slug}?hata=${encodeURIComponent(writeError(cause))}`);
  }
}

export async function removeImageAction(formData: FormData) {
  await assertAdmin();
  const slug = String(formData.get("slug") || "");
  try {
    await removeImage({
      slug,
      colorKey: String(formData.get("renk") || ""),
      source: String(formData.get("kaynak") || ""),
    });
  } catch (cause) {
    redirect(`/admin/urun/${slug}?hata=${encodeURIComponent(writeError(cause))}`);
  }
}
