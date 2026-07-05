import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { LEGAL_DOCUMENT_FOOTER } from "@/lib/legal";

type InvoicePdfData = {
  invoiceNumber: string;
  issuedAt: Date;
  customer: string;
  email?: string | null;
  billingAddress?: string | null;
  orderId?: string | null;
  amount: number;
  status: string;
  company: {
    name: string;
    legalName?: string | null;
    email?: string | null;
    phone?: string | null;
    vatId?: string | null;
    address?: string | null;
    website?: string | null;
  };
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, size: number, font: PDFFont, color = rgb(0.25, 0.29, 0.36)) {
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * (size + 4), size, font, color }));
  return y - lines.length * (size + 4);
}

export async function createInvoicePdf(data: InvoicePdfData) {
  const document = await PDFDocument.create();
  const page = document.addPage([595.28, 841.89]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.067, 0.333, 0.8);
  const ink = rgb(0.04, 0.065, 0.125);
  const muted = rgb(0.38, 0.42, 0.49);
  const margin = 48;

  page.drawRectangle({ x: 0, y: 782, width: 595.28, height: 60, color: ink });
  page.drawText("druck&design studio", { x: margin, y: 805, size: 21, font: bold, color: rgb(1, 1, 1) });
  page.drawText("RECHNUNG", { x: 430, y: 805, size: 15, font: bold, color: rgb(0.4, 0.87, 1) });

  let y = 744;
  const sender = [
    data.company.legalName || data.company.name,
    data.company.address,
    data.company.email,
    data.company.phone,
    data.company.vatId ? `UID: ${data.company.vatId}` : null
  ].filter(Boolean).join(" | ");
  y = drawLines(page, wrapText(sender, regular, 8, 499), margin, y, 8, regular, muted) - 18;

  page.drawText(data.customer, { x: margin, y, size: 12, font: bold, color: ink });
  y -= 17;
  if (data.billingAddress) {
    y = drawLines(page, data.billingAddress.split(/\r?\n/).flatMap((line) => wrapText(line, regular, 10, 260)), margin, y, 10, regular);
  }
  if (data.email) {
    page.drawText(data.email, { x: margin, y: y - 2, size: 9, font: regular, color: muted });
  }

  const infoX = 360;
  const date = new Intl.DateTimeFormat("de-AT").format(data.issuedAt);
  const info = [
    ["Rechnungsnummer", data.invoiceNumber],
    ["Rechnungsdatum", date],
    ["Bestellung", data.orderId || "-"],
    ["Status", data.status]
  ];
  info.forEach(([label, value], index) => {
    const lineY = 676 - index * 24;
    page.drawText(label, { x: infoX, y: lineY, size: 8, font: regular, color: muted });
    page.drawText(value, { x: infoX, y: lineY - 11, size: 10, font: bold, color: ink });
  });

  y = 540;
  page.drawRectangle({ x: margin, y, width: 499, height: 28, color: blue });
  page.drawText("Position", { x: margin + 10, y: y + 9, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Menge", { x: 365, y: y + 9, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Einzelpreis", { x: 420, y: y + 9, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Summe", { x: 510, y: y + 9, size: 9, font: bold, color: rgb(1, 1, 1) });

  y -= 25;
  const items = data.items.length ? data.items : [{ name: "Leistungen gemäß Bestellung", quantity: 1, unitPrice: data.amount }];
  for (const item of items.slice(0, 12)) {
    const rowLines = wrapText(item.name, regular, 9, 280);
    const rowHeight = Math.max(30, rowLines.length * 13 + 10);
    page.drawRectangle({ x: margin, y: y - rowHeight + 7, width: 499, height: rowHeight, color: rgb(0.965, 0.975, 0.99) });
    drawLines(page, rowLines, margin + 10, y - 6, 9, regular, ink);
    page.drawText(String(item.quantity), { x: 378, y: y - 6, size: 9, font: regular, color: ink });
    page.drawText(`${item.unitPrice.toFixed(2)} EUR`, { x: 420, y: y - 6, size: 9, font: regular, color: ink });
    page.drawText(`${(item.unitPrice * item.quantity).toFixed(2)} EUR`, { x: 495, y: y - 6, size: 9, font: bold, color: ink });
    y -= rowHeight + 3;
  }

  page.drawText("Gesamtbetrag", { x: 380, y: y - 18, size: 11, font: bold, color: ink });
  page.drawText(`${data.amount.toFixed(2)} EUR`, { x: 485, y: y - 18, size: 12, font: bold, color: blue });

  const footerLines = wrapText(LEGAL_DOCUMENT_FOOTER, regular, 8, 499);
  page.drawLine({ start: { x: margin, y: 76 }, end: { x: 547, y: 76 }, thickness: 1, color: rgb(0.85, 0.87, 0.9) });
  drawLines(page, footerLines, margin, 61, 8, regular, muted);
  page.drawText(data.company.website || "druck-und-design.at", { x: margin, y: 25, size: 8, font: bold, color: blue });

  document.setTitle(`Rechnung ${data.invoiceNumber}`);
  document.setAuthor(data.company.legalName || data.company.name);
  document.setCreator("druck&design studio");
  return document.save();
}
