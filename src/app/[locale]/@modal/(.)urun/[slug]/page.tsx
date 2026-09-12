import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/config/site";
import type { Locale } from "@/data/types";
import { getProductBySlug } from "@/lib/catalog/catalog";
import { Modal } from "@/components/Modal";
import { ProductDetail } from "@/components/ProductDetail";

/**
 * Izgaradan tıklanınca araya giren pencere.
 * Aynı adres doğrudan açılırsa (yenileme, paylaşılan link) bu dosya
 * devreye girmez; /urun/[slug] tam sayfası açılır.
 */
export default async function ProductModal({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const t = getDictionary(locale);

  return (
    <div data-mode={product.segment}>
      <Modal closeLabel={t.nav.close}>
        <ProductDetail
          product={product}
          locale={locale}
          t={t}
          whatsapp={site.whatsapp}
          compact
        />
      </Modal>
    </div>
  );
}
