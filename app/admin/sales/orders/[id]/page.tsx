import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModuleDetailPage } from "@/features/admin/modules/admin-module-detail-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailRoute({ params }: PageProps) {
  const [{ user }, { id }] = await Promise.all([requireAdminPage(), params]);
  return (
    <AdminShell title="Bestellung" email={user.email}>
      <AdminModuleDetailPage
        id={id}
        moduleKey="orders"
        title="Bestellung"
        listPath="/admin/sales/orders"
        statusChoices={["Anfrage", "Neu", "Bezahlt", "File Check", "Ready for Print", "Printing", "Finishing", "Ready", "Completed", "Versendet", "Storniert"]}
      />
    </AdminShell>
  );
}
