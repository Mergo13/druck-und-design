import { AdminShell } from "@/components/admin/admin-shell";
import { StudentsAdminPage } from "@/features/admin/students/students-admin-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminStudentsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Studenten" email={user.email}><StudentsAdminPage /></AdminShell>;
}
