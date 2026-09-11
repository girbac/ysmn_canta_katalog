"use client";

import { useEffect } from "react";
import type { Segment } from "@/data/types";

/**
 * Sabit modlu sayfalar için (<body> üzerindeki modu ayarlar).
 *
 * Gerekli, çünkü üstte yüzen başlık ve seçki dock'u sayfa içeriğinin
 * dışında duruyor; modu <body>'den alıyorlar. Bu olmadan koyu bir
 * koleksiyon sayfasında başlık koyu üstünde koyu kalırdı. Ayrıca
 * anasayfadan (scroll'la modu değiştiren) gelindiğinde mod asılı kalmasın.
 */
export function BodyMode({ mode }: { mode: Segment }) {
  useEffect(() => {
    document.body.dataset.mode = mode;
  }, [mode]);

  return null;
}
