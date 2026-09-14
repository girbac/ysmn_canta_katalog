"use client";

import { useState } from "react";
import type { Product } from "@/data/types";
import { colorKeys, type ColorKey } from "@/data/colors";
import { ImageManager } from "./ImageManager";
import { ProductForm } from "./ProductForm";

/**
 * Ürün düzenleme ekranının tamamı.
 *
 * Renk seçimi burada duruyor, çünkü iki ayrı bölüm onu paylaşıyor:
 * formdaki kutucuklar ve alttaki fotoğraf alanları. Eskiden seçim formun
 * içinde işaretsiz (uncontrolled) kutucuklardaydı ve fotoğraf bölümü
 * listesini sunucudan gelen KAYITLI üründen alıyordu; ikisi arasında bağ
 * olmadığı için renk değiştirince alt taraf eski renkleri göstermeye devam
 * ediyordu.
 *
 * Fotoğraf bölümü forma gömülemiyor: içinde kendi <form> öğeleri var ve
 * iç içe form HTML'de geçersiz. Bu yüzden ortak durum yukarı alındı.
 */
export function ProductEditor({ product }: { product?: Product }) {
  const [selected, setSelected] = useState<ColorKey[]>(
    () => (product?.colors.map((c) => c.key as ColorKey) ?? []),
  );

  function toggle(key: ColorKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  // Palet sırası korunuyor: ilk renk kartlarda kapak görseli olur.
  // Kullanıcının tıklama sırası değil, paletin kendi sırası geçerli.
  const ordered = colorKeys.filter((k) => selected.includes(k));

  return (
    <>
      <ProductForm product={product} selected={ordered} onToggleColor={toggle} />
      <div className="max-w-3xl">
        <ImageManager product={product} selected={ordered} />
      </div>
    </>
  );
}
