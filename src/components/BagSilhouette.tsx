import type { Form } from "@/data/types";

/**
 * Forma göre çizgisel çanta silüeti.
 *
 * Gerçek ürün fotoğrafı gelene kadar katalogun görsel dilini bu taşıyor.
 * Gövde varyantın kendi rengiyle dolduruluyor (renk kimliği okunsun),
 * kontur ise her zaman `--ink` — yani zeminin zıddı. Böylece hem krem
 * çanta açık zeminde, hem siyah çanta koyu zeminde net görünüyor.
 */

type Geometry = {
  /** Gövde — renkle dolar */
  body: string;
  /** Yalnızca kontur çizilen detaylar (sap, askı, dikiş, toka) */
  details: string[];
  /** Gövdeden daha açık/koyu ikinci parça (kapak, cep) */
  panels?: string[];
};

const GEOMETRY: Record<Form, Geometry> = {
  tote: {
    body: "M108 150 L292 150 L275 334 L125 334 Z",
    details: [
      "M152 150 C152 96 188 96 188 150",
      "M212 150 C212 96 248 96 248 150",
      "M108 150 L292 150",
      "M118 236 L282 236",
    ],
  },
  omuz: {
    body: "M120 176 H280 A14 14 0 0 1 294 190 V300 A14 14 0 0 1 280 314 H120 A14 14 0 0 1 106 300 V190 A14 14 0 0 1 120 176 Z",
    panels: ["M106 190 A14 14 0 0 1 120 176 H280 A14 14 0 0 1 294 190 V222 C240 250 160 250 106 222 Z"],
    details: [
      "M126 180 C126 78 274 78 274 180",
      "M190 236 H210 A6 6 0 0 1 216 242 V252 A6 6 0 0 1 210 258 H190 A6 6 0 0 1 184 252 V242 A6 6 0 0 1 190 236 Z",
    ],
  },
  baguette: {
    body: "M140 182 H260 A46 46 0 0 1 260 274 H140 A46 46 0 0 1 140 182 Z",
    details: [
      "M156 184 C156 142 244 142 244 184",
      "M112 206 H288",
      "M196 206 V182",
    ],
  },
  clutch: {
    body: "M104 186 H296 A8 8 0 0 1 304 194 V292 A8 8 0 0 1 296 300 H104 A8 8 0 0 1 96 292 V194 A8 8 0 0 1 104 186 Z",
    panels: ["M96 194 A8 8 0 0 1 104 186 H296 A8 8 0 0 1 304 194 V200 L200 268 L96 200 Z"],
    details: [
      "M200 268 v12",
      "M186 272 h28",
    ],
  },
  sirt: {
    body: "M130 158 H270 A26 26 0 0 1 296 184 V314 A26 26 0 0 1 270 340 H130 A26 26 0 0 1 104 314 V184 A26 26 0 0 1 130 158 Z",
    panels: ["M150 252 H250 A12 12 0 0 1 262 264 V316 H138 V264 A12 12 0 0 1 150 252 Z"],
    details: [
      "M182 160 C182 132 218 132 218 160",
      "M104 206 H296",
      "M126 176 C92 216 92 288 122 328",
      "M274 176 C308 216 308 288 278 328",
    ],
  },
  evrak: {
    body: "M96 180 H304 A10 10 0 0 1 314 190 V310 A10 10 0 0 1 304 320 H96 A10 10 0 0 1 86 310 V190 A10 10 0 0 1 96 180 Z",
    details: [
      "M172 182 C172 142 228 142 228 182",
      "M86 214 H314",
      "M128 198 h26 v16 h-26 z",
      "M246 198 h26 v16 h-26 z",
      "M86 296 H314",
    ],
  },
  postaci: {
    body: "M116 190 H284 A10 10 0 0 1 294 200 V304 A10 10 0 0 1 284 314 H116 A10 10 0 0 1 106 304 V200 A10 10 0 0 1 116 190 Z",
    panels: ["M106 200 A10 10 0 0 1 116 190 H284 A10 10 0 0 1 294 200 V250 C236 274 164 274 106 250 Z"],
    details: [
      "M124 194 C106 100 294 100 276 194",
      "M186 258 h28 v18 h-28 z",
      "M148 262 h16",
      "M236 262 h16",
    ],
  },
};

export function BagSilhouette({
  form,
  hex,
  className,
  idSuffix,
}: {
  form: Form;
  hex: string;
  className?: string;
  /** defs id çakışmasını önlemek için — aynı sayfada onlarca kart var */
  idSuffix: string;
}) {
  const g = GEOMETRY[form];
  const lightId = `light-${idSuffix}`;
  const bodyId = `body-${idSuffix}`;
  const shadowId = `shadow-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={lightId} cx="50%" cy="28%" r="72%">
          <stop offset="0%" stopColor="var(--ink)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.07" />
        </radialGradient>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hex} stopOpacity="0.95" />
          <stop offset="100%" stopColor={hex} stopOpacity="0.72" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-60%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Stüdyo zemini */}
      <rect width="400" height="400" fill={`url(#${lightId})`} />

      {/* Yere düşen yumuşak gölge */}
      <ellipse
        cx="200"
        cy="352"
        rx="96"
        ry="11"
        fill="var(--ink)"
        opacity="0.16"
        filter={`url(#${shadowId})`}
      />

      <g
        fill="none"
        stroke="var(--ink)"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d={g.body} fill={`url(#${bodyId})`} />
        {g.panels?.map((d, i) => (
          <path key={`p${i}`} d={d} fill="var(--ink)" fillOpacity="0.08" />
        ))}
        {g.details.map((d, i) => (
          <path key={`d${i}`} d={d} />
        ))}
      </g>
    </svg>
  );
}
