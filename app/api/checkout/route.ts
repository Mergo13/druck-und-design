import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";
import { getUserByEmail } from "@/lib/catalog-repository";

const printCheckFee = Number(process.env.PRINT_CHECK_FEE_EUR?.trim() || "9.99");
const checkoutItemsDir = path.join(process.cwd(), "data", "stripe-checkout-items");

type CheckoutItem = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice?: number;
  config?: Record<string, string>;
  printCheckRequested?: boolean;
  printCheckFee?: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
};

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const storeControl = await prisma.storeControlSetting.findUnique({ where: { id: "store-control" } });
  if (storeControl?.maintenanceMode || storeControl?.disableCheckout) {
    return NextResponse.json({ message: "Checkout ist aktuell deaktiviert." }, { status: 423 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) {
    return NextResponse.json({ message: "Stripe ist nicht konfiguriert." }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as { 
    items?: CheckoutItem[]; 
    notes?: string; 
    deliveryMethod?: "abholung" | "versand";
    customerName?: string;
    customerEmail?: string;
    company?: string;
    billingAddress?: string;
    shippingAddress?: string;
    shippingCost?: number;
    shippingName?: string;
    processingFee?: number;
    couponCode?: string;
    legalAccepted?: boolean;
    printApprovalAccepted?: boolean;
  } | null;
  const items = body?.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: "Warenkorb ist leer." }, { status: 400 });
  }
  if (body?.legalAccepted !== true || body?.printApprovalAccepted !== true) {
    return NextResponse.json({ message: "AGB, Datenschutz, Druckdaten-Hinweise und Druckfreigabe müssen bestätigt werden." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * Math.max(1, item.quantity || 1), 0);
  const normalizedCouponCode = body?.couponCode?.trim().toUpperCase() || "";
  let couponDiscount = 0;
  if (normalizedCouponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } });
    const now = new Date();
    if (!coupon || !coupon.active) {
      return NextResponse.json({ message: "Gutschein ist nicht gültig." }, { status: 400 });
    }
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ message: "Gutschein ist noch nicht gültig." }, { status: 400 });
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      return NextResponse.json({ message: "Gutschein ist abgelaufen." }, { status: 400 });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ message: "Gutschein wurde bereits vollständig eingelöst." }, { status: 400 });
    }
    const rawDiscount = coupon.discountType === "percent"
      ? itemsSubtotal * Math.min(100, Math.max(0, coupon.discountValue)) / 100
      : coupon.discountValue;
    couponDiscount = Math.min(itemsSubtotal, Math.max(0, Math.round(rawDiscount * 100) / 100));
  }

  const lineItems = items.flatMap((item) => {
    const orderLines = [
      {
        quantity: Math.max(1, item.quantity || 1),
        price_data: {
          currency: "eur",
          unit_amount: Math.max(50, Math.round((item.unitPrice ?? 1) * 100)),
          product_data: {
            name: item.name,
            description: item.category
          }
        }
      }
    ];
    if (item.printCheckRequested) {
      orderLines.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round((item.printCheckFee ?? printCheckFee) * 100),
          product_data: {
            name: `Profi Print-Check (${item.name})`,
            description: item.printCheckFileName || "Datei- und Qualitätsprüfung"
          }
        }
      });
    }
    return orderLines;
  });
  
  const processingFee = Number(body?.processingFee || 0);
  if (processingFee > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: "Bearbeitung & Verpackung",
          description: "Pauschale für Bearbeitung und Verpackung"
        },
        unit_amount: Math.round(processingFee * 100),
      },
      quantity: 1,
    });
  }

  const sessionUser = await getSessionUser().catch(() => null);
  const accountProfile = sessionUser?.email
    ? await getUserByEmail(sessionUser.email).catch(() => null)
    : null;
  const effectiveCompany = body?.company || accountProfile?.company || sessionUser?.company || "";
  const effectiveVatId = accountProfile?.vatId || sessionUser?.vatId || "";
  const effectiveBillingAddress = body?.billingAddress || accountProfile?.billingAddress || sessionUser?.billingAddress || "";
  const effectiveShippingAddress = body?.shippingAddress || accountProfile?.shippingAddress || accountProfile?.billingAddress || sessionUser?.shippingAddress || sessionUser?.billingAddress || "";
  const effectiveCustomerName = body?.customerName || accountProfile?.fullName || sessionUser?.fullName || effectiveCompany || "";
  const effectiveCustomerEmail = body?.customerEmail || accountProfile?.email || sessionUser?.email || "";
  const shippingCost = Number(body?.shippingCost || 0);
  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: body?.shippingName || "Versandkosten",
          description: "Standard Versand"
        },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });
  }

  const stripeDiscount = couponDiscount > 0
    ? await stripe.coupons.create({
        amount_off: Math.round(couponDiscount * 100),
        currency: "eur",
        duration: "once",
        name: `Gutschein ${normalizedCouponCode}`
      })
    : null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "de",
    customer_email: effectiveCustomerEmail || undefined,
    billing_address_collection: "required",
    line_items: lineItems,
    discounts: stripeDiscount ? [{ coupon: stripeDiscount.id }] : undefined,
    success_url: `${origin}/checkout/erfolg?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/warenkorb?status=abgebrochen`,
    metadata: {
      notes: body?.notes?.trim() || "-",
      deliveryMethod: body?.deliveryMethod === "abholung" ? "abholung" : "versand",
      printCheckRequested: items.some((item) => item.printCheckRequested) ? "yes" : "no",
      customerName: effectiveCustomerName,
      customerEmail: effectiveCustomerEmail,
      company: effectiveCompany,
      phone: accountProfile?.phone || sessionUser?.phone || "",
      vatId: effectiveVatId,
      billingAddress: effectiveBillingAddress,
      shippingAddress: effectiveShippingAddress,
      shippingCost: String(shippingCost),
      shippingName: body?.shippingName || "",
      processingFee: String(processingFee),
      couponCode: normalizedCouponCode,
      couponDiscount: String(couponDiscount),
      legalAcceptedAt: new Date().toISOString(),
      printApprovalAcceptedAt: new Date().toISOString()
    }
  });

  if (!session.url) {
    return NextResponse.json({ message: "Stripe-Checkout konnte nicht gestartet werden." }, { status: 500 });
  }

  await fs.mkdir(checkoutItemsDir, { recursive: true });
  await fs.writeFile(path.join(checkoutItemsDir, `${session.id}.json`), JSON.stringify({
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      slug: item.slug,
      name: item.name,
      category: item.category,
      quantity: Math.max(1, item.quantity || 1),
      unitPrice: item.unitPrice ?? 0,
      config: item.config ?? {},
      printCheckRequested: item.printCheckRequested ?? false,
      printCheckFee: item.printCheckFee ?? 0,
      printCheckFileName: item.printCheckFileName,
      printCheckFileUrl: item.printCheckFileUrl
    }))
  }, null, 2), "utf8");

  return NextResponse.json({ url: session.url });
}
