import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Locale } from "@/data/types";
import { BodyMode } from "@/components/BodyMode";
import { getCatalog } from "@/lib/catalog/catalog";
import { SelectionView } from "@/components/SelectionView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.selectionTitle,
    // Kişiye özel ve paylaşım bağlantılı bir sayfa — dizine girmesin
    robots: { index: false, follow: true },
  };
}

export default async function SelectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const sp = await searchParams;
  const s = Array.isArray(sp.s) ? sp.s[0] : sp.s;
  const catalog = await getCatalog();

  return (
    <div data-mode="kadin" className="min-h-[70vh] bg-ground">
      <BodyMode mode="kadin" />
      <div className="mx-auto max-w-[1100px] px-5 pb-28 pt-32 md:px-10 md:pt-36">
        <header className="mb-12">
          <h1 className="font-whisper text-[clamp(2rem,5vw,58px)] leading-[1.06] tracking-[-0.04em] text-ink">
            {t.selection.title}
          </h1>
          <p className="mt-3 max-w-md text-body text-ink-60">
            {t.selection.lead}
          </p>
        </header>

        <SelectionView
          locale={locale}
          t={t}
          whatsapp={site.whatsapp}
          brand={site.brandLong}
          email={site.email}
          siteUrl={site.url}
          catalog={catalog}
          sharedRaw={s}
        />
      </div>
    </div>
  );
}
