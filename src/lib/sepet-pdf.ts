import type { Locale, Product } from "@/data/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SelectionItem } from "@/store/selection";
import { materialName } from "@/data/materials";
import { resolveImageSource } from "@/lib/catalog/image-source";
import { formatDimensions, formatPrice, interpolate, selectionTotal } from "@/lib/utils";

/**
 * ── Sepetin PDF'i ──
 *
 * Eskiden PDF, tarayıcının yazdırma penceresinden ("PDF olarak kaydet")
 * alınıyordu. Bilgisayarda çalışıyordu ama telefonda çalışmıyor:
 * iOS'taki Chrome'da ve Instagram/WhatsApp içindeki tarayıcılarda
 * window.print() hiçbir şey yapmıyor — düğmeye basılıyor, ekranda hiçbir
 * şey olmuyor. Katalog ağırlıkla telefondan kullanıldığı için bu, PDF'in
 * pratikte çalışmaması demekti.
 *
 * Burada PDF'i kendimiz kuruyoruz: dosya tarayıcıda oluşuyor, sonra
 * paylaşılıyor ya da indiriliyor. Yazdırma penceresine hiç ihtiyaç yok,
 * dolayısıyla her telefonda aynı şekilde çalışıyor.
 *
 * Yazı tipleri: DejaVu'nun Türkçe harfleri ve ₺ işaretini kapsayan küçük
 * bir altkümesi (public/fonts). PDF'in gömülü yazı tipi olmadan Türkçe
 * yazamamasının sebebi, hazır PDF yazı tiplerinin ş/ğ/ı harflerini
 * tanımaması.
 */

export type PdfSatir = { item: SelectionItem; product: Product };

/* A4, punto cinsinden */
const SAYFA_EN = 595.28;
const SAYFA_BOY = 841.89;
const KENAR = 40;
const UST = 44;
const ALT = 46;

const SATIR_YUKSEK = 58;
const FOTO_EN = 40;
const FOTO_BOY = 52;

/** #8C7B6B → {r,g,b} (0–1) */
function renk(hex: string): { r: number; g: number; b: number } {
  const t = hex.replace("#", "").trim();
  const tam = t.length === 3 ? t.split("").map((c) => c + c).join("") : t;
  const say = Number.parseInt(tam.slice(0, 6), 16);
  if (!Number.isFinite(say)) return { r: 0.55, g: 0.48, b: 0.42 };
  return { r: ((say >> 16) & 255) / 255, g: ((say >> 8) & 255) / 255, b: (say & 255) / 255 };
}

/** Kutuya sığmayan metni "…" ile kısaltır */
function kirp(
  metin: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  boyut: number,
  genislik: number,
): string {
  if (font.widthOfTextAtSize(metin, boyut) <= genislik) return metin;
  let kesik = metin;
  while (kesik.length > 1 && font.widthOfTextAtSize(kesik + "…", boyut) > genislik) {
    kesik = kesik.slice(0, -1);
  }
  return kesik + "…";
}

