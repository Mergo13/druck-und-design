import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { getSessionUser } from "@/lib/auth";
import { priceCartItems } from "@/lib/cart-pricing";
import { getUserByEmail } from "@/lib/catalog-repository";
import { prisma } from "@/lib/prisma";
import { canApplyCouponWithStudentDiscount } from "@/lib/student-discount";

const orderItemSchema = z.object({
  id: z.string().optional(),
  productSlug: z.string().min(1),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(100000),
  price: z.number().nonnegative().max(1_000_000),
  config: z.record(z.string(), z.string()).default({}),
  pricingConfig: z.record(z.string(), z.string()).optional()
});

const orderRequestSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(100),
  customerName: z.string().max(200).optional(),
  billingAddress: z.string().max(2000).optional(),
  shippingAddress: z.string().max(2000).optional(),
  shippingCost: z.number().nonnegative().max(100000).optional(),
  shippingName: z.string().max(200).optional(),
  processingFee: z.number().nonnegative().max(100000).optional(),
  couponCode: z.string().max(100).optional(),
  couponDiscount: z.number().nonnegative().max(100000).optional(),
  legalAccepted: z.literal(true),
  printApprovalAccepted: z.literal(true)
});

async function resolveCouponDiscount(code: string | undefined, subtotal: number) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return { code: undefined, discount: 0 };
  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
  const now = new Date();
  if (!coupon || !coupon.active) throw new Error("Gutschein ist nicht gültig.");
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("Gutschein ist noch nicht gültig.");
  if (coupon.endsAt && coupon.endsAt < now) throw new Error("Gutschein ist abgelaufen.");
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new Error("Gutschein wurde bereits vollständig eingelöst.");
  const rawDiscount = coupon.discountType === "percent"
    ? subtotal * Math.min(100, Math.max(0, coupon.discountValue)) / 100
    : coupon.discountValue;
  return {
    code: coupon.code,
    discount: Math.min(subtotal, Math.max(0, Math.round(rawDiscount * 100) / 100))
  };
}

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
    shippingCost: item.shippingCost,
    shippingName: item.shippingName,
    processingFee: item.processingFee,
    couponCode: item.couponCode,
    couponDiscount: item.couponDiscount,
    createdAt: item.createdAt.toISOString(),
    items: item.items
  })));
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const storeControl = await prisma.storeControlSetting.findUnique({ where: { id: "store-control" } });
  if (storeControl?.maintenanceMode || storeControl?.disableCheckout) {
    return NextResponse.json({ message: "Online Shop ist aktuell deaktiviert." }, { status: 423 });
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Bitte melden Sie sich für eine Bestellung auf Rechnung an." }, { status: 401 });
  }

  const parsed = orderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Ungültige Bestelldaten.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const accountProfile = await getUserByEmail(sessionUser.email).catch(() => null);
  let pricedCart;
  try {
    pricedCart = await priceCartItems({
      items: body.items.map((item) => ({
        slug: item.productSlug,
        name: item.name,
        quantity: item.quantity,
        config: item.config,
        pricingConfig: item.pricingConfig
      })),
      user: accountProfile,
      studentDiscountPercent: storeControl?.studentDiscountPercent
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Warenkorb konnte nicht berechnet werden." }, { status: 400 });
  }
  const itemsTotal = pricedCart.subtotalAfterDiscount;
  let coupon;
  try {
    if (body.couponCode && !canApplyCouponWithStudentDiscount(pricedCart.studentDiscountTotal)) {
      throw new Error("Studentenrabatt und Gutscheincode sind nicht kombinierbar.");
    }
    coupon = await resolveCouponDiscount(body.couponCode, itemsTotal);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Gutschein konnte nicht angewendet werden." }, { status: 400 });
  }
  const total = Math.max(0, itemsTotal - coupon.discount + (body.shippingCost ?? 0) + (body.processingFee ?? 0));
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
      couponCode: coupon.code,
      couponDiscount: coupon.discount || undefined,
      total,
      status: "Anfrage",
      items: pricedCart.items.map((item) => ({
        id: randomUUID(),
        productSlug: item.slug,
        name: item.name,
        quantity: item.quantity,
        price: item.lineFinalPrice,
        normalPrice: item.lineNormalPrice,
        finalPrice: item.lineFinalPrice,
        normalUnitPrice: item.normalUnitPrice,
        unitPrice: item.unitPrice,
        studentDiscount: item.studentDiscount,
        embossingDesign: item.embossingDesign,
        config: {
          ...item.config,
          ...(item.embossingDesign ? {
            PraegungDesignId: item.embossingDesign.id,
            Prägezeilen: String(item.embossingDesign.lineCount),
            ProduktionsPDF: item.embossingDesign.productionPdfUrl ?? "-",
            PraegungVorschau: item.embossingDesign.previewUrl ?? "-"
          } : {}),
          pricingConfig: item.pricingConfig,
          Rechtsgrundlage: "AGB, Datenschutz und Druckdaten-Hinweise akzeptiert",
          Druckfreigabe: "Erteilt",
          Freigabezeitpunkt: new Date().toISOString()
        }
      }))
    }
  });
  if (coupon.code && coupon.discount > 0) {
    await prisma.coupon.update({ where: { code: coupon.code }, data: { usedCount: { increment: 1 } } });
  }

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
