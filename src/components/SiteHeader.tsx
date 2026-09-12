"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import type { Locale, Segment } from "@/data/types";
import { locales, localeLabel } from "@/i18n/config";
import { cx } from "@/lib/utils";

export type HeaderLabels = {
  /** Menünün erişilebilirlik adı */
  collection: string;
  women: string;
  men: string;
  about: string;
  selection: string;
  menu: string;
  close: string;
};

type NavLink = {
  href: string;
  label: string;
  /** Aktif sayfa eşleşmesi — bölüm bilgisi query string'de duruyor */
  path: string;
  bolum?: Segment;
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

  /**
   * Üç başlık, üç ayrı yer. Eskiden dört vardı ve üçü (Koleksiyon, Kadın,
   * Erkek) aynı sayfaya gidiyordu — müşteri aynı odaya üç kapıdan girip
   * "burayı görmüş müydüm?" diyordu. Kadın + Erkek zaten tüm katalogu kapsıyor.
   */
  const links: NavLink[] = [
    {
      href: `/${locale}/koleksiyon?bolum=kadin`,
      label: labels.women,
      path: `/${locale}/koleksiyon`,
      bolum: "kadin",
    },
    {
      href: `/${locale}/koleksiyon?bolum=erkek`,
      label: labels.men,
      path: `/${locale}/koleksiyon`,
      bolum: "erkek",
    },
    { href: `/${locale}/atolye`, label: labels.about, path: `/${locale}/atolye` },
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

        {/* Fallback aynı menüyü işaretsiz basar: bağlantılar ilk HTML'de
            yerinde durur, aktif işaret hidrasyonda gelir. */}
        <Suspense
          fallback={<DesktopNav links={links} activeHref={null} label={labels.collection} />}
        >
          <WithActiveHref links={links}>
            {(activeHref) => (
              <DesktopNav links={links} activeHref={activeHref} label={labels.collection} />
            )}
          </WithActiveHref>
        </Suspense>

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
          <Suspense
            fallback={
              <MobileNav
                links={links}
                activeHref={null}
                locale={locale}
                selectionLabel={labels.selection}
                onNavigate={() => setOpen(false)}
              />
            }
          >
            <WithActiveHref links={links}>
              {(activeHref) => (
                <MobileNav
                  links={links}
                  activeHref={activeHref}
                  locale={locale}
                  selectionLabel={labels.selection}
                  onNavigate={() => setOpen(false)}
                />
              )}
            </WithActiveHref>
          </Suspense>
        </div>
      )}
    </header>
  );
}

/**
 * Aktif bağlantıyı hesaplar.
 *
 * `useSearchParams` prerender edilen bir route'ta en yakın Suspense sınırına
 * kadar olan ağacı istemci tarafına çektiği için bu bileşen bilerek ince
 * tutuldu — çağıran taraf onu <Suspense> içine alıyor.
 */
function WithActiveHref({
  links,
  children,
}: {
  links: NavLink[];
  children: (activeHref: string | null) => ReactNode;
}) {
  const pathname = usePathname();
  const bolum = useSearchParams().get("bolum");

  const active =
    links.find((l) => l.path === pathname && (l.bolum ?? null) === bolum)?.href ?? null;

  return <>{children(active)}</>;
}

function DesktopNav({
  links,
  activeHref,
  label,
}: {
  links: NavLink[];
  activeHref: string | null;
  label: string;
}) {
  return (
    <nav className="hidden items-center gap-8 md:flex" aria-label={label}>
      {links.map((l) => {
        const active = l.href === activeHref;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "relative text-xs uppercase tracking-[0.16em] transition-colors",
              active
                ? "text-ink after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:bg-ink"
                : "text-ink-60 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNav({
  links,
  activeHref,
  locale,
  selectionLabel,
  onNavigate,
}: {
  links: NavLink[];
  activeHref: string | null;
  locale: Locale;
  selectionLabel: string;
  /** Bağlantıya basınca paneli kapat — /koleksiyon?bolum=kadin → ?bolum=erkek
      gibi yalnızca query'nin değiştiği geçişlerde de çalışır. */
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-col">
      {links.map((l) => {
        const active = l.href === activeHref;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "border-b border-line py-4 font-display text-2xl",
              active ? "text-accent" : "text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <Link
        href={`/${locale}/secki`}
        onClick={onNavigate}
        className="py-4 font-display text-2xl text-accent"
      >
        {selectionLabel}
      </Link>
    </nav>
  );
}
