import { NextResponse } from "next/server";
import { getProducts, upsertProduct } from "@/lib/catalog-repository";
import type { ProductCatalogItem } from "@/types/print-platform";

export async function GET() {
  return NextResponse.json(await getProducts());
}

export async function POST(request: Request) {
  const body = await request.json() as ProductCatalogItem;
  return NextResponse.json(await upsertProduct(body));
}
