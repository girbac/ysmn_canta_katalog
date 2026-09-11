"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * İki dünya arasındaki perde.
 *
 * Kadın koleksiyonu biter, sayfa kararır, ritim sertleşir ve evrak
 * koleksiyonu başlar. %20'lik bölümü "kalan ürünler" olmaktan çıkaran şey
 * bu geçiş: ayrı bir sekme değil, kataloğun ikinci perdesi.
 */
export function ModeShift({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 1.06]);
  const y = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"]);
  const ruleWidth = useTransform(scrollYProgress, [0.1, 0.5], ["0%", "100%"]);

  return (
    <div
      ref={ref}
      className="relative flex min-h-[88vh] items-center overflow-hidden px-5 py-28 md:px-10"
    >
      <motion.div
        style={reduce ? undefined : { y }}
        className="mx-auto w-full max-w-[1600px]"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-ink-40">{eyebrow}</p>

        <motion.div
          style={reduce ? undefined : { scaleX: ruleWidth }}
          className="mt-6 h-px origin-left bg-line-strong"
        />

        <motion.h2
          style={reduce ? undefined : { scale }}
          className="mt-10 origin-left font-display text-[clamp(2.4rem,8vw,7rem)] leading-[0.98] tracking-[-0.03em] text-ink"
        >
          {title}
        </motion.h2>

        <p className="mt-10 max-w-xl text-base leading-relaxed text-ink-60">{lead}</p>
      </motion.div>
    </div>
  );
}
