import type { Product } from "@/data/types";

/**
 * "Bu çanta ne kadar büyük?"
 *
 * Katalogların en büyük eksiği bu. Ürünün ölçüleri cm cinsinden veride
 * duruyor; burada onu bildiğimiz şeylerle yan yana koyuyoruz:
 * 170 cm'lik bir insan, A4 kâğıt ve bir telefon. Hepsi aynı ölçekte.
 */

const A4 = { w: 21, h: 29.7 };
const PHONE = { w: 7.1, h: 14.7 };
const PERSON_H = 170;

export function ScaleCompare({
  product,
  labels,
}: {
  product: Product;
  labels: { title: string; lead: string; a4: string; phone: string; person: string; cm: string };
}) {
  const bag = product.dimensions;

  // ── Panel B: ortak taban çizgisine oturan nesneler ──
  const tallest = Math.max(bag.h, A4.h, PHONE.h);
  const totalW = bag.w + A4.w + PHONE.w + 24; // 24 = aralar
  const px = (v: number) => v; // 1 birim = 1 cm; ölçek viewBox'a bırakıldı

  let cursor = 0;
  const objects = [
    { w: bag.w, h: bag.h, label: `${bag.w} × ${bag.h}`, strong: true },
    { w: A4.w, h: A4.h, label: labels.a4, strong: false },
    { w: PHONE.w, h: PHONE.h, label: labels.phone, strong: false },
  ].map((o) => {
    const x = cursor;
    cursor += o.w + 12;
    return { ...o, x };
  });

  return (
    <section className="border-t border-line pt-8">
      <h2 className="eyebrow text-ink-40">{labels.title}</h2>
      <p className="mt-2 text-body text-ink-60">{labels.lead}</p>

      <div className="mt-8 grid gap-10 sm:grid-cols-[auto_1fr] sm:gap-12">
        {/* ── İnsan ölçeği ── */}
        <figure className="flex flex-col items-center">
          <svg
            viewBox={`0 0 96 ${PERSON_H + 12}`}
            className="h-56 w-auto"
            role="img"
            aria-label={`${labels.person} · ${bag.w} × ${bag.h} ${labels.cm}`}
          >
            <g
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.45"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            >
              {/* Baş */}
              <circle cx="34" cy="12" r="9" />
              {/* Gövde */}
              <path d="M34 21 v10 M20 36 h28 M22 36 l-2 34 h28 l-2-34" />
              {/* Omuz–kol */}
              <path d="M20 36 l-5 36 M48 36 l5 36" />
              {/* Bacaklar */}
              <path d={`M25 70 L23 ${PERSON_H}`} />
              <path d={`M43 70 L45 ${PERSON_H}`} />
              {/* Zemin */}
              <path d={`M6 ${PERSON_H} H70`} strokeOpacity="0.2" />
            </g>

            {/* Çanta — omuzdan askılı, gerçek ölçekte */}
            <g>
              <path
                d={`M50 42 L${56 + bag.w / 2} ${86 - bag.h / 2}`}
                fill="none"
                stroke="var(--ink)"
                strokeOpacity="0.55"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={56}
                y={86 - bag.h / 2}
                width={bag.w}
                height={bag.h}
                rx="2"
                fill="var(--ink)"
                fillOpacity="0.22"
                stroke="var(--ink)"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
              />
            </g>

            {/* Boy ölçüsü */}
            <g stroke="var(--ink)" strokeOpacity="0.2" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <path d={`M2 2 V${PERSON_H}`} />
              <path d="M-1 2 H5" />
              <path d={`M-1 ${PERSON_H} H5`} />
            </g>
          </svg>
          <figcaption className="mt-3 text-caption text-ink-40">
            {labels.person}
          </figcaption>
        </figure>

        {/* ── Nesne ölçeği ── */}
        <figure className="min-w-0">
          <svg
            viewBox={`0 0 ${totalW} ${tallest + 4}`}
            className="h-44 w-full"
            preserveAspectRatio="xMinYMax meet"
            role="img"
            aria-label={`${bag.w} × ${bag.h} ${labels.cm} — ${labels.a4}, ${labels.phone}`}
          >
            {objects.map((o, i) => (
              <g key={i}>
                <rect
                  x={px(o.x)}
                  y={tallest - o.h}
                  width={px(o.w)}
                  height={o.h}
                  rx="1"
                  fill={o.strong ? "var(--accent)" : "var(--ink)"}
                  fillOpacity={o.strong ? 0.22 : 0.05}
                  stroke={o.strong ? "var(--accent)" : "var(--ink)"}
                  strokeOpacity={o.strong ? 1 : 0.3}
                  strokeWidth="1.4"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
            {/* Ortak taban çizgisi */}
            <path
              d={`M0 ${tallest} H${totalW}`}
              stroke="var(--ink)"
              strokeOpacity="0.2"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-caption">
            <span className="text-ink">
              {product.code} · {bag.w} × {bag.h} {labels.cm}
            </span>
            <span className="text-ink-40">
              {labels.a4} · {A4.w} × {A4.h} {labels.cm}
            </span>
            <span className="text-ink-40">
              {labels.phone} · {PHONE.w} × {PHONE.h} {labels.cm}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
