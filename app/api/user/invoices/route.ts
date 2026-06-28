import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const crmPdfTemplate = process.env.CRM_INVOICE_PDF_URL_TEMPLATE?.trim();
  const invoices = await prisma.adminInvoice.findMany({
    where: { email: session.email.trim().toLowerCase() },
    orderBy: { issuedAt: "desc" }
  });

  return NextResponse.json(invoices.map((invoice) => {
    const hasRemotePdf = Boolean(invoice.pdfUrl || (crmPdfTemplate && invoice.externalInvoiceId));
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      orderId: invoice.orderId,
      createdAt: invoice.issuedAt.toISOString(),
      amount: invoice.amount,
      status: invoice.status,
      pdfUrl: hasRemotePdf
        ? `/api/user/invoices/pdf?invoiceId=${encodeURIComponent(invoice.id)}`
        : undefined,
      source: invoice.source
    };
  }));
}
