import type { Locale, Product } from "@/data/types";
import { bagGeometry } from "./BagSilhouette";
import { formatDimensions } from "@/lib/utils";

/**
 * "Bu çanta ne kadar büyük?"
 *
 * Katalogların en büyük eksiği bu: ölçüler veride cm cinsinden duruyor ama
 * 15 × 23 cm'in ne demek olduğu gözde canlanmıyor. Burada çantanın kendi
 * silüeti, herkesin boyutunu bildiği iki nesnenin yanına aynı ölçekte
 * konuyor — A4 kâğıt ve bir telefon.
 *
 * Çizim, karttaki silüetin ta kendisi; farkı, kadraja sığdırılmak yerine
 * ürünün gerçek en ve boyuna oturtulması. Yani ekranda gördüğünüz oran
 * çantanın gerçek oranı, yanındaki A4 de gerçek A4.
 *
 * Burada eskiden bir çöp adam vardı: ölçeği gerçekten anlatmıyordu ve
 * özenli duran bir sayfada göze batıyordu.
 */

const A4 = { w: 21, h: 29.7 };
const PHONE = { w: 7.1, h: 14.7 };

/* Birim santimetre; SVG'nin viewBox'ı da öyle. */
const ARA = 9; // nesneler arası
const OLCU_YERI = 9.5; // yükseklik ölçü çizgisinin ve sayısının solda kapladığı yer
const ALT = 7; // en ölçüsü + nefes

