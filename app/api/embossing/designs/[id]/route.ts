import { NextResponse } from "next/server";
import { findOwnedEmbossingDesign, requireEmbossingUser } from "@/lib/embossing/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const { id } = await params;
  const design = await findOwnedEmbossingDesign(id, auth.session.id);
  if (!design) return NextResponse.json({ message: "Prägedesign nicht gefunden." }, { status: 404 });
  return NextResponse.json(design);
}
