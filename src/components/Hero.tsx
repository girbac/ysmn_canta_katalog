"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import type { Product } from "@/data/types";
import { BagSilhouette } from "./BagSilhouette";

/**
 * Açılış. Solda tipografi, sağda tek çanta.
 *
 * Giriş animasyonu (başlığın perde gibi yükselmesi) bilerek CSS ile yapıldı:
 * motion ile yapılsaydı hidrasyon bitene kadar metin görünmez kalır ve
 * sayfanın ölçülen yükleme süresi uzardı. Yardımcı metinler hiç animasyonlu
 * değil — ilk boyamada oradalar.
 *
 * motion yalnızca scroll'a bağlı hareket için kullanılıyor; o zaten
 * kullanıcı kaydırmaya başlamadan devreye girmiyor.
 */
export function Hero({
  product,
  eyebrow,
  title,
  lead,
  scrollHint,
}: {
  product: Product;
  eyebrow: string;
  title: string;
  lead: string;
  scrollHint: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bagY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const bagScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "34%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const lines = title.split("\n");

  return (
    <div ref={ref} className="relative min-h-[92vh] overflow-hidden">
      <div className="mx-auto grid min-h-[92vh] max-w-[1600px] items-center gap-6 px-5 pb-14 pt-28 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:px-10 md:pt-24">
        {/* ── Metin ── */}
        <motion.div
          style={reduce ? undefined : { y: textY, opacity: fade }}
          className="order-2 md:order-1"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-ink-40">{eyebrow}</p>

          <h1 className="mt-6 font-display text-[clamp(2.1rem,5vw,4.4rem)] leading-[1.04] tracking-[-0.02em] text-ink">
            {lines.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <span
                  className="hero-line block"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed text-ink-60">{lead}</p>

          <div className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-40 md:mt-14">
            <span>{scrollHint}</span>
            <motion.span
              aria-hidden="true"
              animate={reduce ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                <path
                  d="M6 1v15m0 0 4-4m-4 4-4-4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </div>
        </motion.div>

        {/* ── Çanta ── */}
        <motion.div
          style={reduce ? undefined : { y: bagY, scale: bagScale }}
          className="order-1 md:order-2"
        >
          <BagSilhouette
            form={product.form}
            hex={product.colors[0].hex}
            idSuffix="hero"
            backdrop={false}
            className="mx-auto h-auto w-[min(74vw,460px)] md:w-full md:max-w-[540px]"
          />
        </motion.div>
      </div>
    </div>
  );
}
