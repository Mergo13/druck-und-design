import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoicePdf } from "@/lib/invoice-pdf";

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
  if (crmApiUrl && crmToken && pdfUrl && isAllowedPdfUrl(pdfUrl, crmApiUrl)) {
    try {
      const crmRes = await fetch(pdfUrl, {
        headers: {
          Authorization: `Bearer ${crmToken}`,
          Accept: "application/pdf,application/octet-stream"
        },
        cache: "no-store"
      });
      if (crmRes.ok) {
        return new NextResponse(await crmRes.arrayBuffer(), {
          headers: {
            "Content-Type": crmRes.headers.get("content-type") || "application/pdf",
            "Content-Disposition": crmRes.headers.get("content-disposition") || `inline; filename="rechnung-${invoice.invoiceNumber || invoice.id}.pdf"`,
            "Cache-Control": "private, no-store"
          }
        });
      }
    } catch {
      // Fall back to the locally generated invoice PDF.
    }
  }

  const [order, company] = await Promise.all([
    invoice.orderId ? prisma.adminOrder.findUnique({ where: { id: invoice.orderId } }) : null,
    prisma.companyInformation.findUnique({ where: { id: "company" } })
  ]);
  const rawItems = Array.isArray(order?.items) ? order.items as Array<Record<string, unknown>> : [];
  const items = rawItems.map((item) => ({
    name: String(item.name || item.description || "Druckleistung"),
    quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
    unitPrice: Math.max(0, Number(item.price || item.unitPrice || 0))
  }));
  const pdf = await createInvoicePdf({
    invoiceNumber: invoice.invoiceNumber || invoice.id,
    issuedAt: invoice.issuedAt,
    customer: invoice.customer,
    email: invoice.email,
    billingAddress: order?.billingAddress,
    orderId: invoice.orderId,
    amount: invoice.amount,
    status: invoice.status,
    company: {
      name: company?.name || "druck&design studio",
      legalName: company?.legalName,
      email: company?.email || "service@druckdesignstudio.at",
      phone: company?.phone,
      vatId: company?.vatId || "ATU73973239",
      address: company?.address || "Roseggerstraße 11, 4600 Wels, Österreich",
      website: company?.website || "druck-und-design.at"
    },
    items
  });

  const pdfBody = new Uint8Array(pdf).buffer;
  return new NextResponse(pdfBody, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rechnung-${invoice.invoiceNumber || invoice.id}.pdf"`,
      "Cache-Control": "private, no-store"
    }
  });
}
