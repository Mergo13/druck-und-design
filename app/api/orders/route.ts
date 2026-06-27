import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { createCRMInvoice } from "@/lib/crm";
import { getSessionUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Order } from "@/types";

const crmPendingPath = path.join(process.cwd(), "data", "crm-pending-orders.json");
const crmSyncPath = path.join(process.cwd(), "data", "crm-invoice-sync.json");

type CrmPendingOrder = {
  orderId: string;
  customer: string;
  email: string;
  total: number;
  items: Array<{ description: string; qty: number; price: number }>;
  createdAt: string;
  retries: number;
  lastError?: string;
};

async function readCrmPending() {
  const raw = await fs.readFile(crmPendingPath, "utf8").catch(() => "[]");
  try {
    return JSON.parse(raw) as CrmPendingOrder[];
  } catch {
    return [] as CrmPendingOrder[];
  }
}

async function writeCrmPending(rows: CrmPendingOrder[]) {
  await fs.mkdir(path.dirname(crmPendingPath), { recursive: true });
  await fs.writeFile(crmPendingPath, JSON.stringify(rows, null, 2), "utf8");
}

async function enqueueCrmPending(entry: CrmPendingOrder) {
  const current = await readCrmPending();
  const idx = current.findIndex((item) => item.orderId === entry.orderId);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...entry, retries: (current[idx].retries || 0) + 1 };
  } else {
    current.push(entry);
  }
  await writeCrmPending(current);
}

type CrmSyncRow = {
  stripeSessionId?: string;
  syncedAt: string;
  orderId: string;
  customerEmail?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  pdfUrl?: string;
};

async function readCrmSyncRows() {
  const raw = await fs.readFile(crmSyncPath, "utf8").catch(() => "[]");
  try {
    return JSON.parse(raw) as CrmSyncRow[];
  } catch {
    return [] as CrmSyncRow[];
  }
}

async function writeCrmSyncRows(rows: CrmSyncRow[]) {
  await fs.mkdir(path.dirname(crmSyncPath), { recursive: true });
  await fs.writeFile(crmSyncPath, JSON.stringify(rows, null, 2), "utf8");
}

