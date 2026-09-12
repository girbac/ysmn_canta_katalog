import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale } from "@/i18n/config";

/**
 * Bu dosya locale segmentinin içinde olduğu için dil parametresine
 * erişemez (notFound() params'ı taşımaz). Varsayılan dille basıyoruz.
 */
export default function NotFound() {
  const t = getDictionary(defaultLocale);

  return (
    <div data-mode="kadin" className="grid min-h-[75vh] place-items-center bg-ground px-5">
      <div className="text-center">
        <p className="eyebrow text-ink-40">404</p>
        <h1 className="mt-5 font-whisper text-[clamp(2rem,5vw,58px)] leading-[1.06] tracking-[-0.04em] text-ink">
          {t.common.notFound}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-body text-ink-60">
          {t.common.notFoundLead}
        </p>
        <Link
          href={`/${defaultLocale}`}
          className="mt-10 inline-block rounded-card bg-ink px-6 py-4 text-body font-medium text-ground"
        >
          {t.common.backHome}
        </Link>
      </div>
    </div>
  );
}
