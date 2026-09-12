"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Izgaradan açılan ürün penceresi.
 *
 * Intercepting route ile geliyor: adres çubuğu ürünün kendi adresine döner
 * (paylaşılabilir, yenilenince tam sayfa açılır) ama arkadaki koleksiyon
 * ızgarası ve scroll pozisyonu yerinde kalır. Katalogda gezinirken
 * en çok kaybedilen şey scroll pozisyonudur.
 */
export function Modal({ children, closeLabel }: { children: ReactNode; closeLabel: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Açılışta odağı pencereye al
    // preventScroll: odaklanma pencereyi kaydırmasın
    panelRef.current?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      // Odak tuzağı — Tab pencerenin dışına çıkmasın
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain">
      {/* Arka perde */}
      <motion.button
        type="button"
        onClick={close}
        aria-label={closeLabel}
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 cursor-default bg-black/45 backdrop-blur-[3px]"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        initial={{ opacity: 0, scale: reduce ? 1 : 0.965, y: reduce ? 0 : 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto my-6 w-[min(1280px,calc(100%-1.5rem))] rounded-card bg-ground px-5 py-10 outline-none md:my-10 md:px-10 md:py-12"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-ground-2 text-ink transition-colors hover:bg-ink hover:text-ground md:right-6 md:top-6"
          aria-label={closeLabel}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {children}
      </motion.div>
    </div>
  );
}
