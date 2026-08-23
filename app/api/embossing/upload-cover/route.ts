import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireEmbossingUser } from "@/lib/embossing/server";
import { saveUploadedFile } from "@/lib/file-storage";

const ALLOWED_EXTENSIONS = [".svg", ".ai", ".pdf", ".png"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function publicPathFromUrl(url: string) {
  if (!url.startsWith("/uploads/") || url.includes("..") || url.includes("\0")) return null;
  return path.join(process.cwd(), "public", url.replace(/^\/+/, ""));
}

function decodeXmlText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLines(lines: string[]) {
  return lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

async function analyzeSvg(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  const matches = [...raw.matchAll(/<(?:text|tspan)\b[^>]*>([\s\S]*?)<\/(?:text|tspan)>/gi)];
  const lines = normalizeLines(matches.map((match) => decodeXmlText(match[1] ?? "")));
  return {
    lineCount: lines.length,
    extractedLines: lines,
    analysisMessage: lines.length
      ? `${lines.length} Prägezeilen aus SVG-Text erkannt.`
      : "Keine editierbaren SVG-Textzeilen erkannt. Wenn der Text in Pfade umgewandelt ist, bitte Zeilenanzahl manuell eintragen."
  };
}

async function analyzePdf(filePath: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(await fs.readFile(filePath));
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rowMap = new Map<number, string[]>();
    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      const text = String(item.str ?? "").trim();
      if (!text) continue;
      const y = Math.round(Number(item.transform?.[5] ?? 0));
      rowMap.set(y, [...(rowMap.get(y) ?? []), text]);
    }
    const pageLines = [...rowMap.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([, parts]) => parts.join(" "));
    lines.push(...normalizeLines(pageLines));
  }

  return {
    lineCount: lines.length,
    extractedLines: lines,
    analysisMessage: lines.length
      ? `${lines.length} Prägezeilen aus PDF-Text erkannt.`
      : "Keine lesbaren PDF-Textzeilen erkannt. Bei Vektorpfaden oder gescannten Dateien bitte Zeilenanzahl manuell eintragen."
  };
}

export async function POST(request: Request) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  try {
    const uploaded = await saveUploadedFile(file, {
      folder: "embossing",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      filenameBase: `${auth.session.id}-cover`,
      optimizeForWeb: false
    });
    const filePath = publicPathFromUrl(uploaded.url);
    if (!filePath) return NextResponse.json({ message: "Upload-Pfad konnte nicht geprüft werden." }, { status: 400 });

    const lowerName = uploaded.name.toLowerCase();
    const analysis = lowerName.endsWith(".svg")
      ? await analyzeSvg(filePath)
      : lowerName.endsWith(".pdf")
        ? await analyzePdf(filePath)
        : lowerName.endsWith(".ai")
          ? {
            lineCount: 0,
            extractedLines: [] as string[],
            analysisMessage: "AI-Datei gespeichert. Text kann daraus im Browser nicht zuverlässig gelesen werden; bitte Prägezeilen manuell eintragen."
          }
        : {
          lineCount: 0,
          extractedLines: [] as string[],
          analysisMessage: "Bilddatei gespeichert. Text kann aus PNG nicht zuverlässig gelesen werden; bitte Prägezeilen manuell eintragen."
        };

    return NextResponse.json({
      ...uploaded,
      analysis
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Cover-Upload fehlgeschlagen." }, { status: 400 });
  }
}
