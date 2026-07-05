import { NextResponse } from "next/server";
import Stripe from "stripe";
import { promises as fs } from "fs";
import path from "path";
import { getOrders, saveOrder } from "@/lib/catalog-repository";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { createCRMInvoice } from "@/lib/crm";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Order } from "@/types";
import { LEGAL_DOCUMENT_FOOTER } from "@/lib/legal";

function parseStackLocation(error: unknown) {
  if (!(error instanceof Error) || !error.stack) {
    return null;
  }

  const stackLine = error.stack.split("\n")[1]?.trim();
  return stackLine || null;
}

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const crmApiUrl = process.env.CRM_API_URL?.trim();
  const crmApiToken = process.env.CRM_API_TOKEN?.trim();

  logger.info(
    {
      stripeSecretExists: Boolean(stripeSecret),
      stripeWebhookSecretExists: Boolean(webhookSecret),
      crmApiUrl: crmApiUrl || null,
      crmApiTokenExists: Boolean(crmApiToken)
    },
    "Stripe webhook request received with environment diagnostics"
  );

  if (!stripeSecret || !webhookSecret) {
    const detail = `Missing required Stripe environment variables. STRIPE_SECRET_KEY exists=${Boolean(stripeSecret)}, STRIPE_WEBHOOK_SECRET exists=${Boolean(webhookSecret)}.`;
    logger.error({ detail }, "Stripe webhook configuration error");
    return NextResponse.json(
      {
        message: "Stripe webhook configuration error.",
        detail
      },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logger.error("Stripe signature header is missing");
    return NextResponse.json({ message: "Stripe-Signatur fehlt." }, { status: 400 });
  }

  const payload = await request.text();
  logger.info(
    {
      signatureHeaderPresent: Boolean(signature),
      payloadLength: payload.length
    },
    "Stripe signature validation step started"
  );
  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    logger.info({ eventType: event.type, eventId: event.id }, "Stripe event parsed successfully");
  } catch (error) {
    logger.error(
      {
        err: error,
        stack: error instanceof Error ? error.stack : undefined,
        stackLocation: parseStackLocation(error)
      },
      "Stripe signature validation or event parsing failed"
    );
    return NextResponse.json(
      {
        message: "Ungültige Stripe-Signatur oder Event-Parsing fehlgeschlagen.",
        detail: error instanceof Error ? error.message : String(error),
        stackLocation: parseStackLocation(error)
      },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      logger.info(
        {
          eventType: event.type,
          eventId: event.id,
          stripeSessionId: session.id,
          paymentStatus: session.payment_status,
          customerDetails: session.customer_details,
          metadata: session.metadata
        },
        "Processing checkout.session.completed"
      );
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        logger.info({ stripeSessionId: session.id, paymentStatus: session.payment_status }, "Skipping unpaid checkout session");
        return NextResponse.json({ received: true });
      }

      const orderId = `STRIPE-${session.id}`;
      const orders = await getOrders();
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }).catch(err => {
        logger.warn({ stripeSessionId: session.id, err }, "Failed to fetch line items from Stripe, using fallback empty list");
        return { data: [] };
      });
      
      logger.info({ stripeSessionId: session.id, lineItemsCount: lineItems.data.length }, "Retrieved line items from Stripe");
      const items: Order["items"] = lineItems.data.map((line, index) => {
        const quantity = line.quantity || 1;
        const unitPrice = (line.price?.unit_amount ?? line.amount_total ?? 0) / 100;
        
        return {
          id: `${session.id}-${index + 1}`,
          productSlug: (line.description || `item-${index + 1}`).toLowerCase().replace(/\s+/g, "-"),
          name: line.description || `Produkt ${index + 1}`,
          quantity: quantity,
          price: unitPrice,
          config: {
            checkout_session: session.id,
            zahlung: "stripe",
            description: line.description || "",
            AGB: session.metadata?.legalAcceptedAt ? `Akzeptiert am ${session.metadata.legalAcceptedAt}` : "Nicht dokumentiert",
            Druckfreigabe: session.metadata?.printApprovalAcceptedAt ? `Erteilt am ${session.metadata.printApprovalAcceptedAt}` : "Nicht dokumentiert"
          }
        };
      });

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const order: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        items,
        total,
        company: session.metadata?.company || undefined,
        vatId: session.metadata?.vatId || undefined,
        billingAddress: session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : undefined),
        shippingAddress: session.metadata?.shippingAddress || session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : undefined),
        shippingCost: session.metadata?.shippingCost ? Number(session.metadata.shippingCost) : undefined,
        shippingName: session.metadata?.shippingName || undefined,
        processingFee: session.metadata?.processingFee ? Number(session.metadata.processingFee) : undefined,
        customerName: session.metadata?.customerName || session.customer_details?.name || undefined,
        customerEmail: session.customer_details?.email || session.customer_email || undefined,
      };

      const orderExists = orders.some((existing) => existing.id === orderId);
      if (!orderExists) {
        await saveOrder(order);
        logger.info({ orderId, stripeSessionId: session.id, total }, "Saved Stripe order locally");
      } else {
        logger.info({ orderId, stripeSessionId: session.id }, "Order already exists locally; continuing with CRM sync check");
      }

      let customerName = session.metadata?.customerName?.trim() || session.customer_details?.name?.trim() || "Webshop Kunde";
      let customerEmail = session.metadata?.customerEmail?.trim() || session.customer_details?.email?.trim() || session.customer_email?.trim();

      // If we still don't have name/email from customer_details, check the customer object
      if ((!customerEmail || customerName === "Webshop Kunde") && typeof session.customer === "string" && !session.customer.startsWith("cus_test_")) {
        logger.info(
          { stripeSessionId: session.id, customerId: session.customer, hasEmail: !!customerEmail, name: customerName },
          "Customer details incomplete on session, retrieving Stripe customer object"
        );
        try {
          const customer = await stripe.customers.retrieve(session.customer);
          if (!customer.deleted) {
            if (!customerEmail && customer.email) {
              customerEmail = customer.email.trim();
              logger.info({ stripeSessionId: session.id, customerEmail }, "Updated customer email from Stripe customer object");
            }
            if (customerName === "Webshop Kunde" && customer.name?.trim()) {
              customerName = customer.name.trim();
              logger.info({ stripeSessionId: session.id, customerName }, "Updated customer name from Stripe customer object");
            }
          }
        } catch (retrieveError) {
          logger.error({ err: retrieveError, stripeSessionId: session.id, customerId: session.customer }, "Failed to retrieve customer from Stripe");
        }
      }

      // Fallback for name from billing if still missing
      await ensureAdminBootstrap();
      await prisma.adminOrder.upsert({
        where: { id: orderId },
        update: {
          customer: customerName,
          email: customerEmail,
          company: session.metadata?.company || null,
          vatId: session.metadata?.vatId || null,
          total,
          status: "Bezahlt",
          items: items as unknown as object,
          billingAddress: session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : null),
          shippingAddress: session.metadata?.shippingAddress || session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : null),
        },
        create: {
          id: orderId,
          customer: customerName,
          email: customerEmail,
          company: session.metadata?.company || null,
          vatId: session.metadata?.vatId || null,
          total,
          status: "Bezahlt",
          items: items as unknown as object,
          billingAddress: session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : null),
          shippingAddress: session.metadata?.shippingAddress || session.metadata?.billingAddress || (session.customer_details?.address ? JSON.stringify(session.customer_details.address) : null),
        }
      });
      logger.info({ orderId, stripeSessionId: session.id, total }, "Saved Stripe order in adminOrder");
      
      logger.info(
        {
          stripeSessionId: session.id,
          customerEmail: customerEmail || null,
          customerName: customerName
        },
        "Prepared customer details for CRM"
      );

      const crmSyncPath = path.join(process.cwd(), "data", "crm-invoice-sync.json");
      const readCrmSyncState = async () => {
        const raw = await fs.readFile(crmSyncPath, "utf8").catch(() => "[]");
        try {
          return JSON.parse(raw) as Array<{
            stripeSessionId: string;
            syncedAt: string;
            orderId: string;
            customerEmail?: string;
            invoiceId?: string;
            invoiceNumber?: string;
            pdfUrl?: string;
          }>;
        } catch {
          return [] as Array<{
            stripeSessionId: string;
            syncedAt: string;
            orderId: string;
            customerEmail?: string;
            invoiceId?: string;
            invoiceNumber?: string;
            pdfUrl?: string;
          }>;
        }
      };
      
      const writeCrmSyncState = async (
        rows: Array<{
          stripeSessionId: string;
          syncedAt: string;
          orderId: string;
          customerEmail?: string;
          invoiceId?: string;
          invoiceNumber?: string;
          pdfUrl?: string;
        }>
      ) => {
        await fs.mkdir(path.dirname(crmSyncPath), { recursive: true });
        await fs.writeFile(crmSyncPath, JSON.stringify(rows, null, 2), "utf8");
      };

      if (!customerEmail) {
        logger.warn({ stripeSessionId: session.id, customerName, metadata: session.metadata }, "CRM invoice aborted: missing customer email for Stripe session, order still saved.");
      } else {
        const persistedInvoice = await prisma.adminInvoice.findUnique({ where: { orderId } });
        if (persistedInvoice) {
          logger.info({ stripeSessionId: session.id, orderId, invoiceId: persistedInvoice.id }, "CRM invoice already persisted; skipping duplicate CRM call");
          return NextResponse.json({ received: true });
        }
        const syncState = await readCrmSyncState();
        const alreadySynced = syncState.some((entry) => entry.stripeSessionId === session.id);
        if (alreadySynced) {
          logger.info({ stripeSessionId: session.id, orderId }, "CRM invoice already synced; skipping duplicate CRM call");
          return NextResponse.json({ received: true });
        }

      const companyName = (session.metadata?.company || "").trim();
      const customerDisplay = companyName || customerName;
      const baseAddress = session.metadata?.billingAddress || (session.customer_details?.address ? `${session.customer_details.address.line1}, ${session.customer_details.address.postal_code} ${session.customer_details.address.city}` : "");
      const invoiceAddress = customerName ? `${baseAddress}\nz.H. ${customerName}` : baseAddress;

      const crmPayload = {
        customer: customerDisplay,
        email: customerEmail,
        company: companyName,
        vatId: session.metadata?.vatId || "",
        address: invoiceAddress,
        shipping_address: session.metadata?.shippingAddress || "",
        shipping_cost: session.metadata?.shippingCost ? Number(session.metadata.shippingCost) : 0,
        shipping_name: session.metadata?.shippingName || "",
        processing_fee: session.metadata?.processingFee ? Number(session.metadata.processingFee) : 0,
        footer_text: LEGAL_DOCUMENT_FOOTER,
        total: Number(total.toFixed(2)),
        items: items.map((item) => ({
          description: item.name,
          qty: item.quantity,
          price: Number(item.price.toFixed(2))
        }))
      };
        logger.info(
          {
            stripeSessionId: session.id,
            payload: crmPayload
          },
          "Calling createCRMInvoice with payload"
        );
        try {
          const crmInvoice = await createCRMInvoice(crmPayload);
          await prisma.adminInvoice.upsert({
            where: { id: crmInvoice.invoice_id },
            update: {
              customer: customerDisplay,
              email: customerEmail.toLowerCase(),
              orderId,
              externalInvoiceId: crmInvoice.invoice_id,
              invoiceNumber: crmInvoice.invoice_number,
              pdfUrl: crmInvoice.pdf_url,
              source: "crm",
              amount: Number(total.toFixed(2)),
              status: "Bezahlt"
            },
            create: {
              id: crmInvoice.invoice_id,
              customer: customerDisplay,
              email: customerEmail.toLowerCase(),
              orderId,
              externalInvoiceId: crmInvoice.invoice_id,
              invoiceNumber: crmInvoice.invoice_number,
              pdfUrl: crmInvoice.pdf_url,
              source: "crm",
              amount: Number(total.toFixed(2)),
              status: "Bezahlt"
            }
          });
          syncState.push({
            stripeSessionId: session.id,
            syncedAt: new Date().toISOString(),
            orderId,
            customerEmail,
            invoiceId: crmInvoice?.invoice_id ? String(crmInvoice.invoice_id) : undefined,
            invoiceNumber: crmInvoice?.invoice_number ? String(crmInvoice.invoice_number) : undefined,
            pdfUrl: crmInvoice.pdf_url
          });
          await writeCrmSyncState(syncState);
          logger.info({ sessionId: session.id, orderId, crmInvoice }, "CRM invoice created successfully");
        } catch (crmErr) {
          const crmErrDetail = crmErr instanceof Error ? {
            name: crmErr.name,
            message: crmErr.message,
            stack: crmErr.stack,
            ...(crmErr as any)
          } : crmErr;
          
          logger.error(
            { 
              err: crmErrDetail, 
              stripeSessionId: session.id,
              payload: crmPayload 
            }, 
            "CRM sync failed in Stripe webhook, but order was saved."
          );
        }
      }
    } catch (error) {
      logger.error(
        {
          err: error,
          stack: error instanceof Error ? error.stack : undefined,
          stackLocation: parseStackLocation(error),
          eventId: event.id
        },
        "checkout.session.completed processing failed"
      );
      return NextResponse.json(
        {
          message: "checkout.session.completed processing failed.",
          detail: error instanceof Error ? error.message : String(error),
          stackLocation: parseStackLocation(error)
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
