import { notFound } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/admin-session";
import { getStore } from "@/lib/catalog/store";
import { AdminShell } from "../../_components/AdminShell";
import { NotConfigured } from "../../_components/NotConfigured";
import { ProductEditor } from "../../_components/ProductEditor";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  if (!isAdminConfigured()) return <NotConfigured />;
  if (!(await isAdmin())) notFound();

  return (
    <AdminShell
      storeKind={getStore().kind}
      title="Yeni ürün"
      back={{ href: "/admin", label: "Katalog" }}
    >
      <ProductEditor />
    </AdminShell>
  );
}
