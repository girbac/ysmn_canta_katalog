"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Locale } from "@/data/types";
import { useHydrated, useSelection } from "@/store/selection";
import { interpolate } from "@/lib/utils";

/**
 * Sağ altta biriken seçki. Boşken hiç görünmez; ilk ürün eklendiğinde
 * yumuşakça belirir. Katalogu pasif bir vitrinden aktif bir araca çeviren şey bu.
 */
export function SelectionDock({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { dockLabel: string; itemCount: string };
}) {
  const hydrated = useHydrated();
  const count = useSelection((s) => s.items.length);
  const reduce = useReducedMotion();
  const visible = hydrated && count > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20, scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduce ? 0 : 20, scale: reduce ? 1 : 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="no-print fixed bottom-5 right-5 z-40"
        >
          <Link
            href={`/${locale}/secki`}
            className="flex items-center gap-3 rounded-full bg-ink py-3 pl-5 pr-4 text-ground shadow-[0_18px_40px_-16px_var(--shadow)] transition-transform duration-300 hover:scale-[1.03]"
          >
            <span className="text-xs uppercase tracking-[0.16em]">{labels.dockLabel}</span>
            <span
              className="grid h-7 min-w-7 place-items-center rounded-full bg-ground px-2 text-sm font-medium text-ink tabular-nums"
              aria-label={interpolate(labels.itemCount, { n: count })}
            >
              {count}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
