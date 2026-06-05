import { NextResponse } from "next/server";
import { getCategories, upsertCategory } from "@/lib/catalog-repository";
import type { ProductCategory } from "@/types/print-platform";

export async function GET() {
  return NextResponse.json(await getCategories());
}

export async function POST(request: Request) {
  const body = await request.json() as ProductCategory & { originalSlug?: string };
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
