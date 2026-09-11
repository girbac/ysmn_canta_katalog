import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { Form, Locale } from "@/data/types";
import { usedColorKeys, usedMaterialKeys, colorHexByKey } from "@/data/products";
import { colorName, type ColorKey } from "@/data/colors";
import { materialKeys } from "@/data/materials";
import { applyFilters, hasActiveFilters, parseFilters } from "@/lib/filters";
import { interpolate } from "@/lib/utils";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.meta.collectionTitle,
    description: t.meta.collectionDescription,
    alternates: { canonical: `/${locale}/koleksiyon` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SP;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const sp = await searchParams;
  const filters = parseFilters(sp, usedColorKeys, materialKeys);
  const list = applyFilters(filters, locale);

  const colorNames = Object.fromEntries(
    usedColorKeys.map((k) => [k, colorName(k as ColorKey)[locale]]),
  );

  const cardLabels = (form: Form) => ({
    add: t.product.add,
    added: t.product.added,
    remove: t.product.remove,
    isNew: t.product.new,
    form: t.forms[form],
    colorCount: t.product.colorCount,
  });

  return (
    <div data-mode={filters.bolum === "erkek" ? "erkek" : "kadin"} className="bg-ground">
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-32 md:px-10 md:pt-36">
        <header>
          <h1 className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.06] tracking-[-0.02em] text-ink">
            {t.collection.title}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-60">
            {t.collection.lead}
          </p>
        </header>

        <div className="mt-10">
          <FilterBar
            locale={locale}
            filters={filters}
            colors={usedColorKeys}
            materials={usedMaterialKeys}
            colorHex={Object.fromEntries(colorHexByKey)}
            labels={{
              filters: t.collection.filters,
              color: t.collection.filterColor,
              form: t.collection.filterForm,
              material: t.collection.filterMaterial,
              segment: t.collection.filterSegment,
              all: t.collection.all,
              clear: t.collection.clear,
              sortLabel: t.collection.sortLabel,
              sorts: {
                katalog: t.collection.sortDefault,
                yeni: t.collection.sortNew,
                isim: t.collection.sortNameAsc,
              },
              forms: t.forms,
              segments: t.segments,
              colorNames,
            }}
          />
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-ink-40" aria-live="polite">
          {list.length === 1
            ? t.collection.countOne
            : interpolate(t.collection.count, { n: list.length })}
        </p>

        {list.length === 0 ? (
          <div className="py-28 text-center">
            <p className="font-display text-2xl text-ink">{t.collection.empty}</p>
            {hasActiveFilters(filters) && (
              <Link
                href={`/${locale}/koleksiyon`}
                className="mt-6 inline-block border-b border-line-strong pb-1 text-xs uppercase tracking-[0.16em] text-ink-60 hover:text-ink"
              >
                {t.collection.clear}
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {list.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 4) * 0.05}>
                <ProductCard
                  product={p}
                  locale={locale}
                  labels={cardLabels(p.form)}
                  priority={i < 4}
                />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
