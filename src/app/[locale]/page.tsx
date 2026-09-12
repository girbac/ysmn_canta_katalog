import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Form, Locale } from "@/data/types";
import { featured, menProducts, womenProducts, products } from "@/data/products";
import { materialName } from "@/data/materials";
import { EditorialStrip } from "@/components/EditorialStrip";
import { Hero } from "@/components/Hero";
import { ModeSection } from "@/components/ModeSection";
import { ModeShift } from "@/components/ModeShift";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ScrollRail } from "@/components/ScrollRail";
import { formatDimensions } from "@/lib/utils";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const cardLabels = (form: Form) => ({
    add: t.product.add,
    added: t.product.added,
    remove: t.product.remove,
    isNew: t.product.new,
    form: t.forms[form],
    colorCount: t.product.colorCount,
  });

  // Omuz çantası silüeti hero'da en okunaklı form
  const hero = featured.find((p) => p.form === "omuz") ?? featured[0] ?? products[0];
  // Anasayfa bir vitrin: her bölümden tat verir, tamamını koleksiyona bırakır.
  // Katalogun tümü tek yerde (/koleksiyon) dursun ki müşteri aynı ürünlerle
  // iki farklı yerde karşılaşıp "burayı görmüş müydüm?" demesin.
  const womenPreview = womenProducts.slice(0, 8);
  const menPreview = menProducts.slice(0, 4);

  return (
    <>
      {/* ── 1 · Açılış ── */}
      <ModeSection mode="kadin" className="bg-ground">
        <Hero
          product={hero}
          eyebrow={t.home.eyebrow}
          title={t.home.heroTitle}
          lead={t.home.heroLead}
          scrollHint={t.home.scrollHint}
        />
      </ModeSection>

      {/* ── 2 · Öne çıkanlar rayı ── */}
      <ModeSection mode="kadin" className="bg-ground py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <SectionHead title={t.home.featuredTitle} lead={t.home.featuredLead} />
          </Reveal>
        </div>

        <ScrollRail className="mt-14 overflow-hidden px-5 md:px-10" shift={-14}>
          {featured.map((p, i) => (
            <div key={p.slug} className="w-[68vw] shrink-0 sm:w-[42vw] lg:w-[26vw]">
              <ProductCard
                product={p}
                locale={locale}
                labels={cardLabels(p.form)}
                priority={i < 2}
                sizes="(max-width: 640px) 68vw, (max-width: 1024px) 42vw, 26vw"
              />
            </div>
          ))}
        </ScrollRail>
      </ModeSection>

      {/* ── 3 · Kadın — vitrin tadı ── */}
      <ModeSection mode="kadin" id="kadin" className="cv-auto bg-ground py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <SectionHead
              title={t.home.womenTitle}
              lead={t.home.womenLead}
              href={`/${locale}/koleksiyon?bolum=kadin`}
              hrefLabel={`${t.common.viewAll} (${womenProducts.length})`}
            />
          </Reveal>

          <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            <Grid products={womenPreview.slice(0, 4)} locale={locale} labels={cardLabels} />

            <EditorialStrip quote={t.home.strips[0].q} caption={t.home.strips[0].c} />

            <Grid products={womenPreview.slice(4)} locale={locale} labels={cardLabels} />
          </div>
        </div>
      </ModeSection>

      {/* ── 4 · Perde: dünya değişiyor ── */}
      <ModeSection mode="erkek" className="bg-ground">
        <ModeShift
          eyebrow={t.home.modeShiftEyebrow}
          title={t.home.modeShiftTitle}
          lead={t.home.modeShiftLead}
        />
      </ModeSection>

      {/* ── 5 · Erkek / Evrak — teknik ızgara ── */}
      <ModeSection mode="erkek" id="erkek" className="cv-auto bg-ground pb-28 md:pb-36">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <SectionHead
              title={t.home.menTitle}
              lead={t.home.menLead}
              href={`/${locale}/koleksiyon?bolum=erkek`}
              hrefLabel={`${t.common.viewAll} (${menProducts.length})`}
            />
          </Reveal>

          <ul className="mt-16 grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {menPreview.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 4) * 0.06}>
                <ProductCard
                  product={p}
                  locale={locale}
                  labels={cardLabels(p.form)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Teknik künye — evrak tarafının dili ölçü ve malzeme */}
                <dl className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-40">{t.product.dimensions}</dt>
                    <dd className="text-ink-60 tabular-nums">
                      {formatDimensions(p.dimensions, t.common.cm)}
                    </dd>
                  </div>
                  <div className="mt-1 flex justify-between gap-4">
                    <dt className="text-ink-40">{t.product.material}</dt>
                    <dd className="text-ink-60">{materialName(p.material)[locale]}</dd>
                  </div>
                </dl>
              </Reveal>
            ))}
          </ul>
        </div>
      </ModeSection>

      {/* ── 6 · Zanaat ── */}
      <ModeSection mode="kadin" className="bg-ground-2 py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <SectionHead title={t.home.craftTitle} lead={t.home.craftLead} />
          </Reveal>

          <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.craftItems.map((item, i) => (
              <Reveal as="li" key={item.n} delay={i * 0.08}>
                <p className="font-mono text-xs tracking-widest text-accent">{item.n}</p>
                <h3 className="mt-4 font-display text-2xl text-ink">{item.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-60">{item.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </ModeSection>

      {/* ── 7 · Seçki çağrısı ── */}
      <ModeSection mode="kadin" className="bg-ground px-5 py-28 md:px-10 md:py-36">
        <Reveal className="mx-auto max-w-[1600px]">
          <h2 className="max-w-3xl font-display text-[clamp(2rem,5.4vw,4.2rem)] leading-[1.04] tracking-[-0.02em] text-ink">
            {t.home.ctaTitle}
          </h2>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-60">
            {t.home.ctaLead}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/koleksiyon`}
              className="inline-flex items-center gap-3 bg-ink px-8 py-4 text-xs uppercase tracking-[0.18em] text-ground transition-transform duration-300 hover:scale-[1.02]"
            >
              {t.home.ctaButton}
            </Link>
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-line-strong px-8 py-4 text-xs uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-ground"
            >
              @{site.instagram}
            </a>
          </div>
        </Reveal>
      </ModeSection>
    </>
  );
}

/* ───────────────────────── yardımcılar ───────────────────────── */

function SectionHead({
  title,
  lead,
  href,
  hrefLabel,
}: {
  title: string;
  lead: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
      <div>
        <h2 className="font-display text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.06] tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-60">{lead}</p>
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="shrink-0 border-b border-line-strong pb-1 text-xs uppercase tracking-[0.16em] text-ink-60 transition-colors hover:text-ink"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

function Grid({
  products: list,
  locale,
  labels,
}: {
  products: typeof products;
  locale: Locale;
  labels: (form: Form) => React.ComponentProps<typeof ProductCard>["labels"];
}) {
  return (
    <>
      {list.map((p, i) => (
        <Reveal
          key={p.slug}
          delay={(i % 4) * 0.05}
          // Çift sütunlar hafifçe aşağıda başlasın — ızgaraya editoryal kayma
          className="lg:even:mt-14"
        >
          <ProductCard product={p} locale={locale} labels={labels(p.form)} />
        </Reveal>
      ))}
    </>
  );
}
