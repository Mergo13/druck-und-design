import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModuleDetailPage } from "@/features/admin/modules/admin-module-detail-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminQuoteDetailRoute({ params }: PageProps) {
  const [{ user }, { id }] = await Promise.all([requireAdminPage(), params]);
  return (
    <AdminShell title="Angebot" email={user.email}>
      <AdminModuleDetailPage id={id} moduleKey="quotes" title="Angebot" listPath="/admin/sales/quotes" statusChoices={["draft", "sent", "accepted", "rejected", "expired"]} />
    </AdminShell>
  );
}
