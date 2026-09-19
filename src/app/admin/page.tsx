import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { getCatalogForAdmin } from "@/lib/catalog/catalog";
import { getStoreStatus } from "@/lib/catalog/store";
import { materialName } from "@/data/materials";
import { ProductMedia } from "@/components/ProductMedia";
import { AdminShell } from "./_components/AdminShell";
import { NotConfigured } from "./_components/NotConfigured";
import { CatalogOrder } from "./_components/CatalogOrder";

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
  searchParams: Promise<{ silindi?: string; hata?: string; geriYuklendi?: string }>;
}) {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (!(await isAdmin())) notFound();

  const store = await getStoreStatus();

  const okuma = await getCatalogForAdmin();
  const { silindi, hata, geriYuklendi } = await searchParams;

  /**
   * Depo okunamıyorsa liste HİÇ gösterilmiyor.
   *
   * Eskiden bu durumda pakete gömülü 41 demo ürün çıkıyordu; kullanıcı
   * onları kendi katalogu sanıp üzerinde işlem yapabiliyordu. Panelin
   * gerçeği söylemesi, boş görünmesinden daha önemli.
   */
  if (!okuma.ok) {
    return (
      <AdminShell storeKind={store.kind} storeError={store.error} title="Katalog">
        <p role="alert" className="mt-8 rounded-card border border-line-strong bg-ground-2 p-5 text-body text-ink">
          Katalog şu an okunamıyor, bu yüzden liste gösterilmiyor — ekranda
          olmayan bir veriyle işlem yapmayın. Hiçbir şey silinmedi.
          <span className="mt-3 block text-caption text-ink-60">{okuma.error}</span>
        </p>
        <p className="mt-6 text-caption text-ink-60">
          Birkaç saniye sonra sayfayı yenileyin. Sürerse{" "}
          <Link href="/admin/kurtarma" className="underline underline-offset-4">
            kurtarma ekranından
          </Link>{" "}
          deponun durumunu ve yedekleri görebilirsiniz.
        </p>
      </AdminShell>
    );
  }

  const products = okuma.products;

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

      {geriYuklendi && (
        <p className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink">
          {geriYuklendi} ürün geri yüklendi. Adları, fiyatları ve fotoğrafları
          kontrol edin; eksik kalan bir şey varsa{" "}
          <Link href="/admin/kurtarma" className="underline underline-offset-4">
            kurtarma ekranında
          </Link>{" "}
          başka bir kaynak da olabilir.
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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/kurtarma"
            className="rounded-card border border-line-strong px-4 py-3 text-caption font-medium text-ink"
          >
            Kurtarma
          </Link>
          <Link
            href="/admin/urun/yeni"
            className="rounded-card bg-ink px-6 py-3 text-body font-medium text-ground"
          >
            Yeni ürün
          </Link>
        </div>
      </div>

      {/* Sıralama burada anlatılıyor: tutamaç ve oklar kendi başlarına
          ne işe yaradıklarını söylemiyor. */}
      <p className="mt-4 max-w-2xl text-caption text-ink-60">
        Soldaki tutamaçtan (⠿) tutup sürükleyerek ürünleri dilediğiniz sıraya
        dizin; oklar bir satır taşır, ⤒ başa alır. Sitedeki düzen bu listedir.
        Dizdikten sonra alttaki <strong className="font-medium text-ink">Sırayı kaydet</strong>{" "}
        düğmesine basın.
      </p>

      {/*
        Sıralama istemcide (CatalogOrder), satırın içeriği ise burada —
        sunucuda — üretiliyor: ProductMedia ve malzeme adları oraya hazır
        birer parça olarak gidiyor, istemci yalnızca sıralarını değiştiriyor.

        key, sunucudan gelen sıradan türüyor: kaydetmeden sonra (ya da bir
        ürün silindiğinde) liste yenilenip istemci durumu sunucudakiyle
        yeniden hizalansın.
      */}
      <CatalogOrder
        key={products.map((p) => p.slug).join(",")}
        items={products.map((p) => {
          const photos = p.colors.reduce((n, c) => n + c.images.length, 0);
          /* Stok yalnızca panelde: girilmemişse satırda hiç yazmıyor,
             girilmişse renklerin toplamı künyeye ekleniyor. */
          const stoklu = p.colors.filter((c) => typeof c.stock === "number");
          const stok = stoklu.reduce((n, c) => n + (c.stock ?? 0), 0);
          return {
            slug: p.slug,
            ad: p.name.tr,
            icerik: (
              <>
                <Link href={`/admin/urun/${p.slug}`} className="w-[64px] shrink-0">
                  <ProductMedia product={p} locale="tr" sizes="64px" />
                </Link>

                {/* basis-40: dar ekranda ad ve künye için en az 10rem
                    isteniyor, sığmayan "fotoğraf" rozeti alt satıra
                    iniyor. Yoksa ürün adı üç kelimelik bir sütuna
                    sıkışıyordu. */}
                <div className="min-w-0 flex-1 basis-40">
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
                    {stoklu.length > 0 && (
                      <> · <span className="text-ink">Stok {stok}</span></>
                    )}
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
              </>
            ),
          };
        })}
      />

    </AdminShell>
  );
}
