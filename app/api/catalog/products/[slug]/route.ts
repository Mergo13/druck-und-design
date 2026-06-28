import { NextResponse } from "next/server";
import { deleteProduct, getProductBySlug, getPublicProductBySlug } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("products", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  }
  const product = scope === "admin" ? await getProductBySlug(slug) : await getPublicProductBySlug(slug);
  if (!product) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });
  if (scope === "admin") return NextResponse.json(product);
  const session = await getSessionUser();
  return NextResponse.json(session ? product : withoutPrices(product));
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "delete");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { slug } = await params;
  await deleteProduct(slug);
  return NextResponse.json({ ok: true });
}
