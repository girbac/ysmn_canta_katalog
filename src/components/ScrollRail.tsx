"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Dikey scroll'a bağlı yatay ray.
 *
 * Sayfa aşağı kaydıkça içerik yana süzülür; bu, katalogda "kaydırma keyfi"nin
 * omurgası. Dokunmatik cihazda ray zaten parmakla da kaydırılabilir, o yüzden
 * overflow açık bırakıldı — hareket sadece görsel bir katman.
 */
export function ScrollRail({
  children,
  /** Rayın toplam kayma miktarı (yüzde). Negatif = sola. */
  shift = -18,
  className,
}: {
  children: ReactNode;
  shift?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", `${shift}%`]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={reduce ? undefined : { x }}
        className="rail-scroll flex gap-5 overflow-x-auto pb-2 md:gap-8 md:overflow-visible"
      >
        {children}
      </motion.div>
    </div>
  );
}
