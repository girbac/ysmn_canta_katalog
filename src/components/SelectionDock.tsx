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
            className="flex items-center gap-3 rounded-card bg-ink py-4 pl-6 pr-4 text-ground transition-transform duration-300 hover:scale-[1.02]"
          >
            <span className="text-body font-medium">{labels.dockLabel}</span>
            <span
              className="grid h-7 min-w-7 place-items-center rounded-full bg-ground px-2 text-caption font-medium text-ink tabular-nums"
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
