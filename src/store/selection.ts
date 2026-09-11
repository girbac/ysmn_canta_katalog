"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectionItem = {
  slug: string;
  /** Seçilen renk anahtarı — boşsa ilk renk varsayılır */
  color?: string;
  qty: number;
  note?: string;
};

type SelectionState = {
  items: SelectionItem[];
  add: (slug: string, color?: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string, color?: string) => void;
  setQty: (slug: string, qty: number) => void;
  setNote: (slug: string, note: string) => void;
  setColor: (slug: string, color: string) => void;
  clear: () => void;
  /** Paylaşılan bir seçkiyi mevcut seçkiyle birleştirir */
  merge: (items: SelectionItem[]) => void;
};

export const useSelection = create<SelectionState>()(
  persist(
    (set) => ({
      items: [],

      add: (slug, color) =>
        set((s) =>
          s.items.some((i) => i.slug === slug)
            ? s
            : { items: [...s.items, { slug, color, qty: 1 }] },
        ),

      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),

      toggle: (slug, color) =>
        set((s) =>
          s.items.some((i) => i.slug === slug)
            ? { items: s.items.filter((i) => i.slug !== slug) }
            : { items: [...s.items, { slug, color, qty: 1 }] },
        ),

      setQty: (slug, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.slug === slug ? { ...i, qty: Math.max(1, Math.min(999, qty)) } : i,
          ),
        })),

      setNote: (slug, note) =>
        set((s) => ({
          items: s.items.map((i) => (i.slug === slug ? { ...i, note } : i)),
        })),

      setColor: (slug, color) =>
        set((s) => ({
          items: s.items.map((i) => (i.slug === slug ? { ...i, color } : i)),
        })),

      clear: () => set({ items: [] }),

      merge: (incoming) =>
        set((s) => {
          const bySlug = new Map(s.items.map((i) => [i.slug, i]));
          for (const item of incoming) if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
          return { items: [...bySlug.values()] };
        }),
    }),
    { name: "ysmn-selection", version: 1 },
  ),
);

/**
 * localStorage'dan okunan durum ilk render'da sunucuyla uyuşmaz.
 * Bu hook hidrasyon bitene kadar `false` döner; seçki sayısı gibi
 * kişiye özel değerleri ancak ondan sonra basıyoruz.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Seçkiyi paylaşılabilir bir sorgu dizesine çevirir: "slug:2,slug2" */
export function encodeSelection(items: SelectionItem[]): string {
  return items.map((i) => (i.qty > 1 ? `${i.slug}:${i.qty}` : i.slug)).join(",");
}

/** Paylaşım dizesini çözer. Bilinmeyen slug'lar `known` ile elenir. */
export function decodeSelection(
  value: string | null | undefined,
  known: (slug: string) => boolean,
): SelectionItem[] {
  if (!value) return [];
  return value
    .split(",")
    .map((chunk) => {
      const [slug, rawQty] = chunk.split(":");
      const qty = Number(rawQty);
      return {
        slug: slug.trim(),
        qty: Number.isFinite(qty) && qty > 0 ? Math.min(999, Math.floor(qty)) : 1,
      };
    })
    .filter((i) => i.slug.length > 0 && known(i.slug));
}
