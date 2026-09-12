import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { Form, Locale } from "@/data/types";
import { usedColorKeys, colorHexByKey } from "@/data/products";
import { colorName, type ColorKey } from "@/data/colors";
import { materialKeys, materialName } from "@/data/materials";
import {
  applyFilters,
  availableOptions,
  hasActiveFilters,
  parseFilters,
  type Filters,
} from "@/lib/filters";
import { interpolate } from "@/lib/utils";
import { BodyMode } from "@/components/BodyMode";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Hangi odadayız? Başlık bunu söylüyor — "Koleksiyon" değil, "Kadın Koleksiyonu". */
function sectionTitle(t: ReturnType<typeof getDictionary>, bolum: Filters["bolum"]) {
  if (bolum === "kadin") return t.collection.titleWomen;
  if (bolum === "erkek") return t.collection.titleMen;
  return t.collection.title;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SP;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const filters = parseFilters(await searchParams, usedColorKeys, materialKeys);

  return {
    title: sectionTitle(t, filters.bolum),
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

  // Tıklanabilir her seçenek en az bir ürüne çıkar: erkek tarafında clutch,
  // bordo seçiliyken bordosu olmayan malzeme hiç gösterilmez.
  const options = availableOptions(filters);

  const colorNames = Object.fromEntries(
    usedColorKeys.map((k) => [k, colorName(k as ColorKey)[locale]]),
  );
  const materialNames = Object.fromEntries(
    materialKeys.map((k) => [k, materialName(k)[locale]]),
  );

  const countLabel =
    list.length === 1
      ? t.collection.countOne
      : interpolate(t.collection.count, { n: list.length });

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
      <BodyMode mode={filters.bolum === "erkek" ? "erkek" : "kadin"} />
      <div className="mx-auto max-w-[1600px] px-5 pb-28 pt-28 md:px-10 md:pt-32">
        <header>
          <h1 className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.06] tracking-[-0.02em] text-ink">
            {sectionTitle(t, filters.bolum)}
          </h1>
        </header>

        <div className="mt-8">
          <FilterBar
            locale={locale}
            filters={filters}
            forms={options.forms}
            colors={options.colors}
            materials={options.materials}
            colorHex={Object.fromEntries(colorHexByKey)}
            resultCount={countLabel}
            labels={{
              color: t.collection.filterColor,
              form: t.collection.filterForm,
              material: t.collection.filterMaterial,
              all: t.collection.all,
              clear: t.collection.clear,
              showFilters: t.collection.showFilters,
              hideFilters: t.collection.hideFilters,
              removeFilter: t.collection.removeFilter,
              sortLabel: t.collection.sortLabel,
              sorts: {
                katalog: t.collection.sortDefault,
                yeni: t.collection.sortNew,
                isim: t.collection.sortNameAsc,
              },
              forms: t.forms,
              segments: t.segments,
              colorNames,
              materialNames,
            }}
          />
        </div>

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
