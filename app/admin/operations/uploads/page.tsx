import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminUploadsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Datei-Uploads" email={user.email}><AdminModulePage moduleKey="fileUploads" title="Datei-Uploads" description="Upload-Datensätze von Kunden und Bestellungen." allowCreate={false} /></AdminShell>;
}
