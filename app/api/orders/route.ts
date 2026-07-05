import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const orderItemSchema = z.object({
  id: z.string().optional(),
  productSlug: z.string().min(1),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(100000),
  price: z.number().nonnegative().max(1_000_000),
  config: z.record(z.string(), z.string()).default({})
});

const orderRequestSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(100),
  customerName: z.string().max(200).optional(),
  billingAddress: z.string().max(2000).optional(),
  shippingAddress: z.string().max(2000).optional(),
  shippingCost: z.number().nonnegative().max(100000).optional(),
  shippingName: z.string().max(200).optional(),
  processingFee: z.number().nonnegative().max(100000).optional(),
  legalAccepted: z.literal(true),
  printApprovalAccepted: z.literal(true)
});

export async function GET() {
  await ensureAdminBootstrap();
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Nicht eingeloggt." }, { status: 401 });
  }

  const rows = await prisma.adminOrder.findMany({
    where: { email: sessionUser.email.trim().toLowerCase() },
    orderBy: { createdAt: "desc" }
  });
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
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Bitte melden Sie sich für eine Bestellung auf Rechnung an." }, { status: 401 });
  }

  const parsed = orderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Bestelldaten.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const itemsTotal = body.items.reduce((sum, item) => sum + item.price, 0);
  const total = itemsTotal + (body.shippingCost ?? 0) + (body.processingFee ?? 0);
  const order = await prisma.adminOrder.create({
    data: {
      id: `REQ-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      customer: body.customerName?.trim() || sessionUser.fullName || sessionUser.company || "Webshop Kunde",
      email: sessionUser.email.trim().toLowerCase(),
      company: sessionUser.company,
      vatId: sessionUser.vatId,
      billingAddress: body.billingAddress || sessionUser.billingAddress,
      shippingAddress: body.shippingAddress || sessionUser.shippingAddress,
      shippingCost: body.shippingCost,
      shippingName: body.shippingName,
      processingFee: body.processingFee,
      total,
      status: "Anfrage",
      items: body.items.map((item) => ({
        ...item,
        config: {
          ...item.config,
          Rechtsgrundlage: "AGB, Datenschutz und Druckdaten-Hinweise akzeptiert",
          Druckfreigabe: "Erteilt",
          Freigabezeitpunkt: new Date().toISOString()
        }
      }))
    }
  });

  return NextResponse.json(order, { status: 201 });
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("orders", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null;
  if (!body?.id || !body.status) {
    return NextResponse.json({ message: "ID und Status sind erforderlich." }, { status: 400 });
  }
  const order = await prisma.adminOrder.update({
    where: { id: body.id },
    data: { status: body.status }
  });
  return NextResponse.json(order);
}
