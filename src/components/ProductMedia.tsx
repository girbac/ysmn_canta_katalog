import Image from "next/image";
import type { Locale, Product } from "@/data/types";
import { BagSilhouette } from "./BagSilhouette";

/**
 * ── Fotoğraf sınırı ──
 *
 * Katalogdaki TEK yer burası: gerçek ürün fotoğrafı mı, silüet placeholder mı.
 * Renk varyantının `images` dizisi doluysa next/image ile fotoğraf basılır,
 * boşsa forma göre çizilmiş silüet gösterilir.
 *
 * Fotoğraflar geldiğinde başka hiçbir bileşen değişmez.
 * Dosya yerleşimi: public/products/<slug>/<dosya-adi>
 */

export function ProductMedia({
  product,
  colorIndex = 0,
  locale,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  className = "",
}: {
  product: Product;
  colorIndex?: number;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const color = product.colors[colorIndex] ?? product.colors[0];
  const file = color?.images?.[0];
  const alt = `${product.name[locale]} — ${color?.name[locale] ?? ""}`.trim();

  return (
    <div
      className={`relative isolate aspect-square w-full overflow-hidden bg-ground-2 ${className}`}
      style={{ contain: "paint" }}
    >
      {file ? (
        <Image
          src={`/products/${product.slug}/${file}`}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <>
          <BagSilhouette
            form={product.form}
            hex={color?.hex ?? "#8A6A4F"}
            idSuffix={`${product.slug}-${colorIndex}`}
            className="absolute inset-0 h-full w-full"
          />
          <span className="sr-only">{alt}</span>
        </>
      )}
    </div>
  );
}
