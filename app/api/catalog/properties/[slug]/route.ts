import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { deleteGlobalProperty, getGlobalProperty } from "@/lib/catalog-repository";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "view");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { slug } = await context.params;
  const property = await getGlobalProperty(slug);
  if (!property) return NextResponse.json({ message: "Eigenschaft nicht gefunden." }, { status: 404 });
  return NextResponse.json(property);
}

export async function DELETE(request: Request, context: RouteContext) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "delete");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { slug } = await context.params;
  const removeFromProducts = new URL(request.url).searchParams.get("removeFromProducts") === "true";
  return NextResponse.json({ ok: true, result: await deleteGlobalProperty(slug, removeFromProducts) });
}
