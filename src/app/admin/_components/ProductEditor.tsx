"use client";

import { useActionState, useState } from "react";
import type { Product } from "@/data/types";
import { orderColors, type ColorKey } from "@/data/colors";
import { saveProductAction, type SaveState } from "../actions";
import { ImageManager } from "./ImageManager";
import { PRODUCT_FORM_ID, ProductForm } from "./ProductForm";

/**
 * Ürün düzenleme ekranının tamamı.
 *
 * Burada iki şey ortak tutuluyor, çünkü ekranın farklı yerleri onları
 * paylaşıyor:
 *
 * 1. Renk seçimi — formdaki kutucuklar ve alttaki fotoğraf alanları aynı
 *    listeyi okuyor. Eskiden kutucuklar işaretsiz (uncontrolled) çalışıyor,
 *    fotoğraf bölümü ise sunucudan gelen KAYITLI ürüne bakıyordu; renk
 *    değiştirince alt taraf eski renkleri göstermeye devam ediyordu.
 *
 * 2. Kaydetme eylemi ve durumu — Kaydet düğmesi artık formun içinde değil,
 *    sayfanın en altında. Form öğesinin dışında yaşadığı için ona `form`
 *    özniteliğiyle bağlanıyor; "Kaydediliyor…" bilgisini alabilmesi için de
 *    durumun ikisinin de üstünde durması gerekiyor.
 *
 * Fotoğraf bölümü forma gömülemiyor: içinde kendi <form> öğeleri var ve
 * iç içe form HTML'de geçersiz.
 */
export function ProductEditor({ product }: { product?: Product }) {
  const [selected, setSelected] = useState<ColorKey[]>(
    () => (product?.colors.map((c) => c.key as ColorKey) ?? []),
  );
  const [state, action, pending] = useActionState<SaveState | null, FormData>(
    saveProductAction,
    null,
  );

  function toggle(key: ColorKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  // Kaydetmenin uygulayacağı sıranın aynısı: mevcut sıra korunuyor, yeni
  // işaretlenenler palet yerine giriyor. Panelde gördüğün sıra ile kaydedilen
  // sıra aynı olsun diye tek bir yardımcıdan geçiyor.
  const ordered = orderColors(product?.colors.map((c) => c.key) ?? [], selected);
  const isNew = !product;

  return (
    <>
      <ProductForm
        product={product}
        selected={ordered}
        onToggleColor={toggle}
        action={action}
        state={state}
      />

      <div className="max-w-3xl">
        <ImageManager product={product} selected={ordered} />
      </div>

      {/* Kaydet en altta ve yapışkan: sayfa uzun olduğu için ekranın
          alt kenarında asılı duruyor, formun ortasında kaybolmuyor.
          Alttaki boşluk, son içeriğin çubuğun arkasında kalmaması için. */}
      <div className="sticky bottom-0 z-10 mt-12 max-w-3xl border-t border-line bg-ground py-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            form={PRODUCT_FORM_ID}
            disabled={pending}
            className="rounded-card bg-ink px-6 py-4 text-body font-medium text-ground disabled:opacity-50"
          >
            {pending ? "Kaydediliyor…" : isNew ? "Ürünü oluştur" : "Kaydet"}
          </button>
          {state?.ok && <span className="text-caption text-ink-60">Kaydedildi.</span>}
          {state && !state.ok && (
            <span className="text-caption text-ink">
              Kaydedilemedi — yukarıdaki uyarılara bakın.
            </span>
          )}
        </div>
      </div>
    </>
  );
}
