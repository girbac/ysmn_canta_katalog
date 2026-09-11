"use client";

import { useSelection, useHydrated } from "@/store/selection";
import { cx } from "@/lib/utils";

/**
 * Karta ve ürün detayına eklenen "+" düğmesi.
 * Hidrasyon bitene kadar boş durumu gösterir ki sunucu/istemci uyuşsun.
 */
export function SelectionButton({
  slug,
  color,
  labels,
  variant = "icon",
  className,
}: {
  slug: string;
  color?: string;
  labels: { add: string; added: string; remove: string };
  variant?: "icon" | "full";
  className?: string;
}) {
  const hydrated = useHydrated();
  const toggle = useSelection((s) => s.toggle);
  const selected = useSelection((s) => s.items.some((i) => i.slug === slug));
  const on = hydrated && selected;

  const label = on ? labels.remove : labels.add;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(slug, color)}
        aria-pressed={on}
        className={cx(
          "inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm tracking-wide uppercase transition-colors duration-300",
          on
            ? "border-accent bg-accent text-ground"
            : "border-line-strong text-ink hover:bg-ink hover:text-ground",
          className,
        )}
      >
        <Glyph on={on} />
        {on ? labels.added : labels.add}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug, color);
      }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={cx(
        "grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm transition-all duration-300",
        on
          ? "border-accent bg-accent text-ground"
          : "border-line-strong bg-ground/70 text-ink hover:bg-ink hover:text-ground",
        className,
      )}
    >
      <Glyph on={on} />
    </button>
  );
}

function Glyph({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {on ? (
        <path
          d="M2.5 7.5 5.5 10.5 11.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}
