"use client";

import { useEffect, useRef, useState } from "react";
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
 * motion yalnızca scroll'a bağlı hareket ve çantalar arası geçiş için
 * kullanılıyor; ikisi de ilk boyamayı bekletmiyor.
 *
 * Çanta tek değil: birkaç parça sırayla geçiyor. Hepsi ilk render'da
 * basılıyor ve yalnızca opaklıkları değişiyor — böylece geçiş sırasında
 * yeni bir şey yüklenmiyor ve sayfa hiç zıplamıyor.
 */
export function Hero({
  products,
  eyebrow,
  title,
  lead,
  scrollHint,
}: {
  /** Sırayla gösterilecek çantalar; ilki ilk boyamada görünen */
  products: Product[];
  eyebrow: string;
  title: string;
  lead: string;
  scrollHint: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);

  /**
   * Yedi saniye: bir ziyaretçi anasayfada ortalama 10-30 saniye kalıyor,
   * yani bu aralıkta birkaç çanta görüyor. Daha uzun bir aralıkta (bir
   * dakika gibi) değişimi neredeyse kimse göremezdi.
   *
   * Hareket azaltma tercihinde hiç dönmüyor: kendiliğinden başlayan ve
   * durmayan bir hareket, tam da o tercihin kapatmak istediği şey.
   */
  useEffect(() => {
    if (reduce || products.length < 2) return;
    const id = setInterval(
      () => setAktif((v) => (v + 1) % products.length),
      7000,
    );
    return () => clearInterval(id);
  }, [reduce, products.length]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bagY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const bagScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "34%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const lines = title.split("\n");

  return (
    <div ref={ref} className="relative min-h-[92vh] overflow-hidden">
      <div className="mx-auto grid min-h-[92vh] max-w-[1280px] items-center gap-6 px-5 pb-14 pt-28 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:px-10 md:pt-24">
        {/* ── Metin ── */}
        <motion.div
          style={reduce ? undefined : { y: textY, opacity: fade }}
          className="order-2 md:order-1"
        >
          <p className="eyebrow text-ink">{eyebrow}</p>

          <h1 className="mt-6 font-whisper text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.92] tracking-[-0.05em] text-ink">
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

          <p className="mt-7 max-w-md text-body text-ink-60">{lead}</p>

          <div className="mt-10 flex items-center gap-3 text-caption text-ink-40 md:mt-14">
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
          {/* Hepsi aynı ızgara gözünde üst üste duruyor: yükseklik en uzun
              çantaya göre sabit kalıyor, geçişte sayfa kaymıyor. */}
          <div className="grid">
            {products.map((p, i) => (
              <motion.div
                key={p.slug}
                className="[grid-area:1/1]"
                initial={{ opacity: i === 0 ? 1 : 0 }}
                animate={{ opacity: i === aktif ? 1 : 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={i === aktif ? undefined : true}
              >
                <BagSilhouette
                  form={p.form}
                  hex={p.colors[0].hex}
                  idSuffix={`hero-${p.slug}`}
                  backdrop={false}
                  className="mx-auto h-auto w-[min(74vw,460px)] md:w-full md:max-w-[540px]"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
