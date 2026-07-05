import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const invoices = await prisma.adminInvoice.findMany({
    where: { email: session.email.trim().toLowerCase() },
    orderBy: { issuedAt: "desc" }
  });

  return NextResponse.json(invoices.map((invoice) => {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      orderId: invoice.orderId,
      createdAt: invoice.issuedAt.toISOString(),
      amount: invoice.amount,
      status: invoice.status,
      pdfUrl: `/api/user/invoices/pdf?invoiceId=${encodeURIComponent(invoice.id)}`,
      source: invoice.source
    };
  }));
}
