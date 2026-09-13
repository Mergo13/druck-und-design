import { AdminShell } from "@/components/admin/admin-shell";
import { ProductsAdminPage } from "@/features/admin/products/products-admin-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminProductsPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Produkte" email={user.email}>
      <ProductsAdminPage />
    </AdminShell>
  );
}
