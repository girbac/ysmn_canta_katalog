import type { Form, Localized, Product, Segment } from "./types";
import type { MaterialKey } from "./materials";
import { variant } from "./colors";

/**
 * Katalogun tek ürün kaynağı.
 *
 * Fotoğraf eklemek için: public/products/<slug>/ klasörü açın, dosyaları
 * ilgili rengin `images` dizisine yazın. Dizi boş kaldığı sürece
 * ProductMedia forma göre silüet placeholder çizer.
 */

const F = {
  astar: { tr: "Kumaş astar", en: "Fabric lining" },
  cep: { tr: "İç fermuarlı cep", en: "Inner zip pocket" },
  telefon: { tr: "Telefon bölmesi", en: "Phone slot" },
  kart: { tr: "Kart yuvaları", en: "Card slots" },
  laptop: { tr: '15" laptop bölmesi', en: '15" laptop compartment' },
  laptop14: { tr: '14" laptop bölmesi', en: '14" laptop compartment' },
  ayak: { tr: "Taban ayakları", en: "Protective feet" },
  omuz: { tr: "Çıkarılabilir omuz askısı", en: "Detachable shoulder strap" },
  zincir: { tr: "Zincir askı", en: "Chain strap" },
  manyetik: { tr: "Manyetik kapak", en: "Magnetic flap" },
  elyapimi: { tr: "El dikişi detay", en: "Hand-stitched detail" },
  valiz: { tr: "Valiz geçirme bandı", en: "Trolley sleeve" },
  evrak: { tr: "Evrak bölmesi", en: "Document sleeve" },
  kilit: { tr: "Şifreli kilit", en: "Combination lock" },
} satisfies Record<string, Localized>;

type Seed = {
  slug: string;
  code: string;
  tr: string;
  en: string;
  segment: Segment;
  form: Form;
  colors: Parameters<typeof variant>[0][];
  material: MaterialKey;
  dims: [number, number, number];
  strap?: Product["strap"];
  features: Localized[];
  isNew?: boolean;
};

