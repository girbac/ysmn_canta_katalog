"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectionItem = {
  slug: string;
  /** Seçilen renk anahtarı — boşsa ilk renk varsayılır */
  color?: string;
  qty: number;
  note?: string;
};

/**
 * Seçkideki satır kimliği: **ürün + renk**.
 *
 * Yalnızca slug'a bakılsaydı aynı çantanın bordosunu eklediğinizde siyahı da
 * "seçili" görünür, ikinci rengi hiç ekleyemezdiniz. Oysa bir bayi çoğu zaman
 * aynı modeli iki renkten ister — o yüzden her renk ayrı bir satır.
 */
export function itemKey(slug: string, color?: string): string {
  return `${slug}~${color ?? ""}`;
}

const sameItem = (i: SelectionItem, slug: string, color?: string) =>
  i.slug === slug && (i.color ?? "") === (color ?? "");

type SelectionState = {
  items: SelectionItem[];
  add: (slug: string, color?: string) => void;
  remove: (slug: string, color?: string) => void;
  toggle: (slug: string, color?: string) => void;
  setQty: (slug: string, color: string | undefined, qty: number) => void;
  setNote: (slug: string, color: string | undefined, note: string) => void;
  /** Bir satırın rengini değiştirir; hedef renk zaten varsa adetler birleşir. */
  setColor: (slug: string, from: string | undefined, to: string) => void;
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
          s.items.some((i) => sameItem(i, slug, color))
            ? s
            : { items: [...s.items, { slug, color, qty: 1 }] },
        ),

      remove: (slug, color) =>
        set((s) => ({ items: s.items.filter((i) => !sameItem(i, slug, color)) })),

      toggle: (slug, color) =>
        set((s) =>
          s.items.some((i) => sameItem(i, slug, color))
            ? { items: s.items.filter((i) => !sameItem(i, slug, color)) }
            : { items: [...s.items, { slug, color, qty: 1 }] },
        ),

      setQty: (slug, color, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            sameItem(i, slug, color) ? { ...i, qty: Math.max(1, Math.min(999, qty)) } : i,
          ),
        })),

      setNote: (slug, color, note) =>
        set((s) => ({
          items: s.items.map((i) => (sameItem(i, slug, color) ? { ...i, note } : i)),
        })),

      setColor: (slug, from, to) =>
        set((s) => {
          if ((from ?? "") === to) return s;

          const source = s.items.find((i) => sameItem(i, slug, from));
          if (!source) return s;

          // Hedef renk zaten seçkideyse iki satır tek satıra iner, adetler toplanır
          const target = s.items.find((i) => sameItem(i, slug, to));
          if (target) {
            return {
              items: s.items
                .filter((i) => !sameItem(i, slug, from))
                .map((i) =>
                  sameItem(i, slug, to)
                    ? { ...i, qty: Math.min(999, i.qty + source.qty) }
                    : i,
                ),
            };
          }

          return {
            items: s.items.map((i) => (sameItem(i, slug, from) ? { ...i, color: to } : i)),
          };
        }),

      clear: () => set({ items: [] }),

      merge: (incoming) =>
        set((s) => {
          const byKey = new Map(s.items.map((i) => [itemKey(i.slug, i.color), i]));
          for (const item of incoming) {
            const k = itemKey(item.slug, item.color);
            if (!byKey.has(k)) byKey.set(k, item);
          }
          return { items: [...byKey.values()] };
        }),
    }),
    {
      name: "ysmn-selection",
      version: 2,
      /**
       * v1 → v2: kimlik slug'dan slug+renk'e geçti.
       * Satırların şekli değişmedi ve v1'de zaten ürün başına en fazla bir
       * satır vardı, dolayısıyla eski kayıtlar v2 kurallarına da uyuyor —
       * olduğu gibi taşınıyorlar. Göç fonksiyonu olmasaydı zustand eski
       * seçkiyi sessizce atardı.
       */
      migrate: (persisted) => persisted as { items: SelectionItem[] },
    },
  ),
);

/** useSyncExternalStore için sabit referanslar — her render'da yenilenmesinler */
const noopSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * localStorage'dan okunan durum ilk render'da sunucuyla uyuşmaz.
 * Bu hook hidrasyon bitene kadar `false` döner; seçki sayısı gibi
 * kişiye özel değerleri ancak ondan sonra basıyoruz.
 *
 * useEffect + setState yerine useSyncExternalStore: sunucu anlık görüntüsü
 * false, istemci anlık görüntüsü true olduğu için hidrasyondan sonra
 * fazladan bir render turu olmadan doğru değere geçiyoruz.
 */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, onClient, onServer);
}

/**
 * Seçkiyi paylaşılabilir bir sorgu dizesine çevirir.
 *
 * Biçim: `slug~renk:adet` — renk ve adet ikisi de isteğe bağlı.
 * Örn: "meridyen-tote~taba:3,hilal-omuz~siyah,liman-tote"
 * Renk ayracı "~" olduğu için eski "slug:adet" bağlantıları da okunabilir.
 */
export function encodeSelection(items: SelectionItem[]): string {
  return items
    .map((i) => {
      const base = i.color ? `${i.slug}~${i.color}` : i.slug;
      return i.qty > 1 ? `${base}:${i.qty}` : base;
    })
    .join(",");
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
      const [head, rawQty] = chunk.split(":");
      const [slug, color] = head.split("~");
      const qty = Number(rawQty);
      return {
        slug: slug.trim(),
        color: color?.trim() || undefined,
        qty: Number.isFinite(qty) && qty > 0 ? Math.min(999, Math.floor(qty)) : 1,
      };
    })
    .filter((i) => i.slug.length > 0 && known(i.slug));
}
