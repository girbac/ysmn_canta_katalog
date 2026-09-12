import { cx } from "@/lib/utils";

/**
 * Izgarayı bölen editoryal şerit.
 * Uzun katalogda monotonluğu kıran nefes aralığı.
 */
export function EditorialStrip({
  quote,
  caption,
  align = "left",
}: {
  quote: string;
  caption: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cx(
        "col-span-full my-10 border-y border-line py-14 md:my-16 md:py-20",
        align === "right" && "text-right",
      )}
    >
      <blockquote
        className={cx(
          "font-whisper text-[clamp(1.5rem,3.2vw,38px)] leading-[1.08] tracking-[-0.04em] text-ink",
          align === "right" ? "ml-auto" : "",
          "max-w-3xl",
        )}
      >
        {quote}
      </blockquote>
      <p className="mt-6 eyebrow text-ink-40">{caption}</p>
    </div>
  );
}
