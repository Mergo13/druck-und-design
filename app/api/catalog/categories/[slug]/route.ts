import { NextResponse } from "next/server";
import { deleteCategory } from "@/lib/catalog-repository";

export async function DELETE(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteCategory(slug);
  return NextResponse.json({ ok: true });
}
