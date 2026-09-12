import Link from "next/link";
import type { Locale } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import { whatsappUrl } from "@/lib/utils";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <footer className="no-print border-t border-line bg-ground px-5 py-16 md:px-10">
      <div className="mx-auto grid max-w-[1280px] gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-heading-sm font-medium text-ink">{site.brand}</p>
          <p className="mt-3 max-w-xs text-body text-ink-60">{t.about.lead}</p>
        </div>

        <nav className="flex flex-col gap-3" aria-label={t.nav.collection}>
          <Link href={`/${locale}/koleksiyon`} className="text-body text-ink-60 hover:text-ink">
            {t.nav.collection}
          </Link>
          <Link
            href={`/${locale}/koleksiyon?bolum=kadin`}
            className="text-body text-ink-60 hover:text-ink"
          >
            {t.nav.women}
          </Link>
          <Link
            href={`/${locale}/koleksiyon?bolum=erkek`}
            className="text-body text-ink-60 hover:text-ink"
          >
            {t.nav.men}
          </Link>
          <Link href={`/${locale}/atolye`} className="text-body text-ink-60 hover:text-ink">
            {t.nav.about}
          </Link>
          <Link href={`/${locale}/secki`} className="text-body text-ink-60 hover:text-ink">
            {t.nav.selection}
          </Link>
        </nav>

        <div className="flex flex-col gap-3">
          <p className="eyebrow text-ink-40">{t.about.contactTitle}</p>
          <a
            href={whatsappUrl(site.whatsapp, t.selection.whatsappIntro)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body text-ink-60 hover:text-ink"
          >
            {t.about.whatsapp}
          </a>
          <a href={`mailto:${site.email}`} className="text-body text-ink-60 hover:text-ink">
            {site.email}
          </a>
          <a
            href={`https://instagram.com/${site.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body text-ink-60 hover:text-ink"
          >
            @{site.instagram}
          </a>
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-[1280px] text-caption text-ink-40">
        © {new Date().getFullYear()} {site.brandLong} · {site.city}
      </p>
    </footer>
  );
}
