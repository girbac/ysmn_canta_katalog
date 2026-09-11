import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, htmlLang } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Locale } from "@/data/types";
import { whatsappUrl } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.about.title,
    description: t.about.body[0],
    alternates: {
      canonical: `/${locale}/atolye`,
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}/atolye`])),
    },
  };
}

export default async function AtelierPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  return (
    <div data-mode="kadin" className="bg-ground">
      <div className="mx-auto max-w-[1000px] px-5 pb-28 pt-32 md:px-10 md:pt-40">
        <Reveal>
          <h1 className="font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[1.04] tracking-[-0.02em] text-ink">
            {t.about.title}
          </h1>
          <p className="mt-5 font-display text-xl text-ink-60">{t.about.lead}</p>
        </Reveal>

        <div className="mt-16 max-w-2xl space-y-7 border-t border-line pt-12">
          {t.about.body.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="text-base leading-[1.75] text-ink-60">{paragraph}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 border-t border-line pt-12">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ink-40">
            {t.about.contactTitle}
          </h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-10">
            <a
              href={whatsappUrl(site.whatsapp, t.selection.whatsappIntro)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xl text-ink transition-colors hover:text-accent"
            >
              {t.about.whatsapp}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="font-display text-2xl text-ink transition-colors hover:text-accent"
            >
              {site.email}
            </a>
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-2xl text-ink transition-colors hover:text-accent"
            >
              @{site.instagram}
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
