import { NextResponse } from "next/server";
import { deleteProduct, getProductBySlug } from "@/lib/catalog-repository";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteProduct(slug);
  return NextResponse.json({ ok: true });
}
