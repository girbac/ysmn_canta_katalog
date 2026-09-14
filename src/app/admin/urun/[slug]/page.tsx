import { notFound } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { getProductBySlug } from "@/lib/catalog/catalog";
import { getStore } from "@/lib/catalog/store";
import { AdminShell } from "../../_components/AdminShell";
import { NotConfigured } from "../../_components/NotConfigured";
import { ProductEditor } from "../../_components/ProductEditor";
import { deleteProductAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kaydedildi?: string; hata?: string }>;
}) {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (!(await isAdmin())) notFound();

  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const { kaydedildi, hata } = await searchParams;

  return (
    <AdminShell
      storeKind={getStore().kind}
      title={product.name.tr}
      back={{ href: "/admin", label: "Katalog" }}
    >
      {hata && (
        <p className="mt-6 rounded-card border border-line-strong bg-ground-2 p-4 text-body text-ink">
          {hata}
        </p>
      )}

      {kaydedildi && (
        <p className="mt-6 rounded-card border border-line bg-ground-2 p-4 text-body text-ink">
          Ürün oluşturuldu. Şimdi fotoğraflarını ekleyebilirsiniz.
        </p>
      )}

      <ProductEditor product={product} />

      <div className="max-w-3xl">
        <section className="mt-10 border-t border-line pt-6">
          <p className="eyebrow text-ink-40">Ürünü sil</p>
          <p className="mt-2 max-w-xl text-caption text-ink-60">
            Ürün katalogdan ve fotoğrafları depodan kalıcı olarak silinir.
          </p>
          <form action={deleteProductAction} className="mt-4">
            <input type="hidden" name="slug" value={product.slug} />
            <button
              type="submit"
              className="rounded-card border border-line-strong bg-ground-2 px-6 py-3 text-body font-medium text-ink hover:bg-ink hover:text-ground"
            >
              Sil
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
