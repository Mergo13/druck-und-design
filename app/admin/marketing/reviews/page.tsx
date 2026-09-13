import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminReviewsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Bewertungen" email={user.email}><AdminModulePage moduleKey="reviews" title="Bewertungen" description="Kundenbewertungen zur Moderation oder Veröffentlichung." /></AdminShell>;
}
