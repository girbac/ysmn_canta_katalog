import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Locale } from "@/data/types";
import { getCatalog } from "@/lib/catalog/catalog";
import { PrintSelection } from "@/components/PrintSelection";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const catalog = await getCatalog();

  return (
    <PrintSelection
      locale={locale}
      t={t}
      brand={site.brandLong}
      contact={site}
      catalog={catalog}
    />
  );
}