const SEEDS: Seed[] = [
  // ——————————————————————————— KADIN ———————————————————————————
  { slug: "meridyen-tote", code: "YSM-1001", tr: "Meridyen Tote", en: "Meridyen Tote", segment: "kadin", form: "tote", colors: ["taba", "siyah", "krem"], material: "deri", dims: [36, 30, 13], strap: "sabit", features: [F.astar, F.cep, F.ayak], isNew: true },
  { slug: "liman-tote", code: "YSM-1002", tr: "Liman Tote", en: "Liman Tote", segment: "kadin", form: "tote", colors: ["konyak", "zeytin", "siyah"], material: "tokluk", dims: [38, 32, 15], strap: "sabit", features: [F.astar, F.ayak, F.elyapimi] },
  { slug: "sahil-shopper", code: "YSM-1003", tr: "Sahil Shopper", en: "Sahil Shopper", segment: "kadin", form: "tote", colors: ["krem", "bej", "lacivert"], material: "kanvas", dims: [40, 33, 14], strap: "sabit", features: [F.astar, F.cep] },
  { slug: "asma-tote", code: "YSM-1004", tr: "Asma Tote", en: "Asma Tote", segment: "kadin", form: "tote", colors: ["bordo", "siyah", "vizon"], material: "deri", dims: [34, 29, 12], strap: "sabit", features: [F.astar, F.cep, F.omuz] },
  { slug: "defne-tote", code: "YSM-1005", tr: "Defne Tote", en: "Defne Tote", segment: "kadin", form: "tote", colors: ["zeytin", "taba"], material: "suet", dims: [35, 31, 13], strap: "sabit", features: [F.astar, F.telefon] },
  { slug: "mika-tote", code: "YSM-1006", tr: "Mika Tote", en: "Mika Tote", segment: "kadin", form: "tote", colors: ["antrasit", "krem", "pudra"], material: "vegan", dims: [37, 30, 12], strap: "sabit", features: [F.astar, F.cep, F.laptop14], isNew: true },

  { slug: "hilal-omuz", code: "YSM-1101", tr: "Hilal Omuz Çantası", en: "Hilal Shoulder Bag", segment: "kadin", form: "omuz", colors: ["siyah", "taba", "bordo"], material: "deri", dims: [26, 18, 8], strap: "ayarlanabilir", features: [F.manyetik, F.kart, F.telefon], isNew: true },
  { slug: "peri-omuz", code: "YSM-1102", tr: "Peri Omuz Çantası", en: "Peri Shoulder Bag", segment: "kadin", form: "omuz", colors: ["pudra", "krem", "vizon"], material: "suet", dims: [24, 17, 7], strap: "ayarlanabilir", features: [F.manyetik, F.kart] },
  { slug: "ada-omuz", code: "YSM-1103", tr: "Ada Omuz Çantası", en: "Ada Shoulder Bag", segment: "kadin", form: "omuz", colors: ["lacivert", "siyah"], material: "saffiano", dims: [27, 19, 9], strap: "ayarlanabilir", features: [F.cep, F.kart, F.telefon] },
  { slug: "reyhan-omuz", code: "YSM-1104", tr: "Reyhan Omuz Çantası", en: "Reyhan Shoulder Bag", segment: "kadin", form: "omuz", colors: ["konyak", "zeytin", "krem"], material: "nubuk", dims: [25, 18, 8], strap: "ayarlanabilir", features: [F.manyetik, F.elyapimi] },
  { slug: "sedef-omuz", code: "YSM-1105", tr: "Sedef Omuz Çantası", en: "Sedef Shoulder Bag", segment: "kadin", form: "omuz", colors: ["krem", "pudra", "siyah"], material: "deri", dims: [23, 16, 7], strap: "zincir", features: [F.zincir, F.kart] },
  { slug: "lodos-omuz", code: "YSM-1106", tr: "Lodos Omuz Çantası", en: "Lodos Shoulder Bag", segment: "kadin", form: "omuz", colors: ["antrasit", "bordo"], material: "vegan", dims: [28, 20, 9], strap: "ayarlanabilir", features: [F.cep, F.omuz, F.telefon] },
  { slug: "nisan-omuz", code: "YSM-1107", tr: "Nisan Omuz Çantası", en: "Nisan Shoulder Bag", segment: "kadin", form: "omuz", colors: ["taba", "vizon", "bej"], material: "deri", dims: [26, 18, 8], strap: "ayarlanabilir", features: [F.manyetik, F.kart, F.cep] },
  { slug: "mercan-omuz", code: "YSM-1108", tr: "Mercan Omuz Çantası", en: "Mercan Shoulder Bag", segment: "kadin", form: "omuz", colors: ["bordo", "kahve"], material: "tokluk", dims: [29, 21, 10], strap: "ayarlanabilir", features: [F.elyapimi, F.cep] },

  { slug: "efes-baguette", code: "YSM-1201", tr: "Efes Baguette", en: "Efes Baguette", segment: "kadin", form: "baguette", colors: ["siyah", "krem", "konyak"], material: "deri", dims: [30, 14, 7], strap: "sabit", features: [F.manyetik, F.kart], isNew: true },
  { slug: "inci-baguette", code: "YSM-1202", tr: "İnci Baguette", en: "İnci Baguette", segment: "kadin", form: "baguette", colors: ["pudra", "krem"], material: "suet", dims: [28, 13, 6], strap: "sabit", features: [F.manyetik] },
  { slug: "vera-baguette", code: "YSM-1203", tr: "Vera Baguette", en: "Vera Baguette", segment: "kadin", form: "baguette", colors: ["bordo", "siyah", "lacivert"], material: "saffiano", dims: [31, 15, 7], strap: "zincir", features: [F.zincir, F.kart] },
  { slug: "zeyno-baguette", code: "YSM-1204", tr: "Zeyno Baguette", en: "Zeyno Baguette", segment: "kadin", form: "baguette", colors: ["taba", "zeytin", "vizon"], material: "nubuk", dims: [29, 14, 7], strap: "sabit", features: [F.manyetik, F.elyapimi] },
  { slug: "ela-baguette", code: "YSM-1205", tr: "Ela Baguette", en: "Ela Baguette", segment: "kadin", form: "baguette", colors: ["antrasit", "krem"], material: "vegan", dims: [27, 13, 6], strap: "sabit", features: [F.kart, F.telefon] },

  { slug: "gece-clutch", code: "YSM-1301", tr: "Gece Clutch", en: "Gece Clutch", segment: "kadin", form: "clutch", colors: ["siyah", "bordo"], material: "saffiano", dims: [28, 15, 4], strap: "yok", features: [F.kart, F.manyetik] },
  { slug: "ay-clutch", code: "YSM-1302", tr: "Ay Clutch", en: "Ay Clutch", segment: "kadin", form: "clutch", colors: ["krem", "pudra", "vizon"], material: "suet", dims: [26, 14, 4], strap: "zincir", features: [F.zincir, F.kart], isNew: true },
  { slug: "ipek-clutch", code: "YSM-1303", tr: "İpek Clutch", en: "İpek Clutch", segment: "kadin", form: "clutch", colors: ["lacivert", "siyah", "konyak"], material: "deri", dims: [29, 16, 5], strap: "yok", features: [F.kart, F.elyapimi] },
  { slug: "sahne-clutch", code: "YSM-1304", tr: "Sahne Clutch", en: "Sahne Clutch", segment: "kadin", form: "clutch", colors: ["bordo", "antrasit"], material: "vegan", dims: [27, 15, 4], strap: "zincir", features: [F.zincir, F.manyetik] },

  { slug: "orman-sirt", code: "YSM-1401", tr: "Orman Sırt Çantası", en: "Orman Backpack", segment: "kadin", form: "sirt", colors: ["zeytin", "siyah", "taba"], material: "tokluk", dims: [30, 38, 14], strap: "ayarlanabilir", features: [F.laptop14, F.cep, F.ayak] },
  { slug: "bulut-sirt", code: "YSM-1402", tr: "Bulut Sırt Çantası", en: "Bulut Backpack", segment: "kadin", form: "sirt", colors: ["krem", "pudra", "vizon"], material: "vegan", dims: [28, 35, 12], strap: "ayarlanabilir", features: [F.cep, F.telefon], isNew: true },
  { slug: "yol-sirt", code: "YSM-1403", tr: "Yol Sırt Çantası", en: "Yol Backpack", segment: "kadin", form: "sirt", colors: ["antrasit", "lacivert"], material: "kanvas", dims: [31, 40, 15], strap: "ayarlanabilir", features: [F.laptop, F.valiz, F.cep] },
  { slug: "toprak-sirt", code: "YSM-1404", tr: "Toprak Sırt Çantası", en: "Toprak Backpack", segment: "kadin", form: "sirt", colors: ["kahve", "konyak"], material: "nubuk", dims: [29, 36, 13], strap: "ayarlanabilir", features: [F.elyapimi, F.cep] },

  { slug: "kumsal-postaci", code: "YSM-1501", tr: "Kumsal Postacı", en: "Kumsal Messenger", segment: "kadin", form: "postaci", colors: ["taba", "krem", "siyah"], material: "deri", dims: [27, 21, 9], strap: "ayarlanabilir", features: [F.manyetik, F.cep, F.telefon] },
  { slug: "ruzgar-postaci", code: "YSM-1502", tr: "Rüzgâr Postacı", en: "Rüzgâr Messenger", segment: "kadin", form: "postaci", colors: ["zeytin", "antrasit"], material: "kanvas", dims: [29, 22, 10], strap: "ayarlanabilir", features: [F.cep, F.laptop14] },
  { slug: "mavi-postaci", code: "YSM-1503", tr: "Mavi Postacı", en: "Mavi Messenger", segment: "kadin", form: "postaci", colors: ["lacivert", "vizon", "bordo"], material: "saffiano", dims: [26, 20, 8], strap: "ayarlanabilir", features: [F.manyetik, F.kart] },
  { slug: "yaz-postaci", code: "YSM-1504", tr: "Yaz Postacı", en: "Yaz Messenger", segment: "kadin", form: "postaci", colors: ["krem", "bej", "pudra"], material: "suet", dims: [25, 19, 8], strap: "ayarlanabilir", features: [F.manyetik, F.telefon] },
  { slug: "kule-tote", code: "YSM-1007", tr: "Kule Tote", en: "Kule Tote", segment: "kadin", form: "tote", colors: ["siyah", "antrasit", "bordo"], material: "saffiano", dims: [33, 34, 12], strap: "sabit", features: [F.laptop14, F.astar, F.ayak] },
  { slug: "safran-omuz", code: "YSM-1109", tr: "Safran Omuz Çantası", en: "Safran Shoulder Bag", segment: "kadin", form: "omuz", colors: ["taba", "konyak", "krem"], material: "deri", dims: [24, 17, 8], strap: "zincir", features: [F.zincir, F.manyetik, F.kart] },

  // ——————————————————————— ERKEK / EVRAK ———————————————————————
  { slug: "kanun-evrak", code: "YSM-8001", tr: "Kanun Evrak Çantası", en: "Kanun Briefcase", segment: "erkek", form: "evrak", colors: ["siyah", "kahve"], material: "tokluk", dims: [40, 30, 10], strap: "ayarlanabilir", features: [F.laptop, F.evrak, F.omuz, F.ayak], isNew: true },
  { slug: "meclis-evrak", code: "YSM-8002", tr: "Meclis Evrak Çantası", en: "Meclis Briefcase", segment: "erkek", form: "evrak", colors: ["kahve", "antrasit"], material: "deri", dims: [41, 31, 11], strap: "ayarlanabilir", features: [F.laptop, F.evrak, F.kilit, F.ayak] },
  { slug: "mimar-evrak", code: "YSM-8003", tr: "Mimar Evrak Çantası", en: "Mimar Briefcase", segment: "erkek", form: "evrak", colors: ["antrasit", "siyah", "lacivert"], material: "saffiano", dims: [39, 29, 9], strap: "ayarlanabilir", features: [F.laptop, F.valiz, F.evrak] },
  { slug: "borsa-evrak", code: "YSM-8004", tr: "Borsa Evrak Çantası", en: "Borsa Briefcase", segment: "erkek", form: "evrak", colors: ["siyah", "lacivert"], material: "saffiano", dims: [42, 31, 12], strap: "ayarlanabilir", features: [F.laptop, F.kilit, F.valiz, F.ayak] },
  { slug: "usta-evrak", code: "YSM-8005", tr: "Usta Evrak Çantası", en: "Usta Briefcase", segment: "erkek", form: "evrak", colors: ["konyak", "kahve"], material: "tokluk", dims: [40, 30, 11], strap: "ayarlanabilir", features: [F.elyapimi, F.laptop, F.evrak] },
  { slug: "sefer-postaci", code: "YSM-8101", tr: "Sefer Postacı", en: "Sefer Messenger", segment: "erkek", form: "postaci", colors: ["kahve", "zeytin", "siyah"], material: "kanvas", dims: [38, 28, 11], strap: "ayarlanabilir", features: [F.laptop, F.cep, F.manyetik] },
  { slug: "rota-postaci", code: "YSM-8102", tr: "Rota Postacı", en: "Rota Messenger", segment: "erkek", form: "postaci", colors: ["antrasit", "lacivert"], material: "vegan", dims: [36, 27, 10], strap: "ayarlanabilir", features: [F.laptop14, F.cep, F.valiz], isNew: true },
  { slug: "atlas-sirt", code: "YSM-8201", tr: "Atlas Sırt Çantası", en: "Atlas Backpack", segment: "erkek", form: "sirt", colors: ["siyah", "antrasit", "kahve"], material: "deri", dims: [32, 44, 16], strap: "ayarlanabilir", features: [F.laptop, F.valiz, F.cep, F.ayak] },
];

