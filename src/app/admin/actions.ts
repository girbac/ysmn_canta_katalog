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
  addImage,
  deleteProduct,
  moveProduct,
  removeImage,
  saveProduct,
} from "@/lib/catalog/mutate";
import { colorHex, colorName, colorKeys, type ColorKey } from "@/data/colors";

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

  // Palet sırası korunuyor: ilk renk kartlarda kapak görseli olur
  const ordered = colorKeys.filter((k) => selected.includes(k));

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

  return {
    slug: String(formData.get("slug") || "").trim(),
    code: String(formData.get("kod") || "").trim(),
    name: {
      tr: String(formData.get("adTr") || "").trim(),
      en: String(formData.get("adEn") || "").trim(),
    },
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
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin();

  const slug = String(formData.get("slug") || "");
  const colorKey = String(formData.get("renk") || "");
  const file = formData.get("dosya");

  if (!(file instanceof File) || file.size === 0) return { error: "Dosya seçilmedi." };

  const ext = ALLOWED.get(file.type);
  if (!ext) return { error: "Yalnızca webp, avif, jpg veya png yüklenebilir." };
  if (file.size > MAX_BYTES) return { error: "Dosya 6 MB'tan büyük olmamalı." };

  // Dosya adı kullanıcıdan gelmiyor: renk + zaman damgasından üretiliyor.
  // Böylece hem yol geçişi (../) riski kalmıyor hem de isimler çakışmıyor.
  const filename = `${colorKey}-${Date.now().toString(36)}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  try {
    const result = await addImage({
      slug,
      colorKey,
      filename,
      contentType: file.type,
      body,
    });
    return result.ok ? {} : { error: result.error };
  } catch (cause) {
    return { error: writeError(cause) };
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
