/**
 * Admin girişi — tek şifre, imzalı oturum kurabiyesi.
 *
 * Tek kişilik bir panel için kullanıcı tablosu kurmak gereksiz; ama
 * "şifre cookie'ye yazılsın" da olmaz. Burada olan şu: şifre doğruysa
 * sunucu, son kullanma tarihi içeren küçük bir yükü HMAC-SHA256 ile
 * imzalayıp httpOnly kurabiyeye koyuyor. Kurabiye kurcalanırsa imza
 * tutmuyor.
 *
 * Web Crypto kullanılıyor — hem Node hem Edge çalışma zamanında var,
 * yani aynı kod proxy içinde de route handler içinde de geçerli.
 *
 * ŞİFRE TANIMLI DEĞİLSE PANEL KAPALIDIR. Yanlışlıkla herkese açık bir
 * yönetim ekranı bırakmamak için varsayılan "kapalı".
 */

export const SESSION_COOKIE = "ysmn_admin";

/** Oturum ömrü — 12 saat */
const MAX_AGE_SECONDS = 12 * 60 * 60;

const encoder = new TextEncoder();

export type AdminConfig = { password: string; secret: string };

/**
 * Panel yapılandırılmış mı?
 *
 * ADMIN_SECRET verilmezse şifreden türetilmiş bir gizli anahtar
 * kullanılır; bu, imzayı hâlâ şifreye bağlar ve şifre değişince tüm
 * oturumlar düşer. Ayrı bir ADMIN_SECRET vermek yine de tercih edilir.
 */
export function getAdminConfig(): AdminConfig | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) return null;
  return { password, secret: process.env.ADMIN_SECRET || `derived:${password}` };
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of view) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/** Uzunluk sızdırmayan, erken çıkmayan karşılaştırma */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Girilen şifreyi doğrular.
 *
 * İki taraf da HMAC'ten geçiriliyor: böylece karşılaştırma sabit
 * uzunlukta özetler üzerinde yapılıyor ve girdinin uzunluğu bilgi vermiyor.
 */
export async function verifyPassword(
  input: string,
  config: AdminConfig,
): Promise<boolean> {
  const [given, expected] = await Promise.all([
    sign(input, config.secret),
    sign(config.password, config.secret),
  ]);
  return timingSafeEqual(given, expected);
}

/** Son kullanma tarihi imzalı oturum değeri üretir */
export async function createSession(config: AdminConfig): Promise<{
  value: string;
  maxAge: number;
  expires: Date;
}> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = base64url(encoder.encode(JSON.stringify({ exp: expiresAt })));
  const signature = await sign(payload, config.secret);
  return {
    value: `${payload}.${signature}`,
    maxAge: MAX_AGE_SECONDS,
    expires: new Date(expiresAt),
  };
}

/** İmzayı ve süreyi doğrular. Geçersizse false. */
export async function verifySession(
  value: string | undefined,
  config: AdminConfig,
): Promise<boolean> {
  if (!value) return false;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;

  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  if (!timingSafeEqual(signature, await sign(payload, config.secret))) return false;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Kurabiye ayarları — tek yerde dursun ki giriş ve çıkış tutarlı olsun */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};
