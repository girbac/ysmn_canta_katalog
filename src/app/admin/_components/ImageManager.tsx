"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { Product } from "@/data/types";
import { colorHex, colorName, type ColorKey } from "@/data/colors";
import { resolveImageSource } from "@/lib/catalog/image-source";
import { makeCoverAction, removeImageAction, uploadImageAction } from "../actions";

/**
 * Renk varyantı başına fotoğraf yönetimi.
 *
 * Ürün kaydından ayrı bir akış: yükleme ve silme anında depoya yazıyor,
 * çünkü dosya yüklemeyi form kaydına bağlamak hem yavaş hem kırılgan olur.
 * Dosya adı sunucuda üretiliyor (renk + zaman damgası) — kullanıcıdan
 * gelen ad hiç kullanılmıyor.
 *
 * Gösterilen renkler formdaki CANLI seçimden geliyor (bkz. ProductEditor),
 * kayıtlı üründen değil. Ama yükleme yapabilmek için rengin sunucuda da
 * kayıtlı olması şart: addImage, ürünü ve rengi depodan arıyor. Bu yüzden
 * her renk üç durumdan birinde olabilir ve hangisinde olduğu yazıyor.
 */
export function ImageManager({
  product,
  selected,
}: {
  /** Yeni üründe henüz kayıt yok */
  product?: Product;
  /** Formda o an işaretli renkler, palet sırasında */
  selected: ColorKey[];
}) {
  const saved = new Map((product?.colors ?? []).map((c) => [c.key, c]));

  // İşareti kaldırılmış ama kayıtta fotoğrafı olan renkler: kaydedilirse
  // o fotoğraflar katalogdan düşecek. Sessizce olmasın.
  const droppedWithPhotos = (product?.colors ?? []).filter(
    (c) => !selected.includes(c.key as ColorKey) && c.images.length > 0,
  );

  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="eyebrow text-ink-40">Fotoğraflar</p>
      <p className="mt-2 max-w-xl text-caption text-ink-60">
        Her renk için ayrı fotoğraf yükleyin. İlk fotoğraf kartlarda ve listede
        görünen kapak görselidir; fotoğraf olmayan renkler forma göre çizilmiş
        silüetle gösterilir. Bir renge birden fazla fotoğraf seçebilirsiniz; ilki kapak olur, dilediğinizi “Kapak yap” ile öne alabilirsiniz. Dikey (3:4) çekim, webp/avif tercih edilir, dosya başına en fazla 6 MB.
      </p>

      {selected.length === 0 && (
        <p className="mt-6 rounded-card border border-line bg-ground-2 p-4 text-body text-ink-60">
          Önce yukarıdan en az bir renk seçin. Fotoğraflar renk renk yükleniyor.
        </p>
      )}

      {droppedWithPhotos.length > 0 && (
        <p
          role="alert"
          className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink"
        >
          İşaretini kaldırdığınız{" "}
          {droppedWithPhotos.map((c) => colorName(c.key as ColorKey).tr).join(", ")}{" "}
          rengine ait{" "}
          {droppedWithPhotos.reduce((n, c) => n + c.images.length, 0)} fotoğraf,
          kaydettiğinizde üründen düşecek. Vazgeçtiyseniz rengi tekrar işaretleyin.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {selected.map((key) => {
          const color = saved.get(key);
          const images = color?.images ?? [];

          return (
            <div key={key} className="rounded-card border border-line p-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-line"
                  style={{ backgroundColor: colorHex(key) }}
                />
                <span className="text-body text-ink">{colorName(key).tr}</span>
                <span className="text-caption text-ink-40">
                  {images.length} fotoğraf
                </span>
              </div>

              {images.length > 0 && product && (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {images.map((source, i) => (
                    <li key={source} className="w-[104px]">
                      <div className="relative aspect-product overflow-hidden rounded-tile bg-ground-2">
                        <Image
                          src={resolveImageSource(source, product.slug)}
                          alt={`${product.name.tr} — ${colorName(key).tr} ${i + 1}`}
                          fill
                          sizes="104px"
                          className="object-cover"
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {i === 0 ? (
                          <span className="text-caption text-ink">Kapak</span>
                        ) : (
                          <form action={makeCoverAction}>
                            <input type="hidden" name="slug" value={product.slug} />
                            <input type="hidden" name="renk" value={key} />
                            <input type="hidden" name="kaynak" value={source} />
                            <button
                              type="submit"
                              className="text-caption text-ink-60 underline-offset-4 hover:text-ink hover:underline"
                            >
                              Kapak yap
                            </button>
                          </form>
                        )}
                        <form action={removeImageAction}>
                          <input type="hidden" name="slug" value={product.slug} />
                          <input type="hidden" name="renk" value={key} />
                          <input type="hidden" name="kaynak" value={source} />
                          <button
                            type="submit"
                            className="text-caption text-ink-40 underline-offset-4 hover:text-ink hover:underline"
                          >
                            Sil
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {product && color ? (
                <Uploader slug={product.slug} colorKey={key} />
              ) : (
                <p className="mt-4 text-caption text-ink-40">
                  {product
                    ? "Bu renk henüz kaydedilmedi. Kaydet'e basın, sonra fotoğraf yükleyebilirsiniz."
                    : "Ürünü oluşturduktan sonra bu renge fotoğraf yükleyebilirsiniz."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Uploader({ slug, colorKey }: { slug: string; colorKey: string }) {
  const [state, action, pending] = useActionState<
    { error?: string; added?: number } | null,
    FormData
  >(uploadImageAction, null);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="renk" value={colorKey} />
      <input
        type="file"
        name="dosya"
        accept="image/webp,image/avif,image/jpeg,image/png"
        multiple
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
      {state?.added ? (
        <span className="text-caption text-ink-60">
          {state.added} fotoğraf eklendi.
        </span>
      ) : null}
      {state?.error && (
        <span role="alert" className="text-caption text-ink">
          {state.error}
        </span>
      )}
    </form>
  );
}
