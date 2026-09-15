import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { getStore, getStoreStatus } from "@/lib/catalog/store";
import { rebuildFromImages } from "@/lib/catalog/recover";
import { AdminShell } from "../_components/AdminShell";
import { NotConfigured } from "../_components/NotConfigured";
import { RestoreForm } from "../_components/RestoreForm";

export const dynamic = "force-dynamic";

/**
 * Kurtarma ekranı.
 *
 * Katalog tek bir dosyada duruyor ve her kaydetme onu baştan yazıyor;
 * bir kez, geçici bir okuma hatası yüzünden bütün ürünlerin üzerine demo
 * veri yazıldı. Bu sayfa iki soruyu cevaplıyor: şu an depoda ne var, ve
 * geri getirilebilecek ne var.
 *
 * Hiçbir şey kendiliğinden yazılmıyor — her geri yükleme bir düğmeye
 * basmayı gerektiriyor ve kendisi de önce mevcut hâli yedekliyor.
 */
export default async function KurtarmaSayfasi() {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (!(await isAdmin())) notFound();

  const store = getStore();
  const durum = await getStoreStatus();

  /* Üç bağımsız soru; biri patlarsa diğerleri yine görünsün. Kurtarma
     ekranının kendisi de arızaya dayanıklı olmalı. */
  const [suanki, yedekler, gorseller] = await Promise.all([
    store.read().then(
      (l) => ({ ok: true as const, adet: l.length }),
      (e: unknown) => ({ ok: false as const, hata: (e as Error).message }),
    ),
    store.listBackups().then(
      (l) => ({ ok: true as const, liste: l }),
      (e: unknown) => ({ ok: false as const, hata: (e as Error).message }),
    ),
    store.listImages().then(
      (l) => ({ ok: true as const, liste: l }),
      (e: unknown) => ({ ok: false as const, hata: (e as Error).message }),
    ),
  ]);

  const kurtarilabilir = gorseller.ok ? rebuildFromImages(gorseller.liste) : [];

  return (
    <AdminShell
      storeKind={durum.kind}
      storeError={durum.error}
      title="Kurtarma"
      back={{ href: "/admin", label: "Katalog" }}
    >
      <p className="mt-6 max-w-2xl text-body text-ink-60">
        Katalog tek bir dosyada duruyor. Bu sayfa o dosyanın şu anki hâlini,
        alınmış yedekleri ve depodaki fotoğraflardan geri kurulabilecek ürünleri
        gösterir. Buradan bir şey yazılması için düğmeye basmanız gerekir; her
        geri yükleme de önce mevcut hâli yedekler.
      </p>

      {/* ── Şu an depoda ne var ── */}
      <Bolum baslik="Şu anki katalog">
        {suanki.ok ? (
          <p className="text-body text-ink">
            Depoda <strong className="font-medium">{suanki.adet} ürün</strong> var.
          </p>
        ) : (
          <p role="alert" className="text-body text-ink">
            Katalog okunamadı: {suanki.hata}
          </p>
        )}
      </Bolum>

      {/* ── Yedekler ── */}
      <Bolum
        baslik="Yedekler"
        aciklama="Her kaydetmeden önce katalogun o anki hâli kopyalanıyor. En yenisi en üstte."
      >
        {!yedekler.ok ? (
          <p role="alert" className="text-body text-ink">
            Yedekler listelenemedi: {yedekler.hata}
          </p>
        ) : yedekler.liste.length === 0 ? (
          <p className="text-body text-ink-60">
            Henüz yedek yok. Yedekleme bu sürümle geldi; bundan sonraki her
            kaydetme bir yedek bırakacak.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-line">
            {yedekler.liste.slice(0, 30).map((y) => (
              <li key={y.key} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1 text-body tabular-nums text-ink">
                  {y.at.replace("T", " ").replace(/-(\d\d)-(\d\d)-\d+Z?$/, ":$1:$2")}
                </span>
                <RestoreForm kaynak="yedek" yedek={y.key} etiket="Bu yedeğe dön" />
              </li>
            ))}
          </ul>
        )}
      </Bolum>

      {/* ── Fotoğraflardan kurtarma ── */}
      <Bolum
        baslik="Fotoğraflardan kurtarma"
        aciklama="Fotoğraflar katalogdan ayrı duruyor, o yüzden katalog gitse bile yerlerindeler. Dosya adlarından ürünler ve renkleri geri kurulabilir."
      >
        {!gorseller.ok ? (
          <p role="alert" className="text-body text-ink">
            Depodaki fotoğraflar listelenemedi: {gorseller.hata}
          </p>
        ) : kurtarilabilir.length === 0 ? (
          <p className="text-body text-ink-60">
            Depoda ürün fotoğrafı bulunamadı.
          </p>
        ) : (
          <>
            <p className="text-body text-ink">
              {gorseller.liste.length} fotoğraftan{" "}
              <strong className="font-medium">{kurtarilabilir.length} ürün</strong>{" "}
              geri kurulabilir.
            </p>
            <p className="mt-2 max-w-2xl text-caption text-ink-60">
              Geri gelenler: ürünler, renkleri ve fotoğrafları. Geri
              gelmeyenler: ad, fiyat, ölçü, malzeme ve detaylar — onlar yalnızca
              katalog dosyasında duruyordu. Kurtarılan ürünler geçici adlarla
              gelir, panelden düzeltirsiniz.
            </p>

            <ul className="mt-5 divide-y divide-[var(--line)] border-y border-line">
              {kurtarilabilir.map((u) => (
                <li key={u.slug} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex-1 text-body text-ink">{u.name.tr}</span>
                  <span className="text-caption text-ink-60">
                    {u.colors.length} renk ·{" "}
                    {u.colors.reduce((n, c) => n + c.images.length, 0)} fotoğraf
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <RestoreForm
                kaynak="fotograf"
                etiket={`${kurtarilabilir.length} ürünü geri yükle`}
                uyari="Bu, şu anki katalogun yerine kurtarılan listeyi yazar. Mevcut hâl önce yedeklenir."
              />
            </div>
          </>
        )}
      </Bolum>

      <p className="mt-10 text-caption text-ink-60">
        <Link href="/admin" className="underline-offset-4 hover:underline">
          ← Kataloğa dön
        </Link>
      </p>
    </AdminShell>
  );
}

function Bolum({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="eyebrow text-ink-40">{baslik}</p>
      {aciklama && <p className="mt-2 max-w-2xl text-caption text-ink-60">{aciklama}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
