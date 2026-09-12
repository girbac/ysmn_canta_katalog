"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { Product } from "@/data/types";
import { resolveImageSource } from "@/lib/catalog/image-source";
import { removeImageAction, uploadImageAction } from "../actions";

/**
 * Renk varyantı başına fotoğraf yönetimi.
 *
 * Ürün kaydından ayrı bir akış: yükleme ve silme anında depoya yazıyor,
 * çünkü dosya yüklemeyi form kaydına bağlamak hem yavaş hem kırılgan olur.
 * Dosya adı sunucuda üretiliyor (renk + zaman damgası) — kullanıcıdan
 * gelen ad hiç kullanılmıyor.
 */
export function ImageManager({ product }: { product: Product }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="eyebrow text-ink-40">Fotoğraflar</p>
      <p className="mt-2 max-w-xl text-caption text-ink-60">
        Her renk için ayrı fotoğraf yükleyin. İlk fotoğraf kartlarda ve listede
        görünen kapak görselidir; fotoğraf olmayan renkler forma göre çizilmiş
        silüetle gösterilir. Kare (1:1), webp/avif tercih edilir, en fazla 6 MB.
      </p>

      <div className="mt-6 space-y-6">
        {product.colors.map((color) => (
          <div key={color.key} className="rounded-card border border-line p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-line"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-body text-ink">{color.name.tr}</span>
              <span className="text-caption text-ink-40">
                {color.images.length} fotoğraf
              </span>
            </div>

            {color.images.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {color.images.map((source, i) => (
                  <li key={source} className="w-[104px]">
                    <div className="relative aspect-square overflow-hidden rounded-tile bg-ground-2">
                      <Image
                        src={resolveImageSource(source, product.slug)}
                        alt={`${product.name.tr} — ${color.name.tr} ${i + 1}`}
                        fill
                        sizes="104px"
                        className="object-cover"
                      />
                    </div>
                    <form action={removeImageAction} className="mt-1.5">
                      <input type="hidden" name="slug" value={product.slug} />
                      <input type="hidden" name="renk" value={color.key} />
                      <input type="hidden" name="kaynak" value={source} />
                      <button
                        type="submit"
                        className="text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
                      >
                        {i === 0 ? "Kapağı sil" : "Sil"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <Uploader slug={product.slug} colorKey={color.key} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Uploader({ slug, colorKey }: { slug: string; colorKey: string }) {
  const [state, action, pending] = useActionState<{ error?: string } | null, FormData>(
    uploadImageAction,
    null,
  );

  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="renk" value={colorKey} />
      <input
        type="file"
        name="dosya"
        accept="image/webp,image/avif,image/jpeg,image/png"
        required
        className="text-caption text-ink-60 file:mr-3 file:rounded-card file:border file:border-line-strong file:bg-ground-2 file:px-4 file:py-2 file:text-caption file:text-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-card border border-line-strong bg-ground-2 px-4 py-2 text-caption font-medium text-ink disabled:opacity-50"
      >
        {pending ? "Yükleniyor…" : "Yükle"}
      </button>
      {state?.error && (
        <span role="alert" className="text-caption text-ink">
          {state.error}
        </span>
      )}
    </form>
  );
}