/** Yuvarlak köşeli çerçeve — kod etiketi için */
function yuvarlakYol(w: number, h: number, r: number): string {
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

/** Yazı tipleri bir kez indirilip saklanıyor */
let yaziTipleri: Promise<[ArrayBuffer, ArrayBuffer, ArrayBuffer]> | null = null;
function yaziTipleriniGetir() {
  yaziTipleri ??= Promise.all([
    fetch("/fonts/sepet-serif.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/sepet-sans.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/sepet-sans-bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  return yaziTipleri;
}

/**
 * Ürün fotoğrafını JPEG'e çevirir.
 *
 * Fotoğraflar WebP olarak saklanıyor; PDF WebP gömmeyi bilmiyor. Tuval
 * üzerinden JPEG'e çevirmek hem bu sorunu çözüyor hem de dosyayı
 * küçültüyor: PDF'te 40×52 punto basılan bir görselin 2000 piksel
 * olmasının anlamı yok.
 */
async function fotoJpeg(url: string): Promise<{ bytes: Uint8Array; en: number; boy: number } | null> {
  try {
    const yanit = await fetch(url);
    if (!yanit.ok) return null;
    const blob = await yanit.blob();
    const resim = await createImageBitmap(blob);

    const ENBUYUK = 320;
    const olcek = Math.min(1, ENBUYUK / Math.max(resim.width, resim.height));
    const en = Math.max(1, Math.round(resim.width * olcek));
    const boy = Math.max(1, Math.round(resim.height * olcek));

    const tuval = document.createElement("canvas");
    tuval.width = en;
    tuval.height = boy;
    const ctx = tuval.getContext("2d");
    if (!ctx) return null;
    /* JPEG'in saydamlığı yok: zemin beyaz kalsın, yoksa saydam alanlar
       siyah basılıyor. */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, en, boy);
    ctx.drawImage(resim, 0, 0, en, boy);
    resim.close?.();

    const jpeg: Blob | null = await new Promise((coz) =>
      tuval.toBlob((b) => coz(b), "image/jpeg", 0.82),
    );
    if (!jpeg) return null;
    return { bytes: new Uint8Array(await jpeg.arrayBuffer()), en, boy };
  } catch {
    /* Tek bir fotoğraf yüzünden PDF'in tamamı kaybolmasın */
    return null;
  }
}

export async function sepetPdfOlustur({
  rows,
  locale,
  t,
  brand,
  contact,
}: {
  rows: PdfSatir[];
  locale: Locale;
  t: Dictionary;
  brand: string;
  contact: { whatsapp: string; email: string; url: string };
}): Promise<Blob> {
  const [{ PDFDocument, rgb }, fontkitModulu, [serifBayt, sansBayt, sansKalinBayt]] =
    await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit"), yaziTipleriniGetir()]);

  const belge = await PDFDocument.create();
  belge.registerFontkit(fontkitModulu.default ?? fontkitModulu);
  const serif = await belge.embedFont(serifBayt, { subset: true });
  const sans = await belge.embedFont(sansBayt, { subset: true });
  const sansKalin = await belge.embedFont(sansKalinBayt, { subset: true });

  const SIYAH = rgb(0.09, 0.08, 0.07);
  const GRI = rgb(0.45, 0.43, 0.41);
  const ACIK = rgb(0.82, 0.80, 0.78);
  const COK_ACIK = rgb(0.94, 0.93, 0.92);

  /* Aynı modelin renkleri tek künye altında — sepet sayfasındaki düzen */
  const gruplar: Array<{ product: Product; satirlar: PdfSatir[] }> = [];
  for (const satir of rows) {
    const mevcut = gruplar.find((g) => g.product.slug === satir.product.slug);
    if (mevcut) mevcut.satirlar.push(satir);
    else gruplar.push({ product: satir.product, satirlar: [satir] });
  }

  /* Fotoğraflar önden ve paralel indiriliyor: tek tek beklemek 20 ürünlük
     bir sepette telefonu saniyelerce oyalıyordu. */
  const fotoAnahtari = (s: PdfSatir) => `${s.product.slug}|${s.item.color}`;
  const fotolar = new Map<string, Awaited<ReturnType<typeof fotoJpeg>>>();
  await Promise.all(
    rows.map(async (satir) => {
      const { product, item } = satir;
      const r = product.colors.find((c) => c.key === item.color) ?? product.colors[0];
      const ham = r?.images?.[0];
      const adres = ham ? resolveImageSource(ham, product.slug) : "";
      fotolar.set(fotoAnahtari(satir), adres ? await fotoJpeg(adres) : null);
    }),
  );

  const toplam = selectionTotal(
    rows.map(({ item, product }) => ({ price: product.price, qty: item.qty })),
  );

  const tarih = new Date().toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sayfalar: Array<ReturnType<typeof belge.addPage>> = [];
  let sayfa = belge.addPage([SAYFA_EN, SAYFA_BOY]);
  sayfalar.push(sayfa);
  let y = SAYFA_BOY - UST;

  const sagaYasli = (
    metin: string,
    font: typeof sans,
    boyut: number,
    sagKenar: number,
    yerY: number,
    ton = SIYAH,
  ) => {
    sayfa.drawText(metin, {
      x: sagKenar - font.widthOfTextAtSize(metin, boyut),
      y: yerY,
      size: boyut,
      font,
      color: ton,
    });
  };

  /* ── Belge başlığı — yalnızca ilk sayfada ── */
  sayfa.drawText(brand, { x: KENAR, y: y - 16, size: 19, font: serif, color: SIYAH });
  sayfa.drawText(t.selection.printTitle.toLocaleUpperCase(locale), {
    x: KENAR,
    y: y - 30,
    size: 7.5,
    font: sans,
    color: GRI,
  });
  const sag = SAYFA_EN - KENAR;
  sagaYasli(`${t.selection.printDate}: ${tarih}`, sans, 7.5, sag, y - 6, GRI);
  sagaYasli(contact.email, sans, 7.5, sag, y - 17, GRI);
  sagaYasli(`wa.me/${contact.whatsapp}`, sans, 7.5, sag, y - 28, GRI);

  y -= 42;
  sayfa.drawLine({
    start: { x: KENAR, y },
    end: { x: sag, y },
    thickness: 1.2,
    color: SIYAH,
  });
  y -= 14;
  sayfa.drawText(
    `${interpolate(t.selection.itemCount, { n: rows.length })} · ${interpolate(
      t.selection.modelCount,
      { n: gruplar.length },
    )}`,
    { x: KENAR, y, size: 7.5, font: sans, color: GRI },
  );
  y -= 32;

  const yeniSayfa = () => {
    sayfa = belge.addPage([SAYFA_EN, SAYFA_BOY]);
    sayfalar.push(sayfa);
    y = SAYFA_BOY - UST;
  };

  /** Model künyesi: kod etiketi + ad + sağda form · malzeme · ölçü */
  const kunyeCiz = (p: Product, devam: boolean) => {
    const kodBoyut = 8;
    const kodEn = sansKalin.widthOfTextAtSize(p.code, kodBoyut) + 14;
    const kodBoy = 15;
    sayfa.drawSvgPath(yuvarlakYol(kodEn, kodBoy, kodBoy / 2), {
      x: KENAR,
      y: y + kodBoy,
      borderColor: SIYAH,
      borderWidth: 0.7,
      color: undefined,
    });
    sayfa.drawText(p.code, {
      x: KENAR + 7,
      y: y + 4.5,
      size: kodBoyut,
      font: sansKalin,
      color: SIYAH,
    });

    const adX = KENAR + kodEn + 9;
    const kunye = `${t.forms[p.form]} · ${materialName(p.material)[locale]} · ${formatDimensions(
      p.dimensions,
      t.common.cm,
    )}`;
    const kunyeEn = sans.widthOfTextAtSize(kunye, 7.5);
    const adAlan = sag - adX - kunyeEn - 14;
    const ad = devam ? `${p.name[locale]} (${t.selection.continued})` : p.name[locale];
    sayfa.drawText(kirp(ad, serif, 11.5, Math.max(40, adAlan)), {
      x: adX,
      y: y + 3.5,
      size: 11.5,
      font: serif,
      color: SIYAH,
    });
    sagaYasli(kunye, sans, 7.5, sag, y + 4.5, GRI);

    y -= 8;
    sayfa.drawLine({
      start: { x: KENAR, y },
      end: { x: sag, y },
      thickness: 0.7,
      color: ACIK,
    });
    y -= SATIR_YUKSEK;
  };

  for (const [sira, { product, satirlar }] of gruplar.entries()) {
    if (sira > 0) y -= 8;
    /* Künye, en az bir rengiyle aynı sayfada kalsın */
    if (y - (24 + SATIR_YUKSEK) < ALT) yeniSayfa();
    kunyeCiz(product, false);

    for (const satir of satirlar) {
      const { item } = satir;
      if (y < ALT) {
        yeniSayfa();
        kunyeCiz(product, true);
      }

      const r =
        product.colors.find((c) => c.key === item.color) ?? product.colors[0];
      const ust = y + SATIR_YUKSEK - 5;

      /* Fotoğraf — yoksa rengin lekesi */
      const foto = fotolar.get(fotoAnahtari(satir));
      const kutuX = KENAR;
      const kutuY = ust - FOTO_BOY;
      if (foto) {
        const gomulu = await belge.embedJpg(foto.bytes);
        const olcek = Math.min(FOTO_EN / foto.en, FOTO_BOY / foto.boy);
        const en = foto.en * olcek;
        const boy = foto.boy * olcek;
        sayfa.drawImage(gomulu, {
          x: kutuX + (FOTO_EN - en) / 2,
          y: kutuY + (FOTO_BOY - boy) / 2,
          width: en,
          height: boy,
        });
      } else {
        sayfa.drawSvgPath(yuvarlakYol(FOTO_EN, FOTO_BOY, 4), {
          x: kutuX,
          y: ust,
          color: COK_ACIK,
          borderWidth: 0,
        });
        const rr = renk(r?.hex ?? "#8C7B6B");
        sayfa.drawCircle({
          x: kutuX + FOTO_EN / 2,
          y: kutuY + FOTO_BOY / 2,
          size: 7,
          color: rgb(rr.r, rr.g, rr.b),
        });
      }

      /* Renk */
      const metinY = ust - 22;
      const rr = renk(r?.hex ?? "#8C7B6B");
      sayfa.drawCircle({
        x: KENAR + FOTO_EN + 14,
        y: metinY + 3,
        size: 3.4,
        color: rgb(rr.r, rr.g, rr.b),
        borderColor: ACIK,
        borderWidth: 0.4,
      });
      sayfa.drawText(r?.name[locale] ?? "", {
        x: KENAR + FOTO_EN + 23,
        y: metinY,
        size: 9.5,
        font: sans,
        color: SIYAH,
      });

      const not = item.note?.trim();
      if (not) {
        sayfa.drawText(
          kirp(`${t.selection.note}: ${not}`, sans, 7.5, 250),
          { x: KENAR + FOTO_EN + 23, y: metinY - 11, size: 7.5, font: sans, color: GRI },
        );
      }

      /* Adet ve fiyat */
      const adetX = sag - 120;
      sayfa.drawText(t.selection.quantity.toLocaleUpperCase(locale), {
        x: adetX,
        y: metinY,
        size: 6.5,
        font: sans,
        color: GRI,
      });
      sayfa.drawText(String(item.qty), {
        x: adetX + sans.widthOfTextAtSize(t.selection.quantity.toLocaleUpperCase(locale), 6.5) + 4,
        y: metinY,
        size: 9.5,
        font: sans,
        color: SIYAH,
      });
      sagaYasli(
        typeof product.price === "number"
          ? formatPrice(product.price * item.qty, locale)
          : "—",
        sans,
        9.5,
        sag,
        metinY,
        SIYAH,
      );

      sayfa.drawLine({
        start: { x: KENAR, y: y - 6 },
        end: { x: sag, y: y - 6 },
        thickness: 0.5,
        color: COK_ACIK,
      });
      y -= SATIR_YUKSEK;
    }

    /* Ara toplam — tek renkte satırın fiyatının tekrarı olurdu */
    if (satirlar.length > 1) {
      const ara = selectionTotal(
        satirlar.map(({ item }) => ({ price: product.price, qty: item.qty })),
      );
      if (ara.priced > 0) {
        if (y < ALT) yeniSayfa();
        const metin = `${t.selection.subtotal}  ${formatPrice(ara.total, locale)}`;
        sagaYasli(metin, sans, 8, sag, y + SATIR_YUKSEK - 16, GRI);
        y -= 12;
      }
    }
  }

  /* ── Toplam ── */
  if (toplam.priced > 0) {
    if (y - 40 < ALT) yeniSayfa();
    const cizgiY = y + SATIR_YUKSEK - 30;
    sayfa.drawLine({
      start: { x: sag - 200, y: cizgiY },
      end: { x: sag, y: cizgiY },
      thickness: 0.8,
      color: SIYAH,
    });
    const tutar = formatPrice(toplam.total, locale);
    sagaYasli(tutar, serif, 14, sag, cizgiY - 20, SIYAH);
    sagaYasli(
      t.selection.total,
      sans,
      9,
      sag - serif.widthOfTextAtSize(tutar, 14) - 12,
      cizgiY - 18,
      GRI,
    );
    if (toplam.unpriced > 0) {
      sagaYasli(
        interpolate(t.selection.totalPartial, { n: toplam.unpriced }),
        sans,
        7,
        sag,
        cizgiY - 34,
        GRI,
      );
    }
  }

  /* ── Sayfa altları ── */
  sayfalar.forEach((s, i) => {
    s.drawText(contact.url, { x: KENAR, y: 26, size: 7, font: sans, color: GRI });
    const numara = `${i + 1} / ${sayfalar.length}`;
    s.drawText(numara, {
      x: sag - sans.widthOfTextAtSize(numara, 7),
      y: 26,
      size: 7,
      font: sans,
      color: GRI,
    });
  });

  const bayt = await belge.save();
  return new Blob([bayt as BlobPart], { type: "application/pdf" });
}

/** Dosya adı: YSMN-sepet-2026-09-17.pdf */
export function pdfDosyaAdi(brand: string, locale: Locale): string {
  const g = new Date();
  const iki = (n: number) => String(n).padStart(2, "0");
  const marka = brand.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "katalog";
  const etiket = locale === "tr" ? "sepet" : "cart";
  return `${marka}-${etiket}-${g.getFullYear()}-${iki(g.getMonth() + 1)}-${iki(g.getDate())}.pdf`;
}
