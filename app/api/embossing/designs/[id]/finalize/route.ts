import { NextResponse } from "next/server";
import { defaultEmbossingProductionRules } from "@/lib/embossing/types";
import { findOwnedEmbossingDesign, requireEmbossingUser } from "@/lib/embossing/server";
import { renderEmbossingProductionFiles } from "@/lib/embossing/production-renderer";
import { validateEmbossingLayout } from "@/lib/embossing/validation";
import { embossingDesignConfigLines } from "@/lib/embossing/pricing-adapter";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const { id } = await params;
  const design = await findOwnedEmbossingDesign(id, auth.session.id);
  if (!design) return NextResponse.json({ message: "Prägedesign nicht gefunden." }, { status: 404 });

  const layout = design.resolvedLayout;
  const preflight = validateEmbossingLayout(layout, design.productionRules ?? defaultEmbossingProductionRules);
  if (!preflight.valid) {
    return NextResponse.json({
      message: "Prägung ist nicht produktionssicher.",
      preflight
    }, { status: 400 });
  }

  let files;
  try {
    files = await renderEmbossingProductionFiles({
      designId: design.id,
      layout,
      embossingColor: design.embossingColor
    });
  } catch {
    return NextResponse.json({ message: "Produktionsdatei konnte nicht erstellt werden." }, { status: 500 });
  }

  const sourceContent = design.sourceContent ?? {};
  const coverUpload = sourceContent.coverUpload;
  const resolvedLineCount = Math.max(0, Math.round(Number(coverUpload?.lineCount ?? 0))) || layout.lineCount;
  const resolvedText = coverUpload?.extractedLines?.length
    ? coverUpload.extractedLines.join("\n")
    : layout.elements
      .filter((element: any) => element.type === "text")
      .map((element: any) => element.lines.join("\n"))
      .join("\n\n");
  const fontSizes = layout.elements
    .filter((element: any) => element.type === "text")
    .map((element: any) => `${element.role}:${Math.round(Number(element.fontSizePt))}pt`)
    .join(", ");

  const updated = await (prisma as any).embossingDesign.update({
    where: { id: design.id },
    data: {
      status: "finalized",
      lineCount: resolvedLineCount,
      previewUrl: files.previewUrl,
      productionPdfUrl: files.productionPdfUrl,
      productionSvgUrl: files.productionSvgUrl,
      finalizedAt: new Date()
    }
  });

  return NextResponse.json({
    design: updated,
    preflight,
    cartConfig: {
      ...embossingDesignConfigLines({
        designId: updated.id,
        color: updated.embossingColor,
        template: updated.template,
        lineCount: updated.lineCount,
        resolvedText,
        fontSizes,
        productionPdfUrl: updated.productionPdfUrl,
        previewUrl: updated.previewUrl
      }),
      ...(coverUpload?.url ? { PraegungCoverUpload: coverUpload.url, PraegungCoverDatei: coverUpload.name ?? "-" } : {}),
      resolvedEmbossingLineCount: String(updated.lineCount)
    }
  });
}
