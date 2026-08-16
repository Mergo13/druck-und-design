import { NextResponse } from "next/server";
import { defaultEmbossingProductionRules } from "@/lib/embossing/types";
import { embossingDesignPayloadSchema, requireEmbossingUser, resolveLayoutFromPayload } from "@/lib/embossing/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") || undefined;
  const rows = await (prisma as any).embossingDesign.findMany({
    where: {
      userId: auth.session.id,
      ...(productId ? { productId } : {})
    },
    orderBy: { updatedAt: "desc" },
    take: 20
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

  const parsed = embossingDesignPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Prägedaten.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;
  const resolvedLayout = resolveLayoutFromPayload(payload);
  const data = {
    userId: auth.session.id,
    productId: payload.productId,
    configurationId: payload.configurationId,
    embossingColor: payload.embossingColor,
    template: payload.template,
    layoutVersion: resolvedLayout.layoutVersion,
    coverGeometry: payload.coverGeometry,
    sourceContent: payload.sourceContent,
    resolvedLayout,
    productionRules: defaultEmbossingProductionRules,
    lineCount: resolvedLayout.lineCount,
    logoUpload: payload.sourceContent.logo ?? undefined,
    status: "draft"
  };

  if (payload.id) {
    const current = await (prisma as any).embossingDesign.findFirst({ where: { id: payload.id, userId: auth.session.id } });
    if (!current) return NextResponse.json({ message: "Prägedesign nicht gefunden." }, { status: 404 });
    if (current.status === "finalized") {
      return NextResponse.json({ message: "Finalisierte Prägungen können nicht still geändert werden." }, { status: 409 });
    }
    const updated = await (prisma as any).embossingDesign.update({ where: { id: payload.id }, data });
    return NextResponse.json(updated);
  }

  const created = await (prisma as any).embossingDesign.create({ data });
  return NextResponse.json(created, { status: 201 });
}
