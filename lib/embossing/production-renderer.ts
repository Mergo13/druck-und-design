import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";
import { saveGeneratedUploadFile } from "@/lib/file-storage";
import { fontSizeMm } from "./typography";
import type { EmbossingColor, EmbossingLayoutElement, EmbossingResolvedLayout } from "./types";

const MM_TO_PT = 72 / 25.4;

function mm(value: number) {
  return value * MM_TO_PT;
}

function productionSvg(layout: EmbossingResolvedLayout, color: "preview" | "mask", embossingColor: EmbossingColor) {
  const fill = color === "mask"
    ? "#000"
    : embossingColor === "silber"
      ? "#c7ccd2"
      : embossingColor === "blind"
        ? "#1f2937"
        : "#c99a2e";
  const font = layout.fontStyle === "classic" ? "Times New Roman, Times, serif" : "Helvetica, Arial, sans-serif";
  const body = layout.elements.map((element) => {
    if (element.type === "logo") {
      if (color === "preview" && /\.(svg|png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(element.url)) {
        return `<image href="${escapeXml(element.url)}" x="${element.xMm.toFixed(3)}" y="${element.yMm.toFixed(3)}" width="${element.widthMm.toFixed(3)}" height="${element.heightMm.toFixed(3)}" preserveAspectRatio="xMidYMid meet" opacity="0.95"/>`;
      }
      return `<rect x="${element.xMm.toFixed(3)}" y="${element.yMm.toFixed(3)}" width="${element.widthMm.toFixed(3)}" height="${element.heightMm.toFixed(3)}" fill="${fill}" opacity="${color === "mask" ? "1" : "0.85"}"/>`;
    }
    return element.lines.map((line, index) => {
      const textAnchor = element.alignment === "left" ? "start" : element.alignment === "right" ? "end" : "middle";
      const x = element.alignment === "left" ? element.xMm : element.alignment === "right" ? element.xMm + element.widthMm : element.xMm + element.widthMm / 2;
      const y = element.yMm + (index + 0.82) * element.lineHeightMm;
      return `<text x="${x.toFixed(3)}" y="${y.toFixed(3)}" text-anchor="${textAnchor}" font-family="${font}" font-size="${fontSizeMm(element.fontSizePt).toFixed(3)}" font-weight="${element.weight}" letter-spacing="${element.letterSpacingMm.toFixed(3)}mm" fill="${fill}">${escapeXml(line)}</text>`;
    }).join("");
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.coverGeometry.widthMm}mm" height="${layout.coverGeometry.heightMm}mm" viewBox="0 0 ${layout.coverGeometry.widthMm} ${layout.coverGeometry.heightMm}">${body}</svg>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function drawTextElement(page: any, element: Extract<EmbossingLayoutElement, { type: "text" }>, font: any, pageHeightPt: number) {
  for (const [index, line] of element.lines.entries()) {
    const width = font.widthOfTextAtSize(line, element.fontSizePt) + Math.max(0, Array.from(line).length - 1) * mm(element.letterSpacingMm);
    const xCenterPt = mm(element.xMm + element.widthMm / 2);
    let x = element.alignment === "left"
      ? mm(element.xMm)
      : element.alignment === "right"
        ? mm(element.xMm + element.widthMm) - width
        : xCenterPt - width / 2;
    const yFromTopMm = element.yMm + (index + 0.82) * element.lineHeightMm;
    const y = pageHeightPt - mm(yFromTopMm);
    if (element.letterSpacingMm > 0) {
      for (const char of Array.from(line)) {
        page.drawText(char, { x, y, size: element.fontSizePt, font, color: rgb(0, 0, 0) });
        x += font.widthOfTextAtSize(char, element.fontSizePt) + mm(element.letterSpacingMm);
      }
    } else {
      page.drawText(line, {
        x,
        y,
        size: element.fontSizePt,
        font,
        color: rgb(0, 0, 0)
      });
    }
  }
}

function publicUploadPathFromUrl(url: string) {
  if (!url.startsWith("/uploads/") || url.includes("\0") || url.includes("..")) return null;
  const relative = decodeURIComponent(url).replace(/^\/+/, "");
  const absolute = path.resolve(process.cwd(), "public", relative);
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  return absolute.startsWith(`${uploadsRoot}${path.sep}`) ? absolute : null;
}

async function logoImageBytes(url: string) {
  const filePath = publicUploadPathFromUrl(url);
  if (!filePath) return null;
  const input = await fs.readFile(filePath).catch(() => null);
  if (!input) return null;
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return { bytes: input, type: "png" as const };
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return { bytes: input, type: "jpg" as const };
  if (lower.endsWith(".svg") || lower.endsWith(".webp")) {
    try {
      const sharp = (await import("sharp")).default;
      return { bytes: await sharp(input, { failOn: "none" }).png().toBuffer(), type: "png" as const };
    } catch {
      return null;
    }
  }
  return null;
}

async function drawLogoElement(pdf: PDFDocument, page: any, element: Extract<EmbossingLayoutElement, { type: "logo" }>, pageHeightPt: number) {
  const image = await logoImageBytes(element.url);
  if (image) {
    const embedded = image.type === "jpg" ? await pdf.embedJpg(image.bytes) : await pdf.embedPng(image.bytes);
    page.drawImage(embedded, {
      x: mm(element.xMm),
      y: pageHeightPt - mm(element.yMm + element.heightMm),
      width: mm(element.widthMm),
      height: mm(element.heightMm)
    });
    return;
  }
  page.drawRectangle({
    x: mm(element.xMm),
    y: pageHeightPt - mm(element.yMm + element.heightMm),
    width: mm(element.widthMm),
    height: mm(element.heightMm),
    color: rgb(0, 0, 0)
  });
}

export async function renderEmbossingProductionFiles(params: {
  designId: string;
  layout: EmbossingResolvedLayout;
  embossingColor: EmbossingColor;
}) {
  const pdf = await PDFDocument.create();
  const widthPt = mm(params.layout.coverGeometry.widthMm);
  const heightPt = mm(params.layout.coverGeometry.heightMm);
  const page = pdf.addPage([widthPt, heightPt]);
  const font = await pdf.embedFont(params.layout.fontStyle === "classic" ? StandardFonts.TimesRoman : StandardFonts.Helvetica);

  for (const element of params.layout.elements) {
    if (element.type === "text") {
      await drawTextElement(page, element, font, heightPt);
    } else {
      await drawLogoElement(pdf, page, element, heightPt);
    }
  }

  const [pdfBytes, svgFile, previewFile] = await Promise.all([
    pdf.save(),
    saveGeneratedUploadFile({
      folder: "embossing",
      filenameBase: `${params.designId}-production`,
      extension: ".svg",
      contents: productionSvg(params.layout, "mask", params.embossingColor)
    }),
    saveGeneratedUploadFile({
      folder: "embossing",
      filenameBase: `${params.designId}-preview`,
      extension: ".svg",
      contents: productionSvg(params.layout, "preview", params.embossingColor)
    })
  ]);
  const pdfFile = await saveGeneratedUploadFile({
    folder: "embossing",
    filenameBase: `${params.designId}-production`,
    extension: ".pdf",
    contents: Buffer.from(pdfBytes)
  });
  return {
    productionPdfUrl: pdfFile.url,
    productionSvgUrl: svgFile.url,
    previewUrl: previewFile.url
  };
}
