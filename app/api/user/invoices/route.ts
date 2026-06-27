import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UserInvoice = {
  id: string;
  invoiceNumber: string;
  orderId?: string | null;
  createdAt: string;
  amount: number;
  status: string;
  pdfUrl?: string;
  source: "crm" | "local";
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const userEmail = session.email.trim().toLowerCase();
  const crmSyncPath = path.join(process.cwd(), "data", "crm-invoice-sync.json");
  const crmPdfTemplate = process.env.CRM_INVOICE_PDF_URL_TEMPLATE?.trim();

  const paidOrders = await prisma.adminOrder.findMany({
    where: {
      email: userEmail,
      status: { in: ["Bezahlt", "Paid"] }
    },
    orderBy: { createdAt: "desc" }
  });

  let syncRows: Array<{
    orderId?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    customerEmail?: string;
    pdfUrl?: string;
  }> = [];
  try {
    const raw = await fs.readFile(crmSyncPath, "utf8").catch(() => "[]");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      syncRows = parsed as Array<{
        orderId?: string;
        invoiceId?: string;
        invoiceNumber?: string;
        customerEmail?: string;
        pdfUrl?: string;
      }>;
    }
  } catch {
    syncRows = [];
  }

  const syncByOrder = new Map(
    syncRows
      .filter((row) => {
        if (!row.orderId) return false;
        const email = getString(row.customerEmail).toLowerCase();
        return !email || email === userEmail;
      })
      .map((row) => [String(row.orderId), row] as const)
  );

  const localInvoices: UserInvoice[] = paidOrders.map((order) => ({
    id: `local-${order.id}`,
    invoiceNumber:
      syncByOrder.get(order.id)?.invoiceNumber ||
      `RE-${order.createdAt.getFullYear()}-${order.id.split("-")[1]?.slice(0, 8) || order.id.slice(-8)}`,
    orderId: order.id,
    createdAt: order.createdAt.toISOString(),
    amount: Number(order.total || 0),
    status: order.status || "Bezahlt",
    pdfUrl:
      (syncByOrder.get(order.id)?.pdfUrl
        ? `/api/user/invoices/pdf?url=${encodeURIComponent(String(syncByOrder.get(order.id)?.pdfUrl))}`
        : undefined) ||
      (crmPdfTemplate && syncByOrder.get(order.id)?.invoiceId
        ? `/api/user/invoices/pdf?url=${encodeURIComponent(
            crmPdfTemplate.replace("{invoice_id}", String(syncByOrder.get(order.id)?.invoiceId))
          )}`
        : undefined),
    source: "local"
  }));
  localInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(localInvoices);
}