export function ScaleCompare({
  product,
  locale,
  hex,
  labels,
}: {
  product: Product;
  locale: Locale;
  /** Seçili varyantın rengi — çizim sayfadaki çantayla aynı renkte olsun */
  hex: string;
  labels: { title: string; lead: string; a4: string; phone: string; cm: string };
}) {
  const bag = product.dimensions;
  const sayi = (n: number) => n.toLocaleString(locale === "tr" ? "tr-TR" : "en-GB");

  /* ── Silüeti gerçek ölçüye oturt ──
     Gövde kutusu ürünün en × boyuna eşitleniyor; sap ve askılar bu kutunun
     dışında kaldıkları için doğal olarak gövdenin üstünde kalıyorlar. */
  const g = bagGeometry(product.form);
  const [gx1, gy1, gx2, gy2] = g.bodyBox;
  const [tx1, ty1, tx2] = g.box;
  const sx = bag.w / (gx2 - gx1);
  const sy = bag.h / (gy2 - gy1);

  const solTasma = (gx1 - tx1) * sx;
  const sagTasma = (tx2 - gx2) * sx;
  const ustTasma = (gy1 - ty1) * sy; // saplar

  const SOL = OLCU_YERI + solTasma;

  const enYuksek = Math.max(bag.h, A4.h);
  /* Üstte yalnızca sapların taştığı kadar yer açılıyor. Çanta kısaysa
     saplar zaten A4'ün tepesinin altında kalıyor; sabit bir boşluk
     bırakmak çizimin üstünde kocaman bir delik oluşturuyordu. */
  const UST = Math.max(2, ustTasma - (enYuksek - bag.h) + 2);

  const cantaX = SOL;
  const a4X = cantaX + bag.w + sagTasma + ARA;
  const telX = a4X + A4.w + ARA;
  const toplamEn = telX + PHONE.w + 2;

  const toplamBoy = UST + enYuksek + ALT;
  const taban = UST + enYuksek;
  const cantaUst = taban - bag.h;

  /* Yazılar SVG'nin içinde değil üstünde: viewBox ölçeklendikçe SVG metni
     telefonda okunmayacak kadar küçülüyor, masaüstünde şişiyordu. */
  const yatay = (cm: number) => `${(cm / toplamEn) * 100}%`;
  const dikey = (cm: number) => `${(cm / toplamBoy) * 100}%`;

  const silue = `translate(${cantaX} ${cantaUst}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-gx1} ${-gy1})`;

  return (
    <section className="border-t border-line pt-8">
      <h2 className="eyebrow text-ink-40">{labels.title}</h2>
      <p className="mt-2 text-body text-ink-60">{labels.lead}</p>

      <figure className="mt-8">
        <div className="relative w-full max-w-[560px]">
          <svg
            viewBox={`0 0 ${toplamEn} ${toplamBoy}`}
            className="block h-auto w-full overflow-visible"
            role="img"
            aria-label={`${product.code}: ${formatDimensions(bag, labels.cm)} — ${labels.a4} ve ${labels.phone} ile aynı ölçekte`}
          >
            <defs>
              {/* Karttaki silüetle aynı yumuşak ışık */}
              <linearGradient id={`olcek-${product.slug}`} x1="0" y1="0" x2="0.15" y2="1">
                <stop offset="0%" stopColor={hex} stopOpacity="1" />
                <stop offset="100%" stopColor={hex} stopOpacity="0.74" />
              </linearGradient>
            </defs>

            {/* Zemin */}
            <line
              x1="0"
              y1={taban}
              x2={toplamEn}
              y2={taban}
              stroke="var(--ink)"
              strokeOpacity="0.18"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />

            {/* ── Referanslar: düz, kesik çizgili, geride ── */}
            <rect
              x={a4X}
              y={taban - A4.h}
              width={A4.w}
              height={A4.h}
              fill="var(--ink)"
              fillOpacity="0.03"
              stroke="var(--ink)"
              strokeOpacity="0.3"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={telX}
              y={taban - PHONE.h}
              width={PHONE.w}
              height={PHONE.h}
              rx="1"
              fill="var(--ink)"
              fillOpacity="0.03"
              stroke="var(--ink)"
              strokeOpacity="0.3"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />

            {/* Yere düşen gölge — çizimi zemine oturtuyor */}
            <ellipse
              cx={cantaX + bag.w / 2}
              cy={taban + 0.7}
              rx={bag.w / 2.1}
              ry="0.6"
              fill="var(--ink)"
              opacity="0.1"
            />

            {/* ── Çanta silüeti, gerçek ölçekte ── */}
            <g
              transform={silue}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.5"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {g.behind?.map((d, i) => (
                <path key={`b${i}`} d={d} strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={g.body} fill={`url(#olcek-${product.slug})`} vectorEffect="non-scaling-stroke" />
              {g.panels?.map((d, i) => (
                <path
                  key={`p${i}`}
                  d={d}
                  fill="var(--ink)"
                  fillOpacity="0.07"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {g.details.map((d, i) => (
                <path key={`d${i}`} d={d} vectorEffect="non-scaling-stroke" />
              ))}
            </g>

            {/* ── Ölçü çizgileri: gövdenin eni ve boyu ── */}
            <g stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="1">
              <line x1={cantaX - 3.4} y1={cantaUst} x2={cantaX - 3.4} y2={taban} vectorEffect="non-scaling-stroke" />
              <line x1={cantaX - 4.6} y1={cantaUst} x2={cantaX - 2.2} y2={cantaUst} vectorEffect="non-scaling-stroke" />
              <line x1={cantaX - 4.6} y1={taban} x2={cantaX - 2.2} y2={taban} vectorEffect="non-scaling-stroke" />
              <line x1={cantaX} y1={taban + 3} x2={cantaX + bag.w} y2={taban + 3} vectorEffect="non-scaling-stroke" />
              <line x1={cantaX} y1={taban + 1.8} x2={cantaX} y2={taban + 4.2} vectorEffect="non-scaling-stroke" />
              <line x1={cantaX + bag.w} y1={taban + 1.8} x2={cantaX + bag.w} y2={taban + 4.2} vectorEffect="non-scaling-stroke" />
            </g>
          </svg>

          {/* Ölçü sayıları — gerçek metin, SVG içinde değil */}
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[11px] leading-none text-ink-60 tabular-nums"
            style={{ left: yatay(cantaX - 6.6), top: dikey(cantaUst + bag.h / 2) }}
          >
            {sayi(bag.h)}
          </span>
          <span
            className="pointer-events-none absolute -translate-x-1/2 text-[11px] leading-none text-ink-60 tabular-nums"
            style={{ left: yatay(cantaX + bag.w / 2), top: dikey(taban + 4.6) }}
          >
            {sayi(bag.w)}
          </span>
        </div>

        {/* Künyeler — nesnelerin altında, hizalı */}
        <figcaption className="relative mt-3 h-10 w-full max-w-[560px] text-caption">
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-center"
            style={{ left: yatay(cantaX + bag.w / 2) }}
          >
            <span className="block font-medium text-ink tabular-nums">{product.code}</span>
            {/* Sıra sitenin geri kalanıyla aynı: yükseklik × en × derinlik */}
            <span className="mt-0.5 block text-ink-60 tabular-nums">
              {formatDimensions(bag, labels.cm)}
            </span>
          </span>
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-center text-ink-40"
            style={{ left: yatay(a4X + A4.w / 2) }}
          >
            <span className="block">{labels.a4}</span>
            <span className="mt-0.5 block tabular-nums">
              {sayi(A4.w)} × {sayi(A4.h)}
            </span>
          </span>
          {/* Sonuncusu sağa yaslı: telefon zaten en sağda, ortalanınca
              künyesi dar ekranda kadrajın dışına taşıyordu. */}
          <span className="absolute right-0 top-0 whitespace-nowrap text-right text-ink-40">
            <span className="block">{labels.phone}</span>
            <span className="mt-0.5 block tabular-nums">
              {sayi(PHONE.w)} × {sayi(PHONE.h)}
            </span>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
