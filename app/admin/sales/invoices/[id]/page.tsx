import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModuleDetailPage } from "@/features/admin/modules/admin-module-detail-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminInvoiceDetailRoute({ params }: PageProps) {
  const [{ user }, { id }] = await Promise.all([requireAdminPage(), params]);
  return (
    <AdminShell title="Rechnung" email={user.email}>
      <AdminModuleDetailPage id={id} moduleKey="invoices" title="Rechnung" listPath="/admin/sales/invoices" statusChoices={["open", "paid", "overdue", "cancelled", "Bezahlt", "Offen", "Storniert", "Gutschein"]} />
    </AdminShell>
  );
}