export async function GET() {
  await ensureAdminBootstrap();
  const rows = await prisma.adminOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows.map((item) => ({
    id: item.id,
    customer: item.customer,
    email: item.email,
    company: item.company,
    vatId: item.vatId,
    total: item.total,
    status: item.status,
    billingAddress: item.billingAddress,
    shippingAddress: item.shippingAddress,
    createdAt: item.createdAt.toISOString(),
    items: item.items
  })));
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as Order & { 
    customerEmail?: string; 
    customerName?: string;
    billingAddress?: string;
    shippingAddress?: string;
    shippingCost?: number;
    shippingName?: string;
    processingFee?: number;
  };
  const sessionUser = await getSessionUser();
  const order = await prisma.adminOrder.upsert({
    where: { id: body.id },
    update: {
      customer: (typeof body.customerName === "string" && body.customerName.trim())
        ? body.customerName.trim()
        : (sessionUser?.fullName || sessionUser?.company || "Webshop Kunde"),
      email: (typeof body.customerEmail === "string" && body.customerEmail.trim())
        ? body.customerEmail.trim()
        : sessionUser?.email,
      company: sessionUser?.company,
      vatId: sessionUser?.vatId,
      billingAddress: body.billingAddress || sessionUser?.billingAddress,
      shippingAddress: body.shippingAddress || sessionUser?.shippingAddress,
      shippingCost: body.shippingCost,
      shippingName: body.shippingName,
      processingFee: body.processingFee,
      total: body.total,
      status: "status" in body && typeof (body as { status?: string }).status === "string"
        ? (body as { status?: string }).status ?? "Neu"
        : "Neu",
      items: body.items as unknown as object
    },
    create: {
      id: body.id,
      customer: (typeof body.customerName === "string" && body.customerName.trim())
        ? body.customerName.trim()
        : (sessionUser?.fullName || sessionUser?.company || "Webshop Kunde"),
      email: (typeof body.customerEmail === "string" && body.customerEmail.trim())
        ? body.customerEmail.trim()
        : sessionUser?.email,
      company: sessionUser?.company,
      vatId: sessionUser?.vatId,
      billingAddress: body.billingAddress || sessionUser?.billingAddress,
      shippingAddress: body.shippingAddress || sessionUser?.shippingAddress,
      shippingCost: body.shippingCost,
      shippingName: body.shippingName,
      processingFee: body.processingFee,
      total: body.total,
      status: "status" in body && typeof (body as { status?: string }).status === "string"
        ? (body as { status?: string }).status ?? "Neu"
        : "Neu",
      items: body.items as unknown as object
    }
  });

  const customerEmail = (typeof body.customerEmail === "string" && body.customerEmail.trim())
    ? body.customerEmail.trim()
    : sessionUser?.email?.trim();
  const customerName = (typeof body.customerName === "string" && body.customerName.trim())
    ? body.customerName.trim()
    : (sessionUser?.fullName || order.customer);

  if (customerEmail) {
    try {
      const companyName = sessionUser?.company?.trim() || "";
      const customerDisplay = companyName || (customerName || "Webshop Kunde");
      const baseAddress = body.billingAddress || sessionUser?.billingAddress || "";
      const invoiceAddress = customerName ? `${baseAddress}\nz.H. ${customerName}` : baseAddress;

      const crmInvoice = await createCRMInvoice({
        customer: customerDisplay,
        email: customerEmail,
        company: companyName || undefined,
        vatId: sessionUser?.vatId || undefined,
        address: invoiceAddress || undefined,
        shipping_address: body.shippingAddress || sessionUser?.shippingAddress || undefined,
        shipping_name: body.shippingName || sessionUser?.fullName || customerName || undefined,
        shipping_cost: typeof body.shippingCost === "number" ? body.shippingCost : undefined,
        processing_fee: typeof body.processingFee === "number" ? body.processingFee : undefined,
        total: Number(order.total || 0),
        items: (body.items ?? []).map((item) => ({
          description: item.name,
          qty: item.quantity,
          price: item.price
        }))
      });

      const syncRows = await readCrmSyncRows();
      const existingIndex = syncRows.findIndex((row) => row.orderId === order.id);
      const nextRow: CrmSyncRow = {
        syncedAt: new Date().toISOString(),
        orderId: order.id,
        customerEmail,
        invoiceId: crmInvoice?.invoice_id ? String(crmInvoice.invoice_id) : undefined,
        invoiceNumber: crmInvoice?.invoice_number ? String(crmInvoice.invoice_number) : undefined
      };
      if (existingIndex >= 0) {
        syncRows[existingIndex] = { ...syncRows[existingIndex], ...nextRow };
      } else {
        syncRows.push(nextRow);
      }
      await writeCrmSyncRows(syncRows);
    } catch (error) {
      logger.error({ err: error, orderId: order.id, customerEmail }, "CRM invoice creation failed for /api/orders POST");
      await enqueueCrmPending({
        orderId: order.id,
        customer: customerName || "Webshop Kunde",
        email: customerEmail,
        total: Number(order.total || 0),
        items: (body.items ?? []).map((item) => ({
          description: item.name,
          qty: item.quantity,
          price: item.price
        })),
        createdAt: new Date().toISOString(),
        retries: 0,
        lastError: error instanceof Error ? error.message : String(error)
      });
      return NextResponse.json({
        ...order,
        warning: "Bestellung gespeichert. CRM-Rechnung wird erneut synchronisiert."
      });
    }
  }

  return NextResponse.json(order);
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const body = await request.json() as Order;
  const order = await prisma.adminOrder.update({
    where: { id: body.id },
    data: {
      customer: "customer" in body && typeof (body as { customer?: string }).customer === "string"
        ? (body as { customer?: string }).customer ?? "Kunde"
        : "Kunde",
      total: body.total,
      status: "status" in body && typeof (body as { status?: string }).status === "string"
        ? (body as { status?: string }).status ?? "Neu"
        : "Neu",
      items: body.items as unknown as object
    }
  });
  return NextResponse.json(order);
}
