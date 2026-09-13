import { AdminShell } from "@/components/admin/admin-shell";
import { ProductEditPage } from "@/features/admin/products/product-edit-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminProductEditRoute({ params }: PageProps) {
  const [{ user }, { slug }] = await Promise.all([requireAdminPage(), params]);
  return (
    <AdminShell title={slug === "new" ? "Neues Produkt" : "Produkt bearbeiten"} email={user.email}>
      <ProductEditPage slug={slug} />
    </AdminShell>
  );
}
