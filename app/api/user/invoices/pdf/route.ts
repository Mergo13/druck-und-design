import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAllowedPdfUrl(rawUrl: string, crmApiUrl: string) {
  try {
    const target = new URL(rawUrl);
    const crmBase = new URL(crmApiUrl);
    if (target.hostname !== crmBase.hostname) return false;
    const local = target.hostname === "localhost" || target.hostname === "127.0.0.1";
    return local ? ["http:", "https:"].includes(target.protocol) : target.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const invoiceId = new URL(request.url).searchParams.get("invoiceId")?.trim();
  if (!invoiceId) {
    return NextResponse.json({ message: "Rechnungs-ID fehlt" }, { status: 400 });
  }

  const invoice = await prisma.adminInvoice.findFirst({
    where: { id: invoiceId, email: session.email.trim().toLowerCase() }
  });
  if (!invoice) {
    return NextResponse.json({ message: "Rechnung nicht gefunden" }, { status: 404 });
  }

  const crmApiUrl = process.env.CRM_API_URL?.trim();
  const crmToken = process.env.CRM_API_TOKEN?.trim();
  const template = process.env.CRM_INVOICE_PDF_URL_TEMPLATE?.trim();
  const pdfUrl = invoice.pdfUrl || (
    template && invoice.externalInvoiceId
      ? template.replace("{invoice_id}", encodeURIComponent(invoice.externalInvoiceId))
      : ""
  );
  if (!crmApiUrl || !crmToken || !pdfUrl) {
    return NextResponse.json({ message: "CRM-PDF-Konfiguration fehlt" }, { status: 503 });
  }
  if (!isAllowedPdfUrl(pdfUrl, crmApiUrl)) {
    return NextResponse.json({ message: "Ungültige PDF-Quelle" }, { status: 400 });
  }

  try {
    const crmRes = await fetch(pdfUrl, {
      headers: {
        Authorization: `Bearer ${crmToken}`,
        Accept: "application/pdf,application/octet-stream"
      },
      cache: "no-store"
    });
    if (!crmRes.ok) {
      return NextResponse.json({ message: `CRM-PDF konnte nicht geladen werden (${crmRes.status})` }, { status: 502 });
    }

    return new NextResponse(await crmRes.arrayBuffer(), {
      headers: {
        "Content-Type": crmRes.headers.get("content-type") || "application/pdf",
        "Content-Disposition": crmRes.headers.get("content-disposition") || `inline; filename="rechnung-${invoice.invoiceNumber || invoice.id}.pdf"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "CRM-PDF-Abruf fehlgeschlagen", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
