import { NextResponse } from "next/server";
import { getCategories, getProducts, upsertProduct } from "@/lib/catalog-repository";
import type { ProductCatalogItem } from "@/types/print-platform";

export async function GET() {
  return NextResponse.json(await getProducts());
}

export async function POST(request: Request) {
  const body = await request.json() as ProductCatalogItem;
  const categories = await getCategories();
  const isValidCategory = categories.some((item) => item.slug === body.category);
  if (!isValidCategory) {
    return NextResponse.json({ message: "Ungültige Kategorie. Bitte bestehende Kategorie verwenden." }, { status: 400 });
  }
  return NextResponse.json(await upsertProduct(body));
}
