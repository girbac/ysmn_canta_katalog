import type { Form } from "@/data/types";

/**
 * Forma göre çizgisel çanta silüeti.
 *
 * Gerçek ürün fotoğrafı gelene kadar katalogun görsel dilini bu taşıyor.
 * Gövde varyantın kendi rengiyle dolduruluyor (renk kimliği okunsun),
 * kontur ise her zaman `--ink` — yani zeminin zıddı. Böylece hem krem
 * çanta açık zeminde, hem siyah çanta koyu zeminde net görünüyor.
 *
 * Her formun kendi çizim ölçüsü var; `box` ile verilen sınırlayıcı kutu
 * 400×400 tuvale ortalanıp aynı görsel ağırlığa ölçekleniyor. Böylece
 * clutch ile sırt çantası yan yana geldiğinde ikisi de kadrajı doluyor.
 */

type Geometry = {
  /** Gövde — renkle dolar */
  body: string;
  /** Gövdenin üstüne binen ikinci parça (kapak, ön cep) */
  panels?: string[];
  /** Yalnızca kontur çizilen detaylar (sap, askı, dikiş, toka) */
  details: string[];
  /** Gövdenin ARKASINDA kalan parçalar (sırt askıları) — soluk çizilir */
  behind?: string[];
  /** Çizimin sınırlayıcı kutusu: [x1, y1, x2, y2] */
  box: [number, number, number, number];
  /**
   * Yalnızca gövdenin kutusu — sap ve askılar hariç.
   *
   * Ölçek karşılaştırması (ScaleCompare) çizimi ürünün gerçek en/boyuna
   * oturtuyor; ölçüler çantanın gövdesine ait, sapına değil. `box` bunun
   * için kullanılamaz, o sapları da içeriyor.
   */
  bodyBox: [number, number, number, number];
};

const GEOMETRY: Record<Form, Geometry> = {
  tote: {
    body: "M104 152 L296 152 L278 336 L122 336 Z",
    details: [
      "M148 152 C148 90 190 90 190 152",
      "M210 152 C210 90 252 90 252 152",
      "M104 152 H296",
      "M114 240 H286",
    ],
    box: [104, 90, 296, 336],
    bodyBox: [104, 152, 296, 336],
  },

  omuz: {
    body:
      "M134 182 H266 A14 14 0 0 1 280 196 V294 A14 14 0 0 1 266 308 H134 " +
      "A14 14 0 0 1 120 294 V196 A14 14 0 0 1 134 182 Z",
    panels: [
      "M120 196 A14 14 0 0 1 134 182 H266 A14 14 0 0 1 280 196 V226 " +
        "C240 252 160 252 120 226 Z",
    ],
    details: [
      "M128 188 C116 96 284 96 272 188",
      "M190 238 h20 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-20 a6 6 0 0 1 -6 -6 v-10 a6 6 0 0 1 6 -6 z",
    ],
    box: [116, 96, 286, 308],
    bodyBox: [120, 182, 280, 308],
  },

  baguette: {
    body: "M140 182 H260 A46 46 0 0 1 260 274 H140 A46 46 0 0 1 140 182 Z",
    details: ["M158 184 C158 140 242 140 242 184", "M112 206 H288", "M196 206 V182"],
    box: [94, 140, 306, 274],
    bodyBox: [94, 182, 306, 274],
  },

  clutch: {
    body:
      "M104 186 H296 A8 8 0 0 1 304 194 V292 A8 8 0 0 1 296 300 H104 " +
      "A8 8 0 0 1 96 292 V194 A8 8 0 0 1 104 186 Z",
    panels: [
      "M96 194 A8 8 0 0 1 104 186 H296 A8 8 0 0 1 304 194 V202 L200 270 L96 202 Z",
    ],
    details: ["M200 270 v12", "M186 274 h28"],
    box: [96, 186, 304, 300],
    bodyBox: [96, 186, 304, 300],
  },

  sirt: {
    body:
      "M130 158 H270 A26 26 0 0 1 296 184 V314 A26 26 0 0 1 270 340 H130 " +
      "A26 26 0 0 1 104 314 V184 A26 26 0 0 1 130 158 Z",
    panels: ["M150 252 H250 A12 12 0 0 1 262 264 V316 H138 V264 A12 12 0 0 1 150 252 Z"],
    behind: ["M126 176 C92 216 92 288 122 328", "M274 176 C308 216 308 288 278 328"],
    details: ["M182 160 C182 132 218 132 218 160", "M104 206 H296"],
    box: [92, 132, 308, 340],
    bodyBox: [104, 158, 296, 340],
  },

  evrak: {
    body:
      "M96 180 H304 A10 10 0 0 1 314 190 V310 A10 10 0 0 1 304 320 H96 " +
      "A10 10 0 0 1 86 310 V190 A10 10 0 0 1 96 180 Z",
    details: [
      "M172 182 C172 142 228 142 228 182",
      "M86 214 H314",
      "M128 198 h26 v16 h-26 z",
      "M246 198 h26 v16 h-26 z",
      "M86 296 H314",
    ],
    box: [86, 142, 314, 320],
    bodyBox: [86, 180, 314, 320],
  },

  /**
   * Seyahat çantası (duffel). Anahtar hâlâ `postaci`: katalogdaki ürünler
   * bu değeri kayıtlı tutuyor, değiştirmek onları bozardı. Değişen yalnızca
   * çizim ve arayüzdeki ad.
   */
  postaci: {
    // Yatık hap biçimi: iki ucu yuvarlak, yumuşak gövde
    body: "M134 206 H266 A48 48 0 0 1 266 302 H134 A48 48 0 0 1 134 206 Z",
    panels: [
      // Fermuarın üstünde kalan yarım — hacmi o anlatıyor
      "M86 254 A48 48 0 0 1 134 206 H266 A48 48 0 0 1 314 254 Z",
    ],
    details: [
      // Boydan boya fermuar
      "M86 254 H314",
      // İki sap, tepede birleşiyor
      "M158 210 C158 148 242 148 242 210",
      "M192 158 h16 v14 h-16 z",
      // Yuvarlak uç kapağının dikişi
      "M126 214 C114 236 114 272 126 294",
      "M274 214 C286 236 286 272 274 294",
    ],
    box: [86, 148, 314, 302],
    bodyBox: [86, 206, 314, 302],
  },
};

