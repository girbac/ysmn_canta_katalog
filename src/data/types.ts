export type Locale = "tr" | "en";

export type Localized = Record<Locale, string>;

/** Koleksiyon bölümü. Katalogun iki "dünyası" bu alandan sürülür. */
export type Segment = "kadin" | "erkek";

/** Çanta formu. ProductMedia bu alana göre silüet çizer. */
export type Form =
  | "tote"
  | "omuz"
  | "baguette"
  | "clutch"
  | "sirt"
  | "evrak"
  | "postaci";

import type { MaterialKey } from "./materials";

export type Strap = "ayarlanabilir" | "zincir" | "sabit" | "yok";

export type ColorVariant = {
  /** Filtre ve URL'de kullanılan anahtar */
  key: string;
  name: Localized;
  /** Pastil rengi ve placeholder tonlaması */
  hex: string;
  /**
   * public/products/<slug>/ altındaki dosya adları.
   * Boşsa ProductMedia silüet placeholder'ı çizer.
   */
  images: string[];
};

export type Product = {
  slug: string;
  /** Katalog kodu — WhatsApp mesajında ve baskıda bunu kullanıyoruz */
  code: string;
  name: Localized;
  segment: Segment;
  form: Form;
  colors: ColorVariant[];
  material: MaterialKey;
  /** Santimetre. ScaleCompare bu değerlerden ölçek çizer. */
  dimensions: { w: number; h: number; d: number };
  strap?: Strap;
  features: Localized[];
  /** Opsiyonel. Tanımlıysa arayüzde gösterilir, değilse gizlenir. */
  price?: number;
  isNew?: boolean;
  /** Katalog sırası — küçük olan önce gelir */
  order: number;
};
