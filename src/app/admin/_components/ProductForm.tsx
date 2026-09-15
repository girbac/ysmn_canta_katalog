"use client";

import type { Product } from "@/data/types";
import type { ColorDef } from "@/data/colors";
import { ColorPicker } from "./ColorPicker";
import { materialKeys, materialName } from "@/data/materials";
import { forms, segments, straps } from "@/lib/catalog/schema";
import { type SaveState } from "../actions";
import { cx } from "@/lib/utils";

const FORM_LABEL: Record<string, string> = {
  tote: "Tote", omuz: "Omuz çantası", baguette: "Baguette", clutch: "Clutch",
  sirt: "Sırt çantası", evrak: "Evrak çantası", postaci: "Seyahat çantası",
};
const STRAP_LABEL: Record<string, string> = {
  ayarlanabilir: "Ayarlanabilir askı", zincir: "Zincir askı",
  sabit: "Sabit sap", yok: "Askısız",
};

/**
 * Ürün formu.
 *
 * Kaydetme bir server action; doğrulama şemanın kendisiyle yapılıyor
 * (src/lib/catalog/schema.ts), yani panelden girilen veri katalogun
 * beklediğinden asla farklı olamıyor. Hatalar alan yoluna göre dönüyor.
 */
/** Kaydet düğmesi form öğesinin dışında; bu id ile ona bağlanıyor. */
export const PRODUCT_FORM_ID = "urun-formu";

