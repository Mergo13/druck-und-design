import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { saveUploadedFile } from "@/lib/file-storage";
import { orientationForSize, recognizeIsoFormat, summarizeMixedPageSizes, type PdfAnalysis } from "@/lib/student-print-config";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MM_PER_POINT = 25.4 / 72;

function publicPathFromUrl(url: string) {
  if (!url.startsWith("/uploads/") || url.includes("..") || url.includes("\0")) return null;
  return path.join(process.cwd(), "public", url.replace(/^\/+/, ""));
}

function pageSizeFromPdf(widthPt: number, heightPt: number, page: number) {
  const widthMm = Math.round(widthPt * MM_PER_POINT * 10) / 10;
  const heightMm = Math.round(heightPt * MM_PER_POINT * 10) / 10;
  return {
    page,
    widthMm,
    heightMm,
    format: recognizeIsoFormat(widthMm, heightMm),
    orientation: orientationForSize(widthMm, heightMm)
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine PDF empfangen." }, { status: 400 });
  }

  const extension = file.name.toLowerCase().includes(".") ? file.name.toLowerCase().slice(file.name.toLowerCase().lastIndexOf(".")) : "";
  if (file.type !== "application/pdf" && extension !== ".pdf") {
    return NextResponse.json({ message: "Bitte lade eine PDF-Datei hoch." }, { status: 400 });
  }

  try {
    const uploaded = await saveUploadedFile(file, {
      folder: "print-check",
      allowedExtensions: [".pdf"],
      maxBytes: MAX_FILE_SIZE
    });
    const absolutePath = publicPathFromUrl(uploaded.url);
    if (!absolutePath) {
      return NextResponse.json({ message: "Upload-Pfad konnte nicht geprüft werden." }, { status: 400 });
    }
    const bytes = await fs.readFile(absolutePath);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
    const pages = pdf.getPages();
    const pageSizes = pages.map((page, index) => {
      const size = page.getSize();
      return pageSizeFromPdf(size.width, size.height, index + 1);
    });
    const groups = summarizeMixedPageSizes(pageSizes);
    const dominant = groups[0];
    const warnings: PdfAnalysis["warnings"] = [];
    if (groups.length > 1) {
      warnings.push({
        type: "mixed-size",
        message: "Unterschiedliche Seitengrößen erkannt. Bitte prüfe, wie diese produziert werden sollen."
      });
    }
    if (!pages.length) {
      warnings.push({ type: "invalid", message: "Die PDF enthält keine Seiten." });
    }
    const analysis: PdfAnalysis = {
      fileName: uploaded.name,
      fileUrl: uploaded.url,
      pages: pages.length,
      dominantFormat: dominant?.label,
      widthMm: dominant?.widthMm,
      heightMm: dominant?.heightMm,
      orientation: pageSizes[0]?.orientation,
      pageSizes,
      colorPages: [],
      bwPages: Array.from({ length: pages.length }, (_, index) => index + 1),
      warnings,
      valid: pages.length > 0
    };

    return NextResponse.json({
      upload: uploaded,
      analysis
    });
  } catch (error) {
    const message = error instanceof Error && /encrypt|password/i.test(error.message)
      ? "Diese PDF ist passwortgeschützt. Bitte lade eine ungeschützte PDF hoch."
      : "Die Datei konnte nicht gelesen werden. Bitte exportiere dein Dokument erneut als PDF.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
