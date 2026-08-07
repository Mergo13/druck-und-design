import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type VoucherPdfData = {
  code: string;
  discountType: string;
  discountValue: number;
  customer?: string | null;
  email?: string | null;
  validUntil?: Date | null;
  company?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
  } | null;
};

function formatValue(type: string, value: number) {
  return type === "percent" ? `${value.toFixed(0)} %` : `${value.toFixed(2)} EUR`;
}

export async function createVoucherPdf(data: VoucherPdfData) {
  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.39, 0.45, 0.55);
  const green = rgb(0.04, 0.47, 0.32);

  page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(0.96, 0.98, 0.98) });
  page.drawRectangle({ x: 48, y: 120, width: 499.28, height: 600, color: rgb(1, 1, 1), borderColor: rgb(0.86, 0.89, 0.92), borderWidth: 1 });
  page.drawRectangle({ x: 48, y: 650, width: 499.28, height: 70, color: green });

  page.drawText(data.company?.name || "druck&design studio", { x: 72, y: 680, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("GUTSCHEIN", { x: 72, y: 590, size: 38, font: bold, color: ink });
  page.drawText("Ihr persoenlicher Gutschein fuer Druck, Werbetechnik und Design.", { x: 72, y: 560, size: 12, font: regular, color: muted });

  page.drawText(formatValue(data.discountType, data.discountValue), { x: 72, y: 490, size: 42, font: bold, color: green });
  page.drawText("Gutscheincode", { x: 72, y: 430, size: 10, font: bold, color: muted });
  page.drawRectangle({ x: 72, y: 380, width: 300, height: 42, color: rgb(0.94, 0.98, 0.96), borderColor: rgb(0.70, 0.86, 0.78), borderWidth: 1 });
  page.drawText(data.code, { x: 90, y: 394, size: 18, font: bold, color: ink });

  let y = 330;
  if (data.customer || data.email) {
    page.drawText("Empfaenger", { x: 72, y, size: 10, font: bold, color: muted });
    y -= 20;
    page.drawText(data.customer || data.email || "", { x: 72, y, size: 12, font: regular, color: ink });
    y -= 18;
    if (data.email) page.drawText(data.email, { x: 72, y, size: 10, font: regular, color: muted });
    y -= 28;
  }
  if (data.validUntil) {
    page.drawText(`Gueltig bis: ${data.validUntil.toLocaleDateString("de-DE")}`, { x: 72, y, size: 11, font: bold, color: ink });
    y -= 24;
  }
  page.drawText("Einloesbar im Online-Shop oder direkt bei Anfrage im Studio.", { x: 72, y, size: 11, font: regular, color: muted });
  page.drawText("Nicht in bar abloesbar. Es gelten die Bedingungen des ausgestellten Gutscheins.", { x: 72, y: y - 18, size: 9, font: regular, color: muted });

  const footer = [
    data.company?.address,
    data.company?.email,
    data.company?.phone,
    data.company?.website
  ].filter(Boolean).join(" | ");
  page.drawText(footer || "Roseggerstrasse 11, 4600 Wels | druck-und-design.at", { x: 72, y: 145, size: 8, font: regular, color: muted });

  document.setTitle(`Gutschein ${data.code}`);
  document.setCreator(data.company?.name || "druck&design studio");
  return document.save();
}
