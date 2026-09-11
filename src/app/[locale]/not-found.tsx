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
        <p className="font-mono text-xs tracking-[0.2em] text-ink-40">404</p>
        <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.6rem)] text-ink">
          {t.common.notFound}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-60">
          {t.common.notFoundLead}
        </p>
        <Link
          href={`/${defaultLocale}`}
          className="mt-10 inline-block bg-ink px-8 py-4 text-xs uppercase tracking-[0.18em] text-ground"
        >
          {t.common.backHome}
        </Link>
      </div>
    </div>
  );
}