export const products: Product[] = SEEDS.map((s, i) => ({
  slug: s.slug,
  code: s.code,
  name: { tr: s.tr, en: s.en },
  segment: s.segment,
  form: s.form,
  colors: s.colors.map((c) => variant(c)),
  material: s.material,
  dimensions: { w: s.dims[0], h: s.dims[1], d: s.dims[2] },
  strap: s.strap,
  features: s.features,
  isNew: s.isNew,
  order: i,
}));

export const productsBySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return productsBySlug.get(slug);
}

export const womenProducts = products.filter((p) => p.segment === "kadin");
export const menProducts = products.filter((p) => p.segment === "erkek");

/** Ana sayfadaki "öne çıkanlar" rayı */
export const featured = products.filter((p) => p.isNew);

/** Katalogda gerçekten kullanılan renkler — filtre yalnızca bunları gösterir */
export const usedColorKeys = [
  ...new Set(products.flatMap((p) => p.colors.map((c) => c.key))),
];

/** Katalogda gerçekten kullanılan malzemeler */
export const usedMaterialKeys = [...new Set(products.map((p) => p.material))];

/** Bir rengin hex kodunu katalogdan bulur (filtre pastilleri için) */
export const colorHexByKey = new Map(
  products.flatMap((p) => p.colors.map((c) => [c.key, c.hex] as const)),
);
