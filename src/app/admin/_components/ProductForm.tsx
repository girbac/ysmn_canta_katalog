"use client";

import type { Product } from "@/data/types";
import { colorKeys, colorHex, colorName, type ColorKey } from "@/data/colors";
import { materialKeys, materialName } from "@/data/materials";
import { forms, segments, straps } from "@/lib/catalog/schema";
import { type SaveState } from "../actions";
import { cx } from "@/lib/utils";

const FORM_LABEL: Record<string, string> = {
  tote: "Tote", omuz: "Omuz çantası", baguette: "Baguette", clutch: "Clutch",
  sirt: "Sırt çantası", evrak: "Evrak çantası", postaci: "Postacı çantası",
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
  action,
  state,
}: {
  product?: Product;
  /** Formdaki canlı renk seçimi — ProductEditor'da tutuluyor */
  selected: ColorKey[];
  onToggleColor: (key: ColorKey) => void;
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
   * Alan varsayılanları.
   *
   * Doğrulama hatasından sonra sunucu girilen ham değerleri geri
   * döndürüyor; onları kullanıyoruz. Yoksa düzenlenen ürün, o da yoksa boş.
   * Bu olmadan hatalı bir gönderim 15 alanı birden siliyordu.
   */
  const draft = state && !state.ok ? state.values : undefined;
  const v = draft ?? product;

  /**
   * Kayıtlı görseller, seçimden bağımsız olarak tam listeden gidiyor:
   * productFromForm yalnızca işaretli renklerin görsellerini okuyor,
   * dolayısıyla fazladan anahtar zararsız. Bir rengin işaretini kaldırıp
   * geri işaretlemek fotoğraflarını kaybettirmiyor.
   */
  const existingImages = Object.fromEntries(
    (product?.colors ?? []).map((c) => [c.key, c.images]),
  );

  const featureText = (v?.features ?? [])
    .map((f) => (f.tr === f.en ? f.tr : `${f.tr} | ${f.en}`))
    .join("\n");

  return (
    <form id={PRODUCT_FORM_ID} action={action} className="mt-8 max-w-3xl">
      {product && <input type="hidden" name="orijinalSlug" value={product.slug} />}
      {/* Görseller ayrı akışta yönetiliyor; kaydetmede kaybolmasınlar */}
      <input type="hidden" name="mevcutGorseller" value={JSON.stringify(existingImages)} />

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
      {product && (
        <>
          <input type="hidden" name="slug" value={product.slug} />
          {/* Kayıtlı renk sırası: kaydetme onu koruyup yalnızca yeni
              işaretlenenleri araya ekliyor. */}
          <input
            type="hidden"
            name="renkSirasi"
            value={product.colors.map((c) => c.key).join(",")}
          />
        </>
      )}

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

      <Section title="Renkler" hint="İlk işaretli renk kartlarda kapak görseli olur. Sıra palet sırasını izler. İşaretlediğiniz her renk için aşağıda bir fotoğraf alanı açılır.">
        {errors.colors && <Alert>{errors.colors}</Alert>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {colorKeys.map((key: ColorKey) => (
            <label key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-card border border-line-strong bg-ground-2 px-3 py-2.5 text-caption text-ink has-checked:border-ink">
              <input type="checkbox" name="renkler" value={key}
                checked={selected.includes(key)}
                onChange={() => onToggleColor(key)}
                className="accent-[var(--ink)]" />
              <span className="h-4 w-4 shrink-0 rounded-full border border-line"
                style={{ backgroundColor: colorHex(key) }} />
              {colorName(key).tr}
            </label>
          ))}
        </div>
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
        <Field label="Fiyat (₺)" hint="Kuruşsuz tam sayı. Kartta, ürün sayfasında, seçkide ve PDF'te görünür. Boş bırakılırsa o ürün için hiç fiyat gösterilmez.">
          <input name="fiyat" type="number" min={0} step="1"
            defaultValue={v?.price ?? ""} className={input} />
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
