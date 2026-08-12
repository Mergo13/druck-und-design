import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { deleteIndustry, getIndustryBySlug, getPublicIndustryBySlug } from "@/lib/catalog-repository";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("industries", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  }
  const industry = scope === "admin" ? await getIndustryBySlug(slug) : await getPublicIndustryBySlug(slug);
  if (!industry) return NextResponse.json({ message: "Branche nicht gefunden." }, { status: 404 });
  return NextResponse.json(industry);
}

export async function DELETE(_request: Request, context: RouteContext) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("industries", "delete");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { slug } = await context.params;
  await deleteIndustry(slug);
  return NextResponse.json({ ok: true });
}
