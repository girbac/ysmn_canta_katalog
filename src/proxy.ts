import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";
import {
  SESSION_COOKIE,
  getAdminConfig,
  verifySession,
} from "@/lib/admin-auth";

const PUBLIC_FILE = /\.[^/]+$/;
const LOGIN_PATH = "/admin/giris";

/**
 * İki iş yapıyor:
 *  1. Admin alanını koruyor (oturum kurabiyesinin imzasını doğrulayarak).
 *  2. Genel sitede dil önekini zorunlu kılıyor: "/" → "/tr".
 *
 * Not: buradaki kontrol tek savunma değil. Sayfalar ve API uçları da
 * oturumu ayrıca doğruluyor — proxy atlanabilir bir katman olarak
 * görülmeli, kapının kendisi değil.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ── Dil önekli admin adresi: /tr/admin → /admin ──
  //
  // Katalogda gezerken adres çubuğunda hep bir dil öneki duruyor; insan
  // sonuna "admin" ekleyince /tr/admin oluyordu ve düz 404 alıyordu —
  // hiçbir ipucu vermeden. Yönetim paneli tek dilli ve dil önekinin
  // dışında yaşıyor, o yüzden öneki atıp doğru adrese yolluyoruz.
  const localizedAdmin = pathname.match(
    new RegExp(`^/(?:${locales.join("|")})(/admin(?:/.*)?)$`),
  );
  if (localizedAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = localizedAdmin[1];
    return NextResponse.redirect(url);
  }

  // ── Admin ──
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const config = getAdminConfig();

    // Şifre tanımlı değilse panel tümüyle kapalı
    if (!config) return NextResponse.next();

    if (pathname === LOGIN_PATH) return NextResponse.next();

    const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, config);
    if (ok) return NextResponse.next();

    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    // Giriş sonrası kullanıcıyı gitmek istediği yere döndürmek için
    url.search = pathname === "/admin" ? "" : `?devam=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // ── Genel site: dil öneki ──
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const preferred =
    accept.startsWith("en") && !accept.startsWith("tr") ? "en" : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|products/).*)"],
};
