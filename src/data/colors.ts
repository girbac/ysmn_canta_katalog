
/**
 * Renk tanımı — panelde seçilen ya da yazılan bir rengin tam hâli.
 *
 * Renkler artık kapalı bir liste DEĞİL. Aşağıdaki palet yalnızca hazır
 * seçenekler; panelde istenen ada ve tona sahip yeni bir renk eklenebiliyor.
 * Ürünler rengi kendi içinde saklıyor (anahtar + ad + hex), dolayısıyla
 * palete sonradan dokunmak kayıtlı ürünleri etkilemiyor.
 */
export type ColorDef = {
  /** Adres ve filtre anahtarı: küçük harf, rakam ve tire */
  key: string;
  tr: string;
  en: string;
  hex: string;
};

/** Anahtarlar serbest metin; tip yalnızca okunurluk için duruyor. */
export type ColorKey = string;

/**
 * Hazır renkler.
 *
 * Panelde tek tıkla seçilir; kendi rengini eklemek isteyen aşağıdaki
 * "kendi rengin" alanını kullanır. Buradaki anahtarlar kayıtlı ürünlerde
 * geçtiği için DEĞİŞTİRİLMEZ — yeni renk eklemek serbest.
 */
const PRESETS: ColorDef[] = [
  // Nötrler
  { key: "siyah", tr: "Siyah", en: "Black", hex: "#14110F" },
  { key: "antrasit", tr: "Antrasit", en: "Charcoal", hex: "#35373B" },
  { key: "gri", tr: "Gri", en: "Grey", hex: "#7A7C80" },
  { key: "acik-gri", tr: "Açık Gri", en: "Light Grey", hex: "#B9BBBE" },
  { key: "beyaz", tr: "Beyaz", en: "White", hex: "#F3F1EC" },
  { key: "kirik-beyaz", tr: "Kırık Beyaz", en: "Off White", hex: "#E8E2D6" },

  // Toprak tonları
  { key: "krem", tr: "Krem", en: "Cream", hex: "#E3D5BE" },
  { key: "sampanya", tr: "Şampanya", en: "Champagne", hex: "#E0CDAE" },
  { key: "bej", tr: "Bej", en: "Beige", hex: "#C9B79C" },
  { key: "kum", tr: "Kum", en: "Sand", hex: "#D6C3A5" },
  { key: "vizon", tr: "Vizon", en: "Taupe", hex: "#8C7B6B" },
  { key: "taba", tr: "Taba", en: "Tan", hex: "#A9784E" },
  { key: "karamel", tr: "Karamel", en: "Caramel", hex: "#A4632A" },
  { key: "bal", tr: "Bal", en: "Honey", hex: "#C08A3E" },
  { key: "konyak", tr: "Konyak", en: "Cognac", hex: "#8B4A2B" },
  { key: "tarcin", tr: "Tarçın", en: "Cinnamon", hex: "#9C5B2E" },
  { key: "kahverengi", tr: "Kahverengi", en: "Brown", hex: "#6B4423" },
  { key: "kahve", tr: "Koyu Kahve", en: "Espresso", hex: "#40301F" },

  // Metalikler
  { key: "altin", tr: "Altın", en: "Gold", hex: "#C9A961" },
  { key: "gumus", tr: "Gümüş", en: "Silver", hex: "#B8BCC0" },
  { key: "bakir", tr: "Bakır", en: "Copper", hex: "#9B5E3C" },
  { key: "bronz", tr: "Bronz", en: "Bronze", hex: "#7A5C3A" },

  // Sıcaklar
  { key: "bordo", tr: "Bordo", en: "Burgundy", hex: "#5C1F2B" },
  { key: "kirmizi", tr: "Kırmızı", en: "Red", hex: "#A81E27" },
  { key: "kiremit", tr: "Kiremit", en: "Terracotta", hex: "#B5502F" },
  { key: "turuncu", tr: "Turuncu", en: "Orange", hex: "#D2792E" },
  { key: "hardal", tr: "Hardal", en: "Mustard", hex: "#C9A227" },
  { key: "sari", tr: "Sarı", en: "Yellow", hex: "#E0C23A" },

  // Pembeler / morlar
  { key: "pudra", tr: "Pudra", en: "Blush", hex: "#D8AFA2" },
  { key: "somon", tr: "Somon", en: "Salmon", hex: "#E39A82" },
  { key: "gul-kurusu", tr: "Gül Kurusu", en: "Dusty Rose", hex: "#B77A78" },
  { key: "fusya", tr: "Fuşya", en: "Fuchsia", hex: "#B03A72" },
  { key: "lila", tr: "Lila", en: "Lilac", hex: "#A996C4" },
  { key: "mor", tr: "Mor", en: "Purple", hex: "#5E3A73" },

  // Maviler / yeşiller
  { key: "lacivert", tr: "Lacivert", en: "Navy", hex: "#1E2A44" },
  { key: "mavi", tr: "Mavi", en: "Blue", hex: "#2E5C8A" },
  { key: "bebe-mavi", tr: "Bebe Mavi", en: "Baby Blue", hex: "#A8C4DE" },
  { key: "petrol", tr: "Petrol", en: "Petrol", hex: "#1F4F52" },
  { key: "turkuaz", tr: "Turkuaz", en: "Turquoise", hex: "#2E9C9C" },
  { key: "nane", tr: "Nane", en: "Mint", hex: "#A9CDB4" },
  { key: "yesil", tr: "Yeşil", en: "Green", hex: "#2F6B3A" },
  { key: "haki", tr: "Haki", en: "Khaki", hex: "#6B6A45" },
  { key: "zeytin", tr: "Zeytin", en: "Olive", hex: "#4A4F35" },
];

export const presetColors: readonly ColorDef[] = PRESETS;

const BY_KEY = new Map(PRESETS.map((c) => [c.key, c]));

export function findColor(key: string): ColorDef | undefined {
  return BY_KEY.get(key);
}

/** Palet dışı bir renk için son çare ton — ürün kendi hex'ini taşıdığı için nadiren gerekir */
export const FALLBACK_HEX = "#8C7B6B";

/**
 * Renk adından anahtar üretir: "Gül Kurusu" → "gul-kurusu"
 *
 * Anahtar filtre adresinde geçtiği için ASCII ve küçük harf olmalı.
 * Türkçe harfler karşılıklarına iniyor.
 */
const TR_ASCII: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

export function colorKeyFromName(name: string): string {
  return name
    .toLocaleLowerCase("tr")
    .split("")
    .map((ch) => TR_ASCII[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/**
 * Renk sırasını korur.
 *
 * Kaydetme eskiden listeyi baştan palet sırasına diziyordu. İlk renk
 * kartlarda kapak görseli olduğu için bu, ürünün adını değiştirmek gibi
 * alakasız bir işlemin kapak rengini değiştirmesine yol açıyordu — hatta
 * fotoğrafı olmayan bir rengi öne alıp ürünü fotoğrafsız gösteriyordu.
 *
 * Artık mevcut sıra olduğu gibi kalıyor, yeni seçilenler sona ekleniyor.
 * Palet sırasına göre araya sokmak, palet kapalı bir liste olmaktan
 * çıktığı için anlamını yitirdi: kendi eklediğin bir rengin "palet yeri"
 * yok. Sona eklemek ayrıca seçtiğin sırayı koruyor.
 */
export function orderColors(previous: string[], selected: string[]): string[] {
  const kalan = previous.filter((k) => selected.includes(k));
  const yeniler = selected.filter((k) => !previous.includes(k));
  return [...kalan, ...yeniler];
}
