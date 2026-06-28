import { NextResponse } from "next/server";
import { deleteCategory, getCategories, getPublicCategories } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("categories", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  }
  const categories = scope === "admin" ? await getCategories() : await getPublicCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(category);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("categories", "delete");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { slug } = await params;
  try {
    await deleteCategory(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategorie konnte nicht gelöscht werden.";
    return NextResponse.json({ message }, { status: 409 });
  }
}
