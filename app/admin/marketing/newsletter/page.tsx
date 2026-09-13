import { AdminShell } from "@/components/admin/admin-shell";
import { NewsletterAdminPage } from "@/features/admin/newsletter/newsletter-admin-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminNewsletterPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Newsletter" email={user.email}><NewsletterAdminPage /></AdminShell>;
}
