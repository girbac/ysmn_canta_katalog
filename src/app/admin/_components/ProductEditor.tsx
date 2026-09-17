"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { Product } from "@/data/types";
import { orderColors, type ColorDef } from "@/data/colors";
import { saveProductAction, type SaveState } from "../actions";
import { ImageManager } from "./ImageManager";
import { PRODUCT_FORM_ID, ProductForm } from "./ProductForm";

/**
 * Ürün düzenleme ekranının tamamı.
 *
 * Burada iki şey ortak tutuluyor, çünkü ekranın farklı yerleri onları
 * paylaşıyor:
 *
 * 1. Renk seçimi — formdaki palet ve alttaki fotoğraf alanları aynı
 *    listeyi okuyor. Eskiden kutucuklar işaretsiz (uncontrolled) çalışıyor,
 *    fotoğraf bölümü ise sunucudan gelen KAYITLI ürüne bakıyordu; renk
 *    değiştirince alt taraf eski renkleri göstermeye devam ediyordu.
 *
 *    Seçim artık yalnızca anahtar değil, rengin tamamı ({ key, tr, en, hex }):
 *    palet dışı renkler tanımlanabildiği için ad ve ton yalnızca burada
 *    biliniyor, sunucuda aranacak bir liste yok.
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
  const [selected, setSelected] = useState<ColorDef[]>(() =>
    (product?.colors ?? []).map((c) => ({
      key: c.key,
      tr: c.name.tr,
      en: c.name.en,
      hex: c.hex,
    })),
  );
  /**
   * Kaydetme useActionState yerine elle yürütülüyor.
   *
   * Sebebi: fotoğraf yükleme de kaydetmeyi ÇAĞIRMAK zorunda ve sonucunu
   * beklemesi gerekiyor (bkz. aşağıdaki `kaydet`). useActionState'in
   * gönderdiği eylem bir söz döndürmüyor, yani "kaydedildi mi?" sorusuna
   * cevap vermiyordu.
   */
  const [state, setState] = useState<SaveState | null>(null);
  const [pending, gecis] = useTransition();
  /** Formda kaydedilmemiş bir değişiklik var mı? */
  const [kirli, setKirli] = useState(false);

  /**
   * Formun o anki hâlini kaydeder ve başarılı olup olmadığını söyler.
   *
   * Fotoğraf yükleme bunu kendi başlangıcında çağırıyor: eskiden yükleme
   * rengi kalıcı olarak kaydediyor ama yazılan ad, fiyat, ölçü hiçbir
   * yere yazılmıyordu. Sayfa yenilenince yazılanlar eski hâline dönüyor,
   * renk ise duruyordu — panel kendi kendine renk ekliyormuş gibi
   * görünüyordu. Artık ikisi birlikte kaydediliyor.
   */
  const kaydet = useCallback(async (): Promise<boolean> => {
    const form = document.getElementById(PRODUCT_FORM_ID) as HTMLFormElement | null;
    if (!form) return false;
    const sonuc = await saveProductAction(null, new FormData(form));
    setState(sonuc);
    if (sonuc.ok) setKirli(false);
    return sonuc.ok;
  }, []);

  /**
   * Kaydetme hata verdiyse ilk hatanın yanına git.
   *
   * Form uzun, Kaydet ise en altta yapışkan duruyor. Hata mesajı ekranın
   * dışında kaldığında kullanıcı neyin yanlış olduğunu göremiyor, aynı
   * şeyi tekrar deneyip duruyordu.
   */
  useEffect(() => {
    if (!state || state.ok) return;
    // Yalnızca FORMUN içindeki hatalar: sayfanın başındaki depo uyarısı da
    // bir uyarı ve onu hedef almak kullanıcıyı en tepeye, alakasız bir
    // kutunun yanına götürüyordu.
    document
      .getElementById(PRODUCT_FORM_ID)
      ?.querySelector('[role="alert"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  /**
   * Kaydedilmemiş değişiklikle sayfadan çıkmak uyarı veriyor.
   *
   * Form alanları tarayıcının kendi alanları; sayfa yenilendiğinde
   * yazılanlar kayboluyor ve kullanıcı bunu ancak iş işten geçtikten sonra
   * fark ediyordu.
   */
  useEffect(() => {
    if (!kirli) return;
    const uyar = (olay: BeforeUnloadEvent) => olay.preventDefault();
    window.addEventListener("beforeunload", uyar);
    return () => window.removeEventListener("beforeunload", uyar);
  }, [kirli]);

  /** Palete tıklamak seçer/kaldırır; aynı anahtar iki kez giremez */
  function toggle(color: ColorDef) {
    setKirli(true);
    setSelected((prev) =>
      prev.some((c) => c.key === color.key)
        ? prev.filter((c) => c.key !== color.key)
        : [...prev, color],
    );
  }

  /**
   * Kendi rengini ekler ya da seçili bir rengin tonunu günceller.
   *
   * Aynı anahtar zaten seçiliyse YERİNDE değişiyor, listenin sonuna
   * taşınmıyor: ilk renk kapak görseli olduğu için tonu düzeltmek ürünün
   * kapak rengini değiştirmemeli.
   */
  function addColor(color: ColorDef) {
    setKirli(true);
    setSelected((prev) =>
      prev.some((c) => c.key === color.key)
        ? prev.map((c) => (c.key === color.key ? color : c))
        : [...prev, color],
    );
  }

  // Kaydetmenin uygulayacağı sıranın aynısı: mevcut sıra korunuyor, yeni
  // seçilenler sona ekleniyor. Panelde gördüğün sıra ile kaydedilen sıra
  // aynı olsun diye tek bir yardımcıdan geçiyor.
  const byKey = new Map(selected.map((c) => [c.key, c]));
  const ordered = orderColors(
    (product?.colors ?? []).map((c) => c.key),
    selected.map((c) => c.key),
  )
    .map((key) => byKey.get(key))
    .filter((c): c is ColorDef => Boolean(c));
  const isNew = !product;

  return (
    <>
      <ProductForm
        product={product}
        selected={ordered}
        onToggleColor={toggle}
        onAddColor={addColor}
        action={() => gecis(() => void kaydet())}
        onDirty={() => setKirli(true)}
        state={state}
      />

      <div className="max-w-3xl">
        {/* Yükleme önce formu kaydediyor: fotoğrafla birlikte yazdıkların da
            yerine otursun, yenileyince kaybolmasın. */}
        <ImageManager product={product} selected={ordered} onBeforeUpload={kaydet} />
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
