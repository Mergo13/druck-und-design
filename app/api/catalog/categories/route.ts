import { NextResponse } from "next/server";
import { getCategories, getPublicCategories, upsertCategory } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import type { ProductCategory } from "@/types/print-platform";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope === "admin") {
    await ensureAdminBootstrap();
    const permission = await requireModulePermission("categories", "view");
    if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
    return NextResponse.json(await getCategories());
  }
  return NextResponse.json(await getPublicCategories());
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as ProductCategory & { originalSlug?: string };
  const existing = (await getCategories()).some((item) => item.slug === (body.originalSlug || body.slug));
  const permission = await requireModulePermission("categories", existing ? "update" : "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });
  const { originalSlug, ...category } = body;
  const nextCategory: ProductCategory = {
    ...category,
    visible: category.visible ?? true,
    published: category.published ?? true
  };
  if (!nextCategory.slug || !nextCategory.name) {
    return NextResponse.json({ message: "Slug und Name sind Pflichtfelder." }, { status: 400 });
  }
  return NextResponse.json(await upsertCategory(nextCategory, originalSlug));
}
