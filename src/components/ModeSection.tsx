"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Segment } from "@/data/types";

/**
 * Bölümü kendi paletine boyar VE ekranın ortasına geldiğinde
 * <body> üzerindeki modu da değiştirir — böylece üstte yüzen
 * başlık ve seçki dock'u da aynı dünyaya geçer.
 */
export function ModeSection({
  mode,
  children,
  className,
  id,
}: {
  mode: Segment;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) document.body.dataset.mode = mode;
      },
      // Ekranın orta şeridine girdiğinde tetiklensin
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  return (
    <section ref={ref} id={id} data-mode={mode} className={className}>
      {children}
    </section>
  );
}
