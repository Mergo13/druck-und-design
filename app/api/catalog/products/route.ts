import { NextResponse } from "next/server";
import { getCategories, getProducts, getPublicProducts, upsertProduct } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import type { ProductCatalogItem } from "@/types/print-platform";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("products", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    return NextResponse.json(await getProducts());
  }
  return NextResponse.json(await getPublicProducts());
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as ProductCatalogItem;
  const existing = (await getProducts()).some((item) => item.slug === body.slug);
  const permission = await requireModulePermission("products", existing ? "update" : "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const product: ProductCatalogItem = {
    ...body,
    visible: body.visible ?? true,
    published: body.published ?? true
  };
  const categories = await getCategories();
  const isValidCategory = categories.some((item) => item.slug === product.category);
  if (!isValidCategory) {
    return NextResponse.json({ message: "Ungültige Kategorie. Bitte bestehende Kategorie verwenden." }, { status: 400 });
  }
  return NextResponse.json(await upsertProduct(product));
}
