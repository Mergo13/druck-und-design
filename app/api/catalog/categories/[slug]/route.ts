import { NextResponse } from "next/server";
import { deleteCategory, getCategories } from "@/lib/catalog-repository";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return NextResponse.json({ message: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(category);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteCategory(slug);
  return NextResponse.json({ ok: true });
}
