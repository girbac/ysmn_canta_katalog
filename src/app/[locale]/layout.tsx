import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, isLocale, htmlLang } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Locale } from "@/data/types";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SelectionDock } from "@/components/SelectionDock";

/**
 * Tek yazı karakteri — başlık da gövde de aynı seriften.
 *
 * Cosmos'un cosmosOracle'ı için doğrudan önerdiği ikame Fraunces.
 * Değişken eksenler sayesinde imza ağırlık 350'yi ("fısıltı") ve
 * küçük punto için optik boyutlandırmayı aynı dosyadan alıyoruz.
 * WONK kapalı: didone karakteri kalsın, tuhaflık girmesin.
 */
const cosmos = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-cosmos",
  display: "swap",
  // weight verilmiyor: değişken eksen açık kalsın ki 350 kullanılabilsin
  axes: ["SOFT", "opsz"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(site.url),
    /* robots.txt'in yanında ikinci kilit: katalog hazırlanırken sayfalar
       arama sonuçlarına düşmesin. İkisi birlikte açılacak (bkz. robots.ts). */
    robots: { index: false, follow: false },
    title: {
      default: `${site.brand} — ${t.meta.homeTitle}`,
      template: `%s — ${site.brand}`,
    },
    description: t.meta.homeDescription,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [htmlLang[l], `/${l}`]),
      ),
    },
    openGraph: {
      type: "website",
      siteName: site.brand,
      locale: htmlLang[locale],
      title: `${site.brand} — ${t.meta.homeTitle}`,
      description: t.meta.homeDescription,
      url: `/${locale}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  /** Intercepting route yuvası — ızgaradan açılan ürün penceresi */
  modal: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale as Locale;
  const t = getDictionary(l);

  return (
    <html
      lang={htmlLang[l]}
      // Next route geçişlerinde yumuşak scroll'u devre dışı bırakır
      data-scroll-behavior="smooth"
      className={cosmos.variable}
    >
      <body data-mode="kadin">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ground"
        >
          {t.nav.skipToContent}
        </a>
        <SiteHeader
          locale={l}
          brand={site.brand}
          labels={{
            collection: t.nav.collection,
            women: t.nav.women,
            men: t.nav.men,
            about: t.nav.about,
            selection: t.nav.selection,
            menu: t.nav.menu,
            close: t.nav.close,
          }}
        />

        <main id="main">{children}</main>

        {modal}

        <SiteFooter locale={l} t={t} />

        <SelectionDock
          locale={l}
          labels={{ dockLabel: t.selection.dockLabel, itemCount: t.selection.itemCount }}
        />
      </body>
    </html>
  );
}
