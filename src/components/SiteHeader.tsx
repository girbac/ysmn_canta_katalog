"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/data/types";
import { locales, localeLabel } from "@/i18n/config";
import { cx } from "@/lib/utils";

export type HeaderLabels = {
  collection: string;
  women: string;
  men: string;
  about: string;
  selection: string;
  menu: string;
  close: string;
};

export function SiteHeader({
  locale,
  brand,
  labels,
}: {
  locale: Locale;
  brand: string;
  labels: HeaderLabels;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sayfa değişince mobil menü kapansın
  useEffect(() => setOpen(false), [pathname]);

  // Menü açıkken arka plan kaymasın
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /** Aynı sayfayı diğer dilde açan yol */
  const swapLocale = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/(${locales.join("|")})`), "");
    return `/${target}${rest}`;
  };

  const links = [
    { href: `/${locale}/koleksiyon`, label: labels.collection },
    { href: `/${locale}/koleksiyon?bolum=kadin`, label: labels.women },
    { href: `/${locale}/koleksiyon?bolum=erkek`, label: labels.men },
    { href: `/${locale}/atolye`, label: labels.about },
  ];

  return (
    <header
      className={cx(
        "no-print fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "bg-ground/85 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div
        className={cx(
          "mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 transition-all duration-500 md:px-10",
          scrolled ? "h-14 border-b border-line" : "h-20",
        )}
      >
        <Link
          href={`/${locale}`}
          className="font-display text-xl tracking-[0.18em] text-ink"
          aria-label={brand}
        >
          {brand}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label={labels.collection}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-[0.16em] text-ink-60 transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs tracking-[0.12em]">
            {locales.map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                {i > 0 && <span className="text-ink-40">/</span>}
                <Link
                  href={swapLocale(l)}
                  hrefLang={l}
                  className={cx(
                    "transition-colors",
                    l === locale ? "text-ink" : "text-ink-40 hover:text-ink",
                  )}
                  aria-current={l === locale ? "true" : undefined}
                >
                  {localeLabel[l]}
                </Link>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? labels.close : labels.menu}
            className="md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.4" />
              ) : (
                <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-line bg-ground px-5 pb-8 pt-2 md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-line py-4 font-display text-2xl text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/secki`}
              className="py-4 font-display text-2xl text-accent"
            >
              {labels.selection}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
