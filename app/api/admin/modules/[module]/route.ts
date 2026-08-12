import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { writeAuditLog } from "@/lib/admin-audit";
import { bulkDeleteSchema, listQuerySchema, moduleCreateSchemas } from "@/lib/admin-schemas";
import { requireModulePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { createVoucherPdf } from "@/lib/voucher-pdf";
import type { AdminModuleKey } from "@/types/admin";
import { deleteCategory, deleteIndustry, deleteProduct, getCategories, getIndustries, getProducts, upsertCategory, upsertIndustry, upsertProduct } from "@/lib/catalog-repository";
import { deleteStudentArticles, getStudentArticles, upsertStudentArticle } from "@/lib/student-content";

const supportedModules: AdminModuleKey[] = [
  "orders",
  "quotes",
  "invoices",
  "fileUploads",
  "coupons",
  "reviews",
  "newsletter",
  "newsletterCampaigns",
  "shipping",
  "paymentMethods",
  "usersRoles",
  "emailTemplates",
  "activityLogs",
  "backups",
  "security",
  "categories",
  "industries",
  "products",
  "studentArticles",
  "studentVerifications",
  "audit",
  "crm-pending"
];

function isSupportedModule(value: string): value is AdminModuleKey {
  return supportedModules.includes(value as AdminModuleKey);
}

function generateVoucherCode() {
  return `DUD-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function uniqueVoucherCode(input?: string) {
  const normalized = input?.trim().toUpperCase();
  if (normalized) return normalized;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateVoucherCode();
    const exists = await prisma.coupon.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `DUD-${Date.now().toString(36).toUpperCase()}`;
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.adminInvoice.count({
    where: {
      OR: [
        { id: { startsWith: `RE-${year}-` } },
        { invoiceNumber: { startsWith: `RE-${year}-` } }
      ]
    }
  });
  return `RE-${year}-${String(count + 1).padStart(4, "0")}`;
}

function assertSmtpConfig() {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;
  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error("SMTP ist nicht konfiguriert. Bitte SMTP_HOST, SMTP_USER, SMTP_PASS und SMTP_FROM_EMAIL einrichten.");
  }
  return { smtpHost, smtpUser, smtpPass, smtpPort, fromEmail };
}

async function sendNewsletterCampaign(input: {
  subject: string;
  preheader?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}) {
  const smtp = assertSmtpConfig();
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" }
  });
  if (subscribers.length === 0) {
    throw new Error("Keine aktiven Newsletter-Kontakte vorhanden.");
  }

  const company = await prisma.companyInformation.findUnique({ where: { id: "company" } });
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtp.smtpHost,
    port: smtp.smtpPort,
    secure: smtp.smtpPort === 465,
    auth: { user: smtp.smtpUser, pass: smtp.smtpPass }
  });
  const plainFooter = `\n\n--\n${company?.name || "DUD Studio"}\nSie erhalten diese E-Mail, weil Sie als Newsletter-Kontakt aktiv sind.`;
  const cta = input.ctaUrl
    ? `\n\n${input.ctaLabel || "Mehr erfahren"}: ${input.ctaUrl}`
    : "";

  for (const subscriber of subscribers) {
    await transporter.sendMail({
      from: smtp.fromEmail,
      to: subscriber.email,
      subject: input.subject,
      text: `${input.preheader ? `${input.preheader}\n\n` : ""}${input.body}${cta}${plainFooter}`
    });
  }

  return subscribers.length;
}

async function sendVoucherEmail(input: {
  to: string;
  customer: string;
  coupon: {
    code: string;
    discountType: string;
    discountValue: number;
    endsAt: Date | null;
  };
}) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP ist nicht konfiguriert. Gutschein wurde erstellt, E-Mail konnte nicht gesendet werden.");
  }

  const company = await prisma.companyInformation.findUnique({ where: { id: "company" } });
  const pdf = await createVoucherPdf({
    code: input.coupon.code,
    discountType: input.coupon.discountType,
    discountValue: input.coupon.discountValue,
    customer: input.customer,
    email: input.to,
    validUntil: input.coupon.endsAt,
    company
  });
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;
  await transporter.sendMail({
    from: fromEmail,
    to: input.to,
    subject: `Ihr Gutschein ${input.coupon.code}`,
    text: `Guten Tag,\n\nanbei finden Sie Ihren Gutschein ${input.coupon.code} von druck&design studio.\n\nFreundliche Grüße\n${company?.name || "druck&design studio"}`,
    attachments: [{
      filename: `gutschein-${input.coupon.code}.pdf`,
      content: Buffer.from(pdf),
      contentType: "application/pdf"
    }]
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ module: string }> }) {
  await ensureAdminBootstrap();
  const { module } = await params;
  if (!isSupportedModule(module)) {
    return NextResponse.json({ message: "Unsupported module." }, { status: 404 });
  }

  const permission = await requireModulePermission(module, "view");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const url = new URL(request.url);
  const listQuery = listQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined
  });
  if (!listQuery.success) {
    return NextResponse.json({ message: "Invalid query." }, { status: 400 });
  }
  const { q, status, page, pageSize } = listQuery.data;
  const skip = (page - 1) * pageSize;
  const containsQ = q ? { contains: q } : undefined;

  if (module === "orders") {
    const where: Prisma.AdminOrderWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { OR: [{ id: containsQ }, { customer: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.adminOrder.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.adminOrder.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "quotes") {
    const where: Prisma.AdminQuoteWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { OR: [{ customer: containsQ }, { email: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.adminQuote.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.adminQuote.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "invoices") {
    const crmUrl = process.env.CRM_API_URL;
    const crmToken = process.env.CRM_API_TOKEN;
    const crmSyncPath = path.join(process.cwd(), "data", "crm-invoice-sync.json");
    const canFetchCrmList = Boolean(crmUrl && crmToken && !/shop_order_create\.php/i.test(crmUrl));

    let crmInvoices: any[] = [];
    if (canFetchCrmList) {
      try {
        const crmRes = await fetch(String(crmUrl), {
          headers: {
            "Authorization": `Bearer ${String(crmToken)}`,
            "Content-Type": "application/json"
          }
        });
        if (crmRes.ok) {
          const payload = await crmRes.json() as any;
          crmInvoices = Array.isArray(payload) ? payload : (payload && typeof payload === 'object' && Array.isArray(payload.items) ? payload.items : []);
        }
      } catch (e) {
        console.error("CRM API Error:", e);
      }
    }

    const where: Prisma.AdminInvoiceWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { OR: [{ id: containsQ }, { customer: containsQ }] } : {}
      ]
    };
    const [localInvoices, paidOrders, syncRowsRaw] = await Promise.all([
      prisma.adminInvoice.findMany({ where, orderBy: { issuedAt: "desc" } }),
      prisma.adminOrder.findMany({
        where: { status: { in: ["Bezahlt", "Paid"] } },
        select: { id: true, customer: true, total: true, createdAt: true, status: true }
      }),
      fs.readFile(crmSyncPath, "utf8").catch(() => "[]")
    ]);

    const paidOrderIds = new Set(paidOrders.map((order) => order.id));
    const paidOrdersById = new Map(paidOrders.map((order) => [order.id, order]));
    let syncRows: Array<{ orderId?: string; invoiceId?: string; invoiceNumber?: string }> = [];
    try {
      syncRows = JSON.parse(syncRowsRaw) as Array<{ orderId?: string; invoiceId?: string; invoiceNumber?: string }>;
    } catch {
      syncRows = [];
    }
    const invoiceToOrder = new Map<string, string>();
    for (const row of syncRows) {
      const invoiceId = String(row.invoiceId ?? "").trim();
      const orderId = String(row.orderId ?? "").trim();
      if (invoiceId && orderId) {
        invoiceToOrder.set(invoiceId, orderId);
      }
    }

    const crmMapped = crmInvoices.map((invoice) => {
      const invoiceId = String(invoice?.invoice_id || invoice?.id || "");
      const mappedOrderId = invoiceToOrder.get(invoiceId);
      const statusRaw = String(invoice?.status ?? "").trim();
      const isPaidByOrder = mappedOrderId ? paidOrderIds.has(mappedOrderId) : false;
      const status = isPaidByOrder ? "Bezahlt" : statusRaw;
      return {
        ...invoice,
        id: invoiceId,
        orderId: mappedOrderId,
        status: status || "Bezahlt",
        source: "crm"
      };
    });

    const syncedFromOrders = syncRows
      .filter((row) => {
        const orderId = String(row.orderId ?? "").trim();
        return Boolean(orderId && paidOrderIds.has(orderId));
      })
      .map((row) => {
        const orderId = String(row.orderId ?? "").trim();
        const paidOrder = paidOrdersById.get(orderId);
        return {
          id: String(row.invoiceId ?? orderId),
          invoice_id: String(row.invoiceId ?? orderId),
          invoice_number: (row as any).invoiceNumber ?? "",
          customer: paidOrder?.customer ?? "",
          amount: Number(paidOrder?.total ?? 0),
          total: Number(paidOrder?.total ?? 0),
          issuedAt: paidOrder?.createdAt?.toISOString?.() ?? null,
          createdAt: paidOrder?.createdAt?.toISOString?.() ?? null,
          status: "Bezahlt",
          orderId,
          source: "sync"
        };
      });

    const deduped = new Map<string, Record<string, unknown>>();
    const merged = [
      ...crmMapped,
      ...localInvoices.map((i) => ({ ...i, source: "local" })),
      ...syncedFromOrders
    ];
    for (const item of merged) {
      const key = String((item as { id?: unknown }).id ?? "");
      if (!key || deduped.has(key)) continue;
      deduped.set(key, item as Record<string, unknown>);
    }
    const allInvoices = Array.from(deduped.values());

    const filtered = q || status 
      ? allInvoices.filter(item => {
          const matchQ = q ? JSON.stringify(item).toLowerCase().includes(q.toLowerCase()) : true;
          const matchStatus = status ? String(item.status).toLowerCase() === status.toLowerCase() : true;
          return matchQ && matchStatus;
        })
      : allInvoices;

    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "categories") {
    const all = await getCategories();
    const filtered = q 
      ? all.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.toLowerCase().includes(q.toLowerCase()))
      : all;
    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "industries") {
    const all = await getIndustries();
    const filtered = q
      ? all.filter((industry) => industry.name.toLowerCase().includes(q.toLowerCase()) || industry.slug.toLowerCase().includes(q.toLowerCase()))
      : all;
    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "products") {
    const all = await getProducts();
    const filtered = q 
      ? all.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase()))
      : all;
    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "studentArticles") {
    const all = await getStudentArticles({ includeDrafts: true });
    const filtered = q
      ? all.filter((article) => `${article.title} ${article.slug} ${article.category}`.toLowerCase().includes(q.toLowerCase()))
      : all;
    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize).map((item) => ({ ...item, id: item.slug })),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "studentVerifications") {
    const users = await prisma.customerAccount.findMany({ orderBy: { updatedAt: "desc" } });
    const mapped = users
      .map((row) => {
        const data = row.data as Record<string, any>;
        const verification = data.studentVerification as Record<string, any> | undefined;
        return verification ? {
          id: row.id,
          email: row.email,
          fullName: data.fullName ?? "",
          university: verification.university ?? "",
          status: verification.status ?? "pending",
          validUntil: verification.validUntil ?? "",
          submittedAt: verification.submittedAt ?? "",
          reviewedAt: verification.reviewedAt ?? "",
          reviewNote: verification.reviewNote ?? "",
          documentPath: verification.documentPath ?? ""
        } : null;
      })
      .filter(Boolean) as Array<Record<string, unknown>>;
    const filtered = q
      ? mapped.filter((item) => JSON.stringify(item).toLowerCase().includes(q.toLowerCase()))
      : mapped;
    return NextResponse.json({
      items: filtered.slice(skip, skip + pageSize),
      total: filtered.length,
      page,
      pageSize
    });
  }

  if (module === "crm-pending") {
    const crmPendingPath = path.join(process.cwd(), "data", "crm-pending-orders.json");
    try {
      const raw = await fs.readFile(crmPendingPath, "utf8").catch(() => "[]");
      const items = JSON.parse(raw) as any[];
      return NextResponse.json({
        items: items.slice(skip, skip + pageSize),
        total: items.length,
        page,
        pageSize
      });
    } catch {
      return NextResponse.json({ items: [], total: 0, page, pageSize });
    }
  }

  if (module === "fileUploads") {
    const where: Prisma.ContactFileUploadWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { OR: [{ name: containsQ }, { email: containsQ }, { topic: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.contactFileUpload.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.contactFileUpload.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "coupons") {
    const where: Prisma.CouponWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { code: containsQ } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.coupon.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "reviews") {
    const where: Prisma.ReviewWhereInput = {
      AND: [
        status ? { published: status === "published" } : {},
        q ? { OR: [{ customer: containsQ }, { comment: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.review.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.review.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "newsletter") {
    const where: Prisma.NewsletterSubscriberWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { email: containsQ } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.newsletterSubscriber.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "newsletterCampaigns") {
    const where: Prisma.NewsletterCampaignWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { OR: [{ subject: containsQ }, { body: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.newsletterCampaign.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.newsletterCampaign.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "shipping") {
    const where: Prisma.ShippingMethodWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { name: containsQ } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.shippingMethod.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.shippingMethod.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "paymentMethods") {
    const where: Prisma.PaymentMethodWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { OR: [{ name: containsQ }, { provider: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.paymentMethod.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.paymentMethod.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "usersRoles") {
    const where: Prisma.AdminUserWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { OR: [{ email: containsQ }, { name: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.adminUser.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" }, include: { role: true } }),
      prisma.adminUser.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "emailTemplates") {
    const where: Prisma.EmailTemplateWhereInput = {
      AND: [
        status ? { active: status === "active" } : {},
        q ? { OR: [{ key: containsQ }, { subject: containsQ }] } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.emailTemplate.findMany({ where, skip, take: pageSize, orderBy: { updatedAt: "desc" } }),
      prisma.emailTemplate.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "activityLogs") {
    const where: Prisma.AuditLogWhereInput = q
      ? { OR: [{ module: containsQ }, { action: containsQ }, { actorEmail: containsQ }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.auditLog.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  if (module === "backups") {
    const where: Prisma.BackupRecordWhereInput = {
      AND: [
        status ? { status } : {},
        q ? { label: containsQ } : {}
      ]
    };
    const [items, total] = await Promise.all([
      prisma.backupRecord.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
      prisma.backupRecord.count({ where })
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  }

  const where: Prisma.SecurityEventWhereInput = q ? { OR: [{ level: containsQ }, { event: containsQ }] } : {};
  const [items, total] = await Promise.all([
    prisma.securityEvent.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.securityEvent.count({ where })
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  await ensureAdminBootstrap();
  const { module } = await params;
  if (!isSupportedModule(module) || module === "activityLogs" || module === "fileUploads") {
    return NextResponse.json({ message: "Unsupported module." }, { status: 404 });
  }

  const permission = await requireModulePermission(module, "create");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const body = await request.json().catch(() => null);
  if (module === "quotes") {
    const parsed = moduleCreateSchemas.quotes.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.adminQuote.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "invoices") {
    const parsed = moduleCreateSchemas.invoices.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const invoiceNumber = parsed.data.invoiceNumber?.trim() || parsed.data.id?.trim() || await nextInvoiceNumber();
    const item = await prisma.adminInvoice.create({
      data: {
        id: invoiceNumber,
        customer: parsed.data.customer,
        email: parsed.data.email || null,
        invoiceNumber,
        amount: parsed.data.amount,
        status: parsed.data.status,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
      }
    });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "coupons") {
    const parsed = moduleCreateSchemas.coupons.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const { recipientEmail, recipientName, deliverToDashboard, sendPdfEmail, ...couponData } = parsed.data;
    const code = await uniqueVoucherCode(couponData.code);
    const item = await prisma.coupon.create({
      data: {
        ...couponData,
        code,
        startsAt: couponData.startsAt ? new Date(couponData.startsAt) : null,
        endsAt: couponData.endsAt ? new Date(couponData.endsAt) : null
      }
    });
    const normalizedEmail = recipientEmail?.trim().toLowerCase() || "";
    let deliveryError: string | undefined;
    if (normalizedEmail && (deliverToDashboard || sendPdfEmail)) {
      const customer = recipientName?.trim() || normalizedEmail;
      await prisma.adminInvoice.upsert({
        where: { id: `GUT-${item.id}` },
        update: {
          customer,
          email: normalizedEmail,
          invoiceNumber: item.code,
          amount: item.discountValue,
          status: "Gutschein",
          source: "coupon"
        },
        create: {
          id: `GUT-${item.id}`,
          customer,
          email: normalizedEmail,
          invoiceNumber: item.code,
          amount: item.discountValue,
          status: "Gutschein",
          source: "coupon"
        }
      });
      if (sendPdfEmail) {
        try {
          await sendVoucherEmail({
            to: normalizedEmail,
            customer,
            coupon: item
          });
        } catch (error) {
          deliveryError = error instanceof Error ? error.message : "Gutschein-E-Mail konnte nicht gesendet werden.";
        }
      }
    }
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: { ...couponData, recipientEmail: normalizedEmail || undefined, deliverToDashboard, sendPdfEmail, deliveryError } });
    return NextResponse.json({ ...item, deliveryError });
  }
  if (module === "reviews") {
    const parsed = moduleCreateSchemas.reviews.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.review.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "newsletter") {
    const parsed = moduleCreateSchemas.newsletter.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.newsletterSubscriber.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "newsletterCampaigns") {
    const parsed = moduleCreateSchemas.newsletterCampaigns.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    let recipientCount = 0;
    let sentAt: Date | null = null;
    if (parsed.data.status === "sent") {
      try {
        recipientCount = await sendNewsletterCampaign(parsed.data);
        sentAt = new Date();
      } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : "Newsletter konnte nicht gesendet werden." }, { status: 400 });
      }
    }
    const item = await prisma.newsletterCampaign.create({
      data: {
        ...parsed.data,
        ctaUrl: parsed.data.ctaUrl || null,
        recipientCount,
        sentAt
      }
    });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "shipping") {
    const parsed = moduleCreateSchemas.shipping.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.shippingMethod.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "paymentMethods") {
    const parsed = moduleCreateSchemas.paymentMethods.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.paymentMethod.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "usersRoles") {
    const parsed = moduleCreateSchemas.usersRoles.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.adminUser.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        roleId: parsed.data.roleId,
        active: parsed.data.active
      }
    });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "emailTemplates") {
    const parsed = moduleCreateSchemas.emailTemplates.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.emailTemplate.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "backups") {
    const parsed = moduleCreateSchemas.backups.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await prisma.backupRecord.create({ data: parsed.data });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "categories") {
    const parsed = moduleCreateSchemas.categories.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await upsertCategory(parsed.data as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.slug, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "industries") {
    const item = await upsertIndustry(body as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.slug, payload: body });
    return NextResponse.json(item);
  }
  if (module === "products") {
    const parsed = moduleCreateSchemas.products.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await upsertProduct(parsed.data as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.slug, payload: parsed.data });
    return NextResponse.json(item);
  }
  if (module === "studentArticles") {
    const parsed = moduleCreateSchemas.studentArticles.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await upsertStudentArticle(parsed.data as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.slug, payload: parsed.data });
    return NextResponse.json({ ...item, id: item.slug });
  }
  const parsed = moduleCreateSchemas.security.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  const item = await prisma.securityEvent.create({ data: parsed.data });
  await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "create", entityId: item.id, payload: parsed.data });
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: { params: Promise<{ module: string }> }) {
  await ensureAdminBootstrap();
  const { module } = await params;
  if (!isSupportedModule(module)) {
    return NextResponse.json({ message: "Unsupported module." }, { status: 404 });
  }
  const permission = await requireModulePermission(module, "update");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }
  const payload = await request.json().catch(() => null) as { id?: string; data?: Record<string, unknown> } | null;
  if (!payload?.id || !payload?.data) {
    return NextResponse.json({ message: "Missing id/data payload." }, { status: 400 });
  }

  const data = payload.data;
  if (module === "categories") {
    const item = await upsertCategory(data as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.slug, payload: data });
    return NextResponse.json(item);
  }
  if (module === "industries") {
    const item = await upsertIndustry(data as any, payload.id);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.slug, payload: data });
    return NextResponse.json(item);
  }
  if (module === "products") {
    const item = await upsertProduct(data as any);
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.slug, payload: data });
    return NextResponse.json(item);
  }
  if (module === "studentArticles") {
    const parsed = moduleCreateSchemas.studentArticles.safeParse(data);
    if (!parsed.success) return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
    const item = await upsertStudentArticle({ ...(parsed.data as any), slug: String(data.slug || payload.id) });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.slug, payload: data });
    return NextResponse.json({ ...item, id: item.slug });
  }
  if (module === "studentVerifications") {
    const user = await prisma.customerAccount.findUnique({ where: { id: payload.id } });
    if (!user) return NextResponse.json({ message: "Benutzer nicht gefunden." }, { status: 404 });
    const userData = user.data as Record<string, any>;
    const current = userData.studentVerification as Record<string, any> | undefined;
    const nextVerification: Record<string, any> = {
      ...(current ?? {}),
      status: typeof data.status === "string" ? data.status : current?.status ?? "pending",
      validUntil: typeof data.validUntil === "string" ? data.validUntil : current?.validUntil ?? "",
      reviewNote: typeof data.reviewNote === "string" ? data.reviewNote : current?.reviewNote ?? "",
      reviewedAt: new Date().toISOString(),
      reviewedBy: permission.sessionUser.email
    };
    const nextData = { ...userData, studentVerification: nextVerification };
    await prisma.customerAccount.update({ where: { id: payload.id }, data: { data: nextData as Prisma.InputJsonValue } });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: payload.id, payload: nextVerification });
    return NextResponse.json({
      id: payload.id,
      email: user.email,
      fullName: userData.fullName ?? "",
      university: nextVerification.university ?? "",
      status: nextVerification.status,
      validUntil: nextVerification.validUntil ?? "",
      reviewedAt: nextVerification.reviewedAt,
      reviewNote: nextVerification.reviewNote ?? "",
      documentPath: nextVerification.documentPath ?? ""
    });
  }
  if (module === "orders") {
    const item = await prisma.adminOrder.update({ where: { id: payload.id }, data: data as Prisma.AdminOrderUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "quotes") {
    const item = await prisma.adminQuote.update({ where: { id: payload.id }, data: data as Prisma.AdminQuoteUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "invoices") {
    const dataWithDate = { ...data };
    if (typeof dataWithDate.dueDate === "string") {
      dataWithDate.dueDate = dataWithDate.dueDate ? new Date(dataWithDate.dueDate) : null;
    }
    if (typeof dataWithDate.invoiceNumber === "string" && dataWithDate.invoiceNumber.trim()) {
      dataWithDate.invoiceNumber = dataWithDate.invoiceNumber.trim();
    }
    const item = await prisma.adminInvoice.update({ where: { id: payload.id }, data: dataWithDate as Prisma.AdminInvoiceUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "fileUploads") {
    const item = await prisma.contactFileUpload.update({ where: { id: payload.id }, data: data as Prisma.ContactFileUploadUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "coupons") {
    const couponData = { ...data };
    if (typeof couponData.code === "string") couponData.code = await uniqueVoucherCode(couponData.code);
    if (typeof couponData.startsAt === "string") couponData.startsAt = couponData.startsAt ? new Date(couponData.startsAt) : null;
    if (typeof couponData.endsAt === "string") couponData.endsAt = couponData.endsAt ? new Date(couponData.endsAt) : null;
    const item = await prisma.coupon.update({ where: { id: payload.id }, data: couponData as Prisma.CouponUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "reviews") {
    const item = await prisma.review.update({ where: { id: payload.id }, data: data as Prisma.ReviewUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "newsletter") {
    const item = await prisma.newsletterSubscriber.update({ where: { id: payload.id }, data: data as Prisma.NewsletterSubscriberUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "newsletterCampaigns") {
    const dataWithSendState = { ...data };
    if (dataWithSendState.ctaUrl === "") dataWithSendState.ctaUrl = null;
    if (dataWithSendState.status === "sent") {
      const current = await prisma.newsletterCampaign.findUnique({ where: { id: payload.id } });
      if (!current?.sentAt) {
        try {
          const recipientCount = await sendNewsletterCampaign({
            subject: typeof dataWithSendState.subject === "string" ? dataWithSendState.subject : current?.subject ?? "",
            preheader: typeof dataWithSendState.preheader === "string" ? dataWithSendState.preheader : current?.preheader,
            body: typeof dataWithSendState.body === "string" ? dataWithSendState.body : current?.body ?? "",
            ctaLabel: typeof dataWithSendState.ctaLabel === "string" ? dataWithSendState.ctaLabel : current?.ctaLabel,
            ctaUrl: typeof dataWithSendState.ctaUrl === "string" ? dataWithSendState.ctaUrl : current?.ctaUrl
          });
          dataWithSendState.recipientCount = recipientCount;
          dataWithSendState.sentAt = new Date();
          dataWithSendState.lastError = null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Newsletter konnte nicht gesendet werden.";
          await prisma.newsletterCampaign.update({ where: { id: payload.id }, data: { lastError: message } });
          return NextResponse.json({ message }, { status: 400 });
        }
      }
    }
    const item = await prisma.newsletterCampaign.update({ where: { id: payload.id }, data: dataWithSendState as Prisma.NewsletterCampaignUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "shipping") {
    const item = await prisma.shippingMethod.update({ where: { id: payload.id }, data: data as Prisma.ShippingMethodUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "paymentMethods") {
    const item = await prisma.paymentMethod.update({ where: { id: payload.id }, data: data as Prisma.PaymentMethodUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "usersRoles") {
    const item = await prisma.adminUser.update({ where: { id: payload.id }, data: data as Prisma.AdminUserUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "emailTemplates") {
    const item = await prisma.emailTemplate.update({ where: { id: payload.id }, data: data as Prisma.EmailTemplateUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "backups") {
    const item = await prisma.backupRecord.update({ where: { id: payload.id }, data: data as Prisma.BackupRecordUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  if (module === "security") {
    const item = await prisma.securityEvent.update({ where: { id: payload.id }, data: data as Prisma.SecurityEventUpdateInput });
    await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "update", entityId: item.id, payload: data });
    return NextResponse.json(item);
  }
  return NextResponse.json({ message: "Update not supported." }, { status: 405 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ module: string }> }) {
  await ensureAdminBootstrap();
  const { module } = await params;
  if (!isSupportedModule(module) || module === "activityLogs") {
    return NextResponse.json({ message: "Unsupported module." }, { status: 404 });
  }
  const permission = await requireModulePermission(module, "delete");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }
  const { ids } = parsed.data;

  if (module === "orders") await prisma.adminOrder.deleteMany({ where: { id: { in: ids } } });
  else if (module === "categories") {
    for (const id of ids) await deleteCategory(id);
  }
  else if (module === "industries") {
    for (const id of ids) await deleteIndustry(id);
  }
  else if (module === "products") {
    for (const id of ids) await deleteProduct(id);
  }
  else if (module === "studentArticles") await deleteStudentArticles(ids);
  else if (module === "quotes") await prisma.adminQuote.deleteMany({ where: { id: { in: ids } } });
  else if (module === "invoices") await prisma.adminInvoice.deleteMany({ where: { id: { in: ids } } });
  else if (module === "fileUploads") await prisma.contactFileUpload.deleteMany({ where: { id: { in: ids } } });
  else if (module === "coupons") await prisma.coupon.deleteMany({ where: { id: { in: ids } } });
  else if (module === "reviews") await prisma.review.deleteMany({ where: { id: { in: ids } } });
  else if (module === "newsletter") await prisma.newsletterSubscriber.deleteMany({ where: { id: { in: ids } } });
  else if (module === "newsletterCampaigns") await prisma.newsletterCampaign.deleteMany({ where: { id: { in: ids } } });
  else if (module === "shipping") await prisma.shippingMethod.deleteMany({ where: { id: { in: ids } } });
  else if (module === "paymentMethods") await prisma.paymentMethod.deleteMany({ where: { id: { in: ids } } });
  else if (module === "usersRoles") await prisma.adminUser.deleteMany({ where: { id: { in: ids } } });
  else if (module === "emailTemplates") await prisma.emailTemplate.deleteMany({ where: { id: { in: ids } } });
  else if (module === "backups") await prisma.backupRecord.deleteMany({ where: { id: { in: ids } } });
  else if (module === "security") await prisma.securityEvent.deleteMany({ where: { id: { in: ids } } });

  await writeAuditLog({ actorEmail: permission.sessionUser.email, module, action: "bulk-delete", payload: { ids } });
  return NextResponse.json({ success: true, deleted: ids.length });
}
