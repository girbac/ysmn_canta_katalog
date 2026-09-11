import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, htmlLang } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Form, Locale } from "@/data/types";
import { getProduct, products } from "@/data/products";
import { materialName } from "@/data/materials";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = getProduct(slug);
  if (!product) return {};
  const t = getDictionary(locale);

  const description = `${product.name[locale]} — ${t.forms[product.form]}, ${
    materialName(product.material)[locale]
  }. ${product.dimensions.w} × ${product.dimensions.h} × ${product.dimensions.d} ${t.common.cm}.`;

  return {
    title: product.name[locale],
    description,
    alternates: {
      canonical: `/${locale}/urun/${slug}`,
      languages: Object.fromEntries(
        locales.map((l) => [htmlLang[l], `/${l}/urun/${slug}`]),
      ),
    },
    openGraph: {
      type: "website",
      title: `${product.name[locale]} — ${site.brand}`,
      description,
      url: `/${locale}/urun/${slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const product = getProduct(slug);
  if (!product) notFound();
  const t = getDictionary(locale);

  // Aynı formdan, sonra aynı bölümden tamamlanan benzer parçalar
  const related = [
    ...products.filter((p) => p.slug !== slug && p.form === product.form),
    ...products.filter((p) => p.slug !== slug && p.segment === product.segment),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
    .slice(0, 4);

  const cardLabels = (form: Form) => ({
    add: t.product.add,
    added: t.product.added,
    remove: t.product.remove,
    isNew: t.product.new,
    form: t.forms[form],
    colorCount: t.product.colorCount,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    sku: product.code,
    category: t.forms[product.form],
    material: materialName(product.material)[locale],
    color: product.colors.map((c) => c.name[locale]).join(", "),
    brand: { "@type": "Brand", name: site.brand },
    url: `${site.url}/${locale}/urun/${slug}`,
  };

  return (
    <div data-mode={product.segment} className="bg-ground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-32 md:px-10 md:pt-36">
        <ProductDetail product={product} locale={locale} t={t} whatsapp={site.whatsapp} />

        {related.length > 0 && (
          <section className="mt-28 border-t border-line pt-12">
            <h2 className="font-display text-[clamp(1.4rem,3vw,2.2rem)] text-ink">
              {t.product.related}
            </h2>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-8">
              {related.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={i * 0.05}>
                  <ProductCard product={p} locale={locale} labels={cardLabels(p.form)} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
