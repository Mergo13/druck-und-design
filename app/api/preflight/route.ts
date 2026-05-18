import { NextResponse } from "next/server";
import { runMockPreflight } from "@/lib/print-workflow";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    filename?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    widthPx?: number;
    heightPx?: number;
    targetFormat?: string;
    colorModelHint?: "RGB" | "CMYK" | "Unknown";
  };
  const filename = body.filename ?? "unbekannt.pdf";
  return NextResponse.json(runMockPreflight(filename, {
    fileSizeBytes: body.fileSizeBytes,
    mimeType: body.mimeType,
    widthPx: body.widthPx,
    heightPx: body.heightPx,
    targetFormat: body.targetFormat,
    colorModelHint: body.colorModelHint
  }));
}
