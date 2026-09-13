import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogJsonEditorPage } from "@/features/admin/catalog/catalog-json-editor-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

type PageProps = { params: Promise<{ slug: string }> };

export default async function AdminIndustryEditPage({ params }: PageProps) {
  const [{ user }, { slug }] = await Promise.all([requireAdminPage(), params]);
  return <AdminShell title="Branche bearbeiten" email={user.email}><CatalogJsonEditorPage resource="industries" slug={slug} /></AdminShell>;
}