/** Çizimin kadrajda kaplayacağı hedef genişlik/yükseklik */
const TARGET = 306;
const CENTER_X = 200;
const CENTER_Y = 190;

function fit(box: [number, number, number, number]) {
  const [x1, y1, x2, y2] = box;
  const w = x2 - x1;
  const h = y2 - y1;
  const scale = TARGET / Math.max(w, h);
  const cx = x1 + w / 2;
  const cy = y1 + h / 2;
  return {
    transform: `translate(${CENTER_X} ${CENTER_Y}) scale(${scale.toFixed(4)}) translate(${-cx} ${-cy})`,
    /** Ölçeklenmiş çizimin taban çizgisi ve genişliği — gölge buna oturur */
    baseline: CENTER_Y + (y2 - cy) * scale,
    halfWidth: (w * scale) / 2,
  };
}

/** Forma ait çizim geometrisi — ölçek karşılaştırması da bunu kullanıyor */
export function bagGeometry(form: Form): Geometry {
  return GEOMETRY[form];
}

export function BagSilhouette({
  form,
  hex,
  className,
  idSuffix,
  backdrop = true,
}: {
  form: Form;
  hex: string;
  className?: string;
  /** defs id çakışmasını önlemek için — aynı sayfada onlarca kart var */
  idSuffix: string;
  /** Stüdyo zemini. Kendi kutusu olmayan yerlerde (hero) kapatılır. */
  backdrop?: boolean;
}) {
  const g = GEOMETRY[form];
  const { transform, baseline, halfWidth } = fit(g.box);
  const lightId = `lt-${idSuffix}`;
  const bodyId = `bd-${idSuffix}`;
  const blurId = `bl-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={lightId} cx="50%" cy="26%" r="74%">
          <stop offset="0%" stopColor="var(--ink)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.08" />
        </radialGradient>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor={hex} stopOpacity="1" />
          <stop offset="100%" stopColor={hex} stopOpacity="0.74" />
        </linearGradient>
        <filter id={blurId} x="-50%" y="-400%" width="200%" height="900%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Stüdyo zemini */}
      {backdrop && <rect width="400" height="400" fill={`url(#${lightId})`} />}

      {/* Yere düşen yumuşak gölge */}
      <ellipse
        cx={CENTER_X}
        cy={baseline + 14}
        rx={halfWidth * 0.86}
        ry="6"
        fill="var(--ink)"
        opacity="0.13"
        filter={`url(#${blurId})`}
      />

      <g
        transform={transform}
        fill="none"
        stroke="var(--ink)"
        strokeOpacity="0.46"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {g.behind?.map((d, i) => (
          <path key={`b${i}`} d={d} strokeOpacity="0.24" />
        ))}
        <path d={g.body} fill={`url(#${bodyId})`} />
        {g.panels?.map((d, i) => (
          <path key={`p${i}`} d={d} fill="var(--ink)" fillOpacity="0.07" />
        ))}
        {g.details.map((d, i) => (
          <path key={`d${i}`} d={d} />
        ))}
      </g>
    </svg>
  );
}
