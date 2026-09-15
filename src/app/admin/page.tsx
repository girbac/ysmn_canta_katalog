import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { getCatalog } from "@/lib/catalog/catalog";
import { getStoreStatus } from "@/lib/catalog/store";
import { materialName } from "@/data/materials";
import { ProductMedia } from "@/components/ProductMedia";
import { AdminShell } from "./_components/AdminShell";
import { NotConfigured } from "./_components/NotConfigured";
import { moveProductAction, moveProductToAction } from "./actions";

export const dynamic = "force-dynamic";

const FORM_LABEL: Record<string, string> = {
  tote: "Tote",
  omuz: "Omuz",
  baguette: "Baguette",
  clutch: "Clutch",
  sirt: "Sırt",
  evrak: "Evrak",
  postaci: "Seyahat",
};

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ silindi?: string; hata?: string }>;
}) {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (!(await isAdmin())) notFound();

  const store = await getStoreStatus();

  const products = await getCatalog();
  const { silindi, hata } = await searchParams;

  const missingPhotos = products.filter((p) =>
    p.colors.every((c) => c.images.length === 0),
  ).length;

  return (
    <AdminShell storeKind={store.kind} storeError={store.error} title="Katalog">
      {hata && (
        <p className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink">
          {hata}
        </p>
      )}

      {silindi && (
        <p className="mt-6 rounded-card border border-line bg-ground-2 p-4 text-body text-ink">
          Ürün silindi.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-body text-ink-60">
          {products.length} ürün
          {missingPhotos > 0 && (
            <> · <span className="text-ink">{missingPhotos} ürünün hiç fotoğrafı yok</span></>
          )}
        </p>
        <Link
          href="/admin/urun/yeni"
          className="rounded-card bg-ink px-6 py-3 text-body font-medium text-ground"
        >
          Yeni ürün
        </Link>
      </div>

      {/* Sıralama burada anlatılıyor: numara kutusu kendi başına ne işe
          yaradığını söylemiyor, oklar da öyle. */}
      <p className="mt-4 max-w-2xl text-caption text-ink-60">
        Satır sonundaki numara ürünün katalogdaki sırasıdır — sitede bu düzende
        görünürler. Kutuya yeni bir satır numarası yazıp Enter&apos;a basın, ürün
        oraya taşınsın; oklar bir satır yukarı/aşağı alır.
      </p>

      <ul className="mt-8 divide-y divide-[var(--line)] border-y border-line">
        {products.map((p, i) => {
          const photos = p.colors.reduce((n, c) => n + c.images.length, 0);
          return (
            <li key={p.slug} className="flex flex-wrap items-center gap-4 py-4">
              <Link href={`/admin/urun/${p.slug}`} className="w-[72px] shrink-0">
                <ProductMedia product={p} locale="tr" sizes="72px" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/urun/${p.slug}`}
                  className="text-subheading text-ink hover:text-ink-60"
                >
                  {p.name.tr}
                </Link>
                <p className="text-caption text-ink-60">
                  {p.code} · {p.segment === "kadin" ? "Kadın" : "Erkek"} ·{" "}
                  {FORM_LABEL[p.form]} · {materialName(p.material).tr} ·{" "}
                  {p.colors.length} renk
                  {p.isNew && <> · <span className="text-ink">Yeni</span></>}
                </p>
              </div>

              <span
                className={
                  photos === 0
                    ? "shrink-0 rounded-card border border-line-strong px-3 py-1.5 text-caption text-ink"
                    : "shrink-0 text-caption text-ink-40"
                }
              >
                {photos === 0 ? "Fotoğraf yok" : `${photos} fotoğraf`}
              </span>

              {/* Katalog sırası — kartların görünme düzeni */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Doğrudan sıraya taşı.
                    Oklarla bir satır taşımak kırk ürünlük katalogda
                    yetmiyordu; hedef satırı yazmak tek hamlede götürüyor.

                    key'de sıra numarası var: form sunucuda üretiliyor ve
                    defaultValue, bileşen zaten ekrandayken değişse bile
                    kutuyu güncellemiyor. Taşımadan sonra kutularda eski
                    numaralar kalırdı; anahtar değişince kutu yenileniyor. */}
                <form
                  action={moveProductToAction}
                  /* noValidate: min/max kutunun oklarına yol göstersin diye
                     duruyor ama sınır dışı bir sayı formu ENGELLEMEMELİ.
                     Kırk bir ürünlük listede "999" yazmak "en sona koy"
                     demektir; sunucu zaten uçlara çekiyor. Tarayıcının
                     sessizce göndermemesi, kullanıcıya hiçbir şey olmamış
                     gibi görünüyordu. */
                  noValidate
                  className="mr-1.5 flex items-center gap-1"
                >
                  <input type="hidden" name="slug" value={p.slug} />
                  <label htmlFor={`sira-${p.slug}`} className="sr-only">
                    {p.name.tr} — kaçıncı sıraya taşınsın
                  </label>
                  <input
                    key={`${p.slug}-${i}`}
                    id={`sira-${p.slug}`}
                    name="sira"
                    type="number"
                    min={1}
                    max={products.length}
                    defaultValue={i + 1}
                    className="h-9 w-14 rounded-card border border-line-strong bg-ground-2 text-center text-caption tabular-nums text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label={`${p.name.tr} — yazılan sıraya taşı`}
                    className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink"
                  >
                    →
                  </button>
                </form>
                <form action={moveProductAction}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="yon" value="-1" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label={`${p.name.tr} — yukarı taşı`}
                    className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveProductAction}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="yon" value="1" />
                  <button
                    type="submit"
                    disabled={i === products.length - 1}
                    aria-label={`${p.name.tr} — aşağı taşı`}
                    className="grid h-9 w-9 place-items-center rounded-card border border-line-strong text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