export function ProductForm({
  product,
  selected,
  onToggleColor,
  onAddColor,
  action,
  state,
}: {
  product?: Product;
  /** Formdaki canlı renk seçimi, sıraya girmiş hâliyle — ProductEditor'da tutuluyor */
  selected: ColorDef[];
  onToggleColor: (color: ColorDef) => void;
  onAddColor: (color: ColorDef) => void;
  /**
   * Kaydetme eylemi ve durumu da ProductEditor'da duruyor: Kaydet düğmesi
   * sayfanın en altında, fotoğraf bölümünün ardında yaşıyor ve oraya
   * "Kaydediliyor…" bilgisini taşıyabilmesi gerekiyor.
   */
  action: (formData: FormData) => void;
  state: SaveState | null;
}) {
  const errors = state && !state.ok ? state.errors : {};
  const isNew = !product;

  /**
   * Renk hatası dizinin kendisinden ("en az bir renk gerekli") ya da tek
   * bir rengin alanından gelebiliyor ("colors.2.hex"). İkincisi de aynı
   * yerde gösterilmeli, yoksa kullanıcı hiçbir yerde görünmeyen bir
   * hatanın kaydı engellediğini sanır.
   */
  const colorError =
    errors.colors ??
    Object.entries(errors).find(([path]) => path.startsWith("colors."))?.[1];

  /**
   * Alan varsayılanları.
   *
   * Doğrulama hatasından sonra sunucu girilen ham değerleri geri
   * döndürüyor; onları kullanıyoruz. Yoksa düzenlenen ürün, o da yoksa boş.
   * Bu olmadan hatalı bir gönderim 15 alanı birden siliyordu.
   */
  const draft = state && !state.ok ? state.values : undefined;
  const v = draft ?? product;

  /*
   * Fotoğraflar forma HİÇ girmiyor.
   *
   * Eskiden sayfa açıldığı andaki fotoğraf listesi gizli bir alanda
   * taşınıyor ve Kaydet onu geri yazıyordu. Yani sayfa açıldıktan SONRA
   * yüklenen her fotoğrafı Kaydet siliyordu — ikinci bir sekmeden, geri
   * tuşuyla açılmış eski bir sayfadan ya da yükleme sonrası tazeleme
   * gecikirse aynı sekmeden. Fotoğraf yükleyip kaydeden herkes
   * fotoğraflarını kaybediyor, tekrar yüklüyor, yine kaybediyordu.
   *
   * Artık fotoğrafların tek sahibi depo: kaydetme sırasında her rengin
   * görselleri depodaki hâliyle korunuyor (bkz. saveProduct).
   */

  const featureText = (v?.features ?? [])
    .map((f) => (f.tr === f.en ? f.tr : `${f.tr} | ${f.en}`))
    .join("\n");

  return (
    /*
     * noValidate bilinçli.
     *
     * Tarayıcının kendi doğrulaması, geçersiz bir kutu bulduğunda formu
     * hiç göndermiyor ve uyarıyı o kutunun yanında küçük bir baloncukla
     * gösteriyor. Kaydet düğmesi sayfanın en altında yapışkan durduğu,
     * kutu ise metrelerce yukarıda kaldığı için kullanıcının gördüğü tek
     * şey şuydu: "Kaydet'e bastım, hiçbir şey olmadı."
     *
     * Doğrulama artık tek yerde — şemada. Hatalar Türkçe, kendi
     * kutularının altında ve kaydetme çubuğunda özetli çıkıyor;
     * ProductEditor da ilk hataya kaydırıyor.
     */
    <form id={PRODUCT_FORM_ID} action={action} noValidate className="mt-8 max-w-3xl">
      {product && <input type="hidden" name="orijinalSlug" value={product.slug} />}

      {errors._ && <Alert>{errors._}</Alert>}

      {/* Kimlik: tek yazılan şey katalog kodu.
          Mevcut ürünün adresi ve adı gizli alanlarda taşınıyor — adres aynı
          zamanda fotoğraf klasörü olduğu için değişmesi yüklenmiş
          fotoğrafları koparırdı. Yeni üründe ikisi de koddan üretiliyor. */}
      <Section title="Kimlik">
        <Field
          label="Katalog kodu"
          /* Adres ayrı bir kutu olmadığı için ona ait hata da burada
             gösteriliyor; yoksa kullanıcı görünmeyen bir alanın hatasını
             okurdu. */
          error={errors.code ?? errors.slug ?? errors["name.tr"] ?? errors["name.en"]}
          hint={
            isNew
              ? "Ürünün adresi bu koddan üretilir (ör. 2098-S → 2098-s)"
              : "Ürünün adresi ve fotoğraf klasörü değişmez"
          }
        >
          <input name="kod" defaultValue={v?.code} required placeholder="2098-S" className={input} />
        </Field>
        <Field
          label="Ürün adı"
          error={errors["name.tr"]}
          hint="Kartlarda ve ürün sayfasında başlık olur. Boş bırakılırsa kodun kendisi yazar."
        >
          <input
            name="adTr"
            /* Ad kodun kendisiyse kutu boş görünsün: o bir isim değil,
               "isim girilmedi" durumunun karşılığı. */
            defaultValue={v && v.name.tr !== v.code ? v.name.tr : ""}
            placeholder={v?.code || "2098-S"}
            className={input}
          />
        </Field>
      </Section>

      {/* Adres gizli taşınıyor: aynı zamanda fotoğraf klasörü olduğu için
          değişmesi yüklenmiş fotoğrafları koparırdı. */}
      {product && <input type="hidden" name="slug" value={product.slug} />}

      {/* Renkler tek alanda, sıralı ve tam tanımlı gidiyor: ad ve ton
          artık sunucudaki bir listede değil, seçimin kendisinde. */}
      <input type="hidden" name="renkler" value={JSON.stringify(selected)} />

      <Section title="Sınıflandırma">
        <Field label="Bölüm" error={errors.segment}>
          <select name="bolum" defaultValue={v?.segment ?? "kadin"} className={input}>
            {segments.map((s) => (
              <option key={s} value={s}>{s === "kadin" ? "Kadın" : "Erkek / Evrak"}</option>
            ))}
          </select>
        </Field>
        <Field label="Form" error={errors.form}>
          <select name="form" defaultValue={v?.form ?? "tote"} className={input}>
            {forms.map((f) => <option key={f} value={f}>{FORM_LABEL[f]}</option>)}
          </select>
        </Field>
        <Field label="Malzeme" error={errors.material}>
          <select name="malzeme" defaultValue={v?.material ?? "deri"} className={input}>
            {materialKeys.map((m) => (
              <option key={m} value={m}>{materialName(m).tr}</option>
            ))}
          </select>
        </Field>
        <Field label="Askı" hint="Boş bırakılabilir">
          <select name="aski" defaultValue={v?.strap ?? ""} className={input}>
            <option value="">—</option>
            {straps.map((s) => <option key={s} value={s}>{STRAP_LABEL[s]}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Ölçüler" hint="Santimetre. Ürün sayfasındaki ölçek karşılaştırması bu değerlerden çiziliyor.">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Yükseklik" error={errors["dimensions.h"]}>
            <input name="yukseklik" type="number" min={1} max={200} required
              defaultValue={v?.dimensions.h || ""} className={input} />
          </Field>
          <Field label="En" error={errors["dimensions.w"]}>
            <input name="en" type="number" min={1} max={200} required
              defaultValue={v?.dimensions.w || ""} className={input} />
          </Field>
          <Field label="Derinlik" error={errors["dimensions.d"]}>
            <input name="derinlik" type="number" min={1} max={100} required
              defaultValue={v?.dimensions.d || ""} className={input} />
          </Field>
        </div>
      </Section>

      <Section title="Renkler" hint="Hazır renklerden seçin ya da kendi renginizi ekleyin — palet sabit değil. Listedeki ilk renk kartlarda kapak görseli olur; sıra seçtiğiniz sıradır. Seçtiğiniz her renk için aşağıda bir fotoğraf alanı açılır.">
        {colorError && <Alert>{colorError}</Alert>}
        <ColorPicker selected={selected} onToggle={onToggleColor} onAdd={onAddColor} />
      </Section>

      <Section title="Detaylar" hint="Her satır bir madde. Türkçe ve İngilizce karşılığı dikey çizgiyle ayırın: Manyetik kapak | Magnetic flap">
        <textarea name="detaylar" rows={5} defaultValue={featureText}
          placeholder={"Manyetik kapak | Magnetic flap\nKart yuvaları | Card slots"}
          className={cx(input, "font-sans")} />
      </Section>

      <Section title="Vitrin">
        <label className="flex items-center gap-3 text-body text-ink">
          <input type="checkbox" name="yeni" defaultChecked={v?.isNew}
            className="h-4 w-4 accent-[var(--ink)]" />
          &quot;Yeni&quot; etiketi göster — kartlarda rozet çıkar, koleksiyonda &quot;Önce yeniler&quot; sıralamasında öne geçer
        </label>
        <Field
          label="Fiyat (₺)"
          error={errors.price}
          hint="Nasıl yazarsanız yazın: 1500, 1.500, 1.500,50 — hepsi anlaşılır. Kartta, ürün sayfasında, seçkide ve PDF'te görünür. Boş bırakılırsa o ürün için hiç fiyat gösterilmez."
        >
          {/* Sayı kutusu değil: number kutusu "1.500" yazımını geçersiz
              sayıp formu hiç göndermiyordu. Yazılan metin olduğu gibi
              alınıp sunucuda okunuyor (bkz. actions.ts → num). */}
          <input
            name="fiyat"
            type="text"
            inputMode="decimal"
            /* Hatadan sonra yazılan metin aynen geri gelir; okunamayan bir
               fiyat sayıya çevrilince NaN oluyor ve kutuda "NaN" yazıyordu. */
            defaultValue={draft ? draft.priceRaw : (product?.price ?? "")}
            placeholder="1500"
            className={input}
          />
        </Field>
      </Section>

    </form>
  );
}

const input =
  "mt-2 w-full rounded-card border border-line-strong bg-ground-2 px-4 py-3 text-body text-ink focus:border-ink focus:outline-none";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-10 border-t border-line pt-6">
      <legend className="sr-only">{title}</legend>
      <p className="eyebrow text-ink-40">{title}</p>
      {hint && <p className="mt-2 max-w-xl text-caption text-ink-60">{hint}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-caption text-ink-60">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-caption text-ink-40">{hint}</span>}
      {error && <span role="alert" className="mt-1.5 block text-caption text-ink">{error}</span>}
    </label>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink">
      {children}
    </p>
  );
}
