import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Form, Locale, Product } from "@/data/types";
import { getCatalogViews } from "@/lib/catalog/catalog";
import { materialName } from "@/data/materials";
import { ModeSection } from "@/components/ModeSection";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { formatDimensions } from "@/lib/utils";

/**
 * Anasayfa belirli aralıklarla yeniden üretiliyor; katalog değişince
 * zaten ayrıca tazeleniyor.
 *
 * Doğrudan sayı yazılmak zorunda: Next bu ayarı derleme sırasında statik
 * olarak okuyor, içe aktarılan bir sabit kabul edilmiyor.
 */
export const revalidate = 600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);
  const { women: womenProducts, men: menProducts } = await getCatalogViews();

  const cardLabels = (form: Form) => ({
    add: t.product.add,
    added: t.product.added,
    remove: t.product.remove,
    isNew: t.product.new,
    form: t.forms[form],
    colorCount: t.product.colorCount,
  });

  // Anasayfa bir vitrin: her bölümden tat verir, tamamını koleksiyona bırakır.
  // Katalogun tümü tek yerde (/koleksiyon) dursun ki müşteri aynı ürünlerle
  // iki farklı yerde karşılaşıp "burayı görmüş müydüm?" demesin.
  const womenPreview = womenProducts.slice(0, 9);
  const menPreview = menProducts.slice(0, 6);

  return (
    <>
      {/* ── 1 · Kadın — vitrin tadı ── */}
      {/* Açılış bölümü kaldırıldı; ilk bölüm artık bu, üst dolgusu yüzen
          başlık çubuğunu temizleyecek kadar. */}
      <ModeSection
        mode="kadin"
        id="kadin"
        className="cv-auto bg-ground pb-24 pt-28 md:pb-32 md:pt-36"
      >
        <div className="mx-auto max-w-[1280px] px-5 md:px-10">
          <Reveal>
            <SectionHead
              title={t.home.womenTitle}
              lead={t.home.womenLead}
              href={`/${locale}/koleksiyon?bolum=kadin`}
              hrefLabel={`${t.common.viewAll} (${womenProducts.length})`}
            />
          </Reveal>

          {/* Izgarayı ikiye bölen editoryal alıntı şeridi kaldırıldı;
              kartlar tek akışta gidiyor. */}
          <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-14 md:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
            <Grid products={womenPreview} locale={locale} labels={cardLabels} />
          </div>
        </div>
      </ModeSection>

      {/* ── 2 · Erkek koleksiyonu — teknik ızgara ──
          Eskiden burada tam ekranlık bir "perde" bölümü vardı; kaldırıldı çünkü
          içinde ürün yoktu ve bir ekran boyu fazladan kaydırma yaratıyordu.
          Aydınlıktan karanlığa geçiş artık doğrudan bu bölümün kenarında
          oluyor — `data-mode` renk geçişi kesmeyi yumuşatmaya devam ediyor. */}
      <ModeSection
        mode="erkek"
        id="erkek"
        className="cv-auto bg-ground pb-28 pt-24 md:pb-36 md:pt-32"
      >
        <div className="mx-auto max-w-[1280px] px-5 md:px-10">
          <Reveal>
            <SectionHead
              title={t.home.menTitle}
              lead={t.home.menLead}
              href={`/${locale}/koleksiyon?bolum=erkek`}
              hrefLabel={`${t.common.viewAll} (${menProducts.length})`}
            />
          </Reveal>

          <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-16 md:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
            {menPreview.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 0.06}>
                <ProductCard
                  product={p}
                  locale={locale}
                  labels={cardLabels(p.form)}
                />
                {/* Teknik künye — evrak tarafının dili ölçü ve malzeme */}
                <dl className="mt-4 border-t border-line pt-3 text-caption">
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

      {/* ── 3 · Sepet çağrısı ── */}
      <ModeSection mode="kadin" className="bg-ground px-5 py-28 md:px-10 md:py-36">
        <Reveal className="mx-auto max-w-[1280px]">
          <h2 className="max-w-3xl font-whisper text-[clamp(2.2rem,5.4vw,58px)] leading-[1.06] tracking-[-0.04em] text-ink">
            {t.home.ctaTitle}
          </h2>
          <p className="mt-7 max-w-xl text-body text-ink-60">{t.home.ctaLead}</p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/koleksiyon`}
              className="inline-flex items-center gap-3 rounded-card bg-ink px-6 py-4 text-body font-medium text-ground transition-transform duration-300 hover:scale-[1.02]"
            >
              {t.home.ctaButton}
            </Link>
            <a
              href={`https://instagram.com/${site.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-card border border-line-strong bg-ground-2 px-6 py-4 text-body font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
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
        <h2 className="font-whisper text-[clamp(1.8rem,4vw,38px)] leading-[1.08] tracking-[-0.04em] text-ink">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-body text-ink-60">{lead}</p>
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="shrink-0 border-b border-line-strong pb-1 text-body text-ink-60 transition-colors hover:text-ink"
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
  products: Product[];
  locale: Locale;
  labels: (form: Form) => React.ComponentProps<typeof ProductCard>["labels"];
}) {
  return (
    <>
      {/* Eskiden çift sütunlar aşağı kayıyordu (editoryal zikzak);
          çerçeveli kartlarda o kayma ızgarayı bozuk gösteriyor. */}
      {list.map((p, i) => (
        <Reveal key={p.slug} delay={(i % 3) * 0.05}>
          <ProductCard product={p} locale={locale} labels={labels(p.form)} />
        </Reveal>
      ))}
    </>
  );
}
