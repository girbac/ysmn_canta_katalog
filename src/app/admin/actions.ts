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
  removeImage,
  restoreCatalog,
  saveProduct,
  setCatalogOrder,
} from "@/lib/catalog/mutate";
import type { ColorDef } from "@/data/colors";

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

/**
 * Kutuya yazılmış sayıyı okur — Türkçe yazıldığı hâliyle.
 *
 * "1.500" Türkçede bin beş yüz demek; JavaScript'in Number()'ı onu 1.5
 * okuyor, tarayıcının number kutusu ise hiç kabul etmiyordu. Sonuç:
 * fiyatı alışıldığı gibi yazan kullanıcı Kaydet'e basıyor ve hiçbir şey
 * olmuyordu — hata bile görünmüyordu.
 *
 * Kural basit: üçerli gruplar hâlinde tekrarlanan ayıraç binliktir
 * ("1.500" ve "1,500" → 1500), tek başına duran ayıraç ondalıktır
 * ("1500,50" → 1500.5). İkisi birden varsa sondaki ondalıktır
 * ("1.500,50" → 1500.5). Para birimi ve boşluklar atılıyor.
 */
function num(value: FormDataEntryValue | null): number {
  const ham = String(value ?? "").trim().replace(/[^\d.,-]/g, "");
  if (!ham) return NaN;

  const nokta = ham.lastIndexOf(".");
  const virgul = ham.lastIndexOf(",");

  if (nokta !== -1 && virgul !== -1) {
    const ondalik = nokta > virgul ? "." : ",";
    const binlik = ondalik === "." ? "," : ".";
    return Number(ham.split(binlik).join("").replace(ondalik, "."));
  }

  const ayirac = nokta !== -1 ? "." : virgul !== -1 ? "," : "";
  if (!ayirac) return Number(ham);

  const binlikGibi = new RegExp(`^-?\\d{1,3}(\\${ayirac}\\d{3})+$`).test(ham);
  return Number(binlikGibi ? ham.split(ayirac).join("") : ham.replace(ayirac, "."));
}

/**
 * Form alanlarını şemanın beklediği şekle getirir.
 *
 * Dönen nesne henüz doğrulanmamış: hata olursa aynı nesne forma geri
 * veriliyor ki kullanıcı yazdıklarını kaybetmesin.
 */
function productFromForm(formData: FormData) {
  /**
   * Renkler artık tek bir alanda, sıralı ve tam tanımlı geliyor:
   * [{ key, tr, en, hex }, …]
   *
   * Eskiden yalnızca anahtarlar gönderiliyor, ad ile ton sunucuda hazır
   * paletten okunuyordu — yani palet dışı bir renk tanımlanamıyordu.
   * Sıra da panelde hesaplanıyor (bkz. ProductEditor), böylece ekranda
   * görünen sıra ile kaydedilen sıra tek yerden çıkıyor.
   */
  const ordered: ColorDef[] = (() => {
    try {
      const parsed = JSON.parse(String(formData.get("renkler") || "[]"));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (c): c is ColorDef =>
          Boolean(c) && typeof c.key === "string" && typeof c.hex === "string",
      );
    } catch {
      return [];
    }
  })();

  const strap = String(formData.get("aski") || "");
  // Boş fiyat "fiyat yok" demek; dolu ama okunamayan fiyat ise hata —
  // sessizce yok saymak, girilen fiyatı buharlaştırmak olurdu.
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
    colors: ordered.map((c) => ({
      key: c.key,
      // Renk adı da ürün adı gibi tek kutuda yazılıyor; iki dilde aynı
      // görünüyor. Hazır renklerin İngilizcesi paletten geliyor.
      name: { tr: String(c.tr ?? ""), en: String(c.en || c.tr || "") },
      hex: c.hex,
      // Fotoğraflar formdan gelmiyor; kaydetme sırasında depodakiler
      // korunuyor (bkz. saveProduct).
      images: [],
    })),
    /**
     * Fiyatın YAZILDIĞI hâli de geri dönüyor.
     *
     * Hata durumunda form bu değerleri geri basıyor; sayıya çevrilmiş hâli
     * okunamadıysa NaN oluyor ve kutuda "NaN" yazıyordu — kullanıcının
     * yazdığı metin de kaybolmuş oluyordu. Şema bu alanı tanımadığı için
     * doğrulamada sessizce düşüyor, katalog verisine karışmıyor.
     */
    priceRaw,
    features: parseFeatures(String(formData.get("detaylar") || "")),
    ...(strap ? { strap } : {}),
    ...(formData.get("yeni") ? { isNew: true } : {}),
    ...(priceRaw ? { price: num(priceRaw) } : {}),
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

export type OrderState = { ok: true } | { ok: false; error: string };

/**
 * Katalog sırasını kaydeder.
 *
 * Sıralama panelde anında yapılıyor (bkz. CatalogOrder); buraya yalnızca
 * son hâli geliyor. Eskiden her ok tıklaması ayrı bir yazmaydı: canlıda
 * her tıklama saniyeler sürdüğü için liste elle dizilemiyordu.
 */
export async function saveOrderAction(
  _prev: OrderState | null,
  formData: FormData,
): Promise<OrderState> {
  await assertAdmin();

  const slugs = String(formData.get("sira") || "").split(",").filter(Boolean);
  if (slugs.length === 0) return { ok: false, error: "Kaydedilecek bir sıra gelmedi." };

  try {
    await setCatalogOrder(slugs);
  } catch (cause) {
    return { ok: false, error: writeError(cause) };
  }
  return { ok: true };
}

export type RestoreState = { ok: true; adet: number } | { ok: false; error: string };

/**
 * Katalogu bir yedekten ya da fotoğraflardan geri yükler.
 *
 * İki kaynak da tek bir yerden geçiyor ki geri yükleme her hâlükârda
 * önce mevcut hâli yedekleyip sonra yazsın (bkz. store.write).
 */
export async function restoreCatalogAction(
  _prev: RestoreState | null,
  formData: FormData,
): Promise<RestoreState> {
  await assertAdmin();

  const kaynak = String(formData.get("kaynak") || "");
  const yedek = String(formData.get("yedek") || "");

  let adet = 0;
  try {
    adet = await restoreCatalog(
      kaynak === "yedek"
        ? { tur: "yedek", key: yedek }
        : kaynak === "ham"
        ? { tur: "ham" }
        : { tur: "fotograf" },
    );
  } catch (cause) {
    return { ok: false, error: writeError(cause) };
  }

  /**
   * Başarıda kataloğa gidiliyor.
   *
   * Geri yükleme kurtarma ekranını kendi altından çekiyor: sayfa
   * tazelenince "okunamıyor" bölümü kayboluyor ve onunla birlikte başarı
   * mesajı da gidiyordu — kullanıcı bir şey olup olmadığını göremiyordu.
   * redirect() bilerek try'ın dışında: o da istisna fırlatarak çalışıyor.
   */
  redirect(`/admin?geriYuklendi=${adet}`);
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
  // Renk henüz kaydedilmemiş olabilir; yükleme onu kendisi ekliyor ve
  // bunun için adı ile tonunu bilmesi gerekiyor (palet dışı renkler var).
  const colorTr = String(formData.get("renkAdi") || "").trim();
  const colorHexRaw = String(formData.get("renkHex") || "").trim();
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
    const result = await addImages({
      slug,
      colorKey,
      ...(colorTr ? { colorName: { tr: colorTr, en: String(formData.get("renkAdiEn") || "").trim() || colorTr } } : {}),
      ...(/^#[0-9a-fA-F]{6}$/.test(colorHexRaw) ? { colorHex: colorHexRaw } : {}),
      files,
    });
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
