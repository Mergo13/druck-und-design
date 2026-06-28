import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { writeAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";

const ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_FROM_EMAIL",
  "CONTACT_NOTIFY_EMAIL",
  "PRODUCT_SELECTION_NOTIFY_EMAIL"
] as const;

type EnvKey = typeof ENV_KEYS[number];
const GA_ENV_KEYS = ["NEXT_PUBLIC_GA_MEASUREMENT_ID"] as const;
const MARKETING_ENV_KEYS = [
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_CLARITY_PROJECT_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "GOOGLE_SITE_VERIFICATION"
] as const;

function getEnvLocalPath() {
  return path.join(process.cwd(), ".env.local");
}

const crmSyncPath = path.join(process.cwd(), "data", "crm-invoice-sync.json");
type CrmSyncRow = {
  stripeSessionId: string;
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

async function callCrmInvoiceMutation(operation: "stornieren" | "delete", invoiceId?: string) {
  if (!invoiceId) {
    return { skipped: true as const, reason: "missing-invoice-id" };
  }

  const token = process.env.CRM_API_TOKEN?.trim();
  if (!token) {
    return { skipped: true as const, reason: "missing-crm-token" };
  }

  const cancelUrl = process.env.CRM_INVOICE_CANCEL_URL?.trim();
  const deleteUrl = process.env.CRM_INVOICE_DELETE_URL?.trim();
  const manageUrl = process.env.CRM_INVOICE_MANAGE_URL?.trim();
  const targetUrl = operation === "stornieren" ? (cancelUrl || manageUrl) : (deleteUrl || manageUrl);
  if (!targetUrl) {
    return { skipped: true as const, reason: "missing-crm-manage-url" };
  }

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      action: operation,
      invoice_id: invoiceId
    })
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(`CRM ${operation} failed (${response.status}): ${text.slice(0, 300)}`);
  }

  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return { skipped: false as const, payload };
}

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function setEnvValue(content: string, key: string, value: string) {
  const lines = content.split("\n");
  const next = `${key}=${value}`;
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index >= 0) {
    lines[index] = next;
  } else {
    lines.push(next);
  }
  return lines.join("\n");
}

function runtimeValues(keys: readonly string[], parsed: Record<string, string>) {
  return Object.fromEntries(keys.map((key) => [
    key,
    process.env.NODE_ENV === "production" ? (process.env[key] ?? "") : (parsed[key] ?? process.env[key] ?? "")
  ]));
}

function productionFilesystemResponse() {
  return NextResponse.json(
    { message: "Diese Einstellung wird in Produktion über die Deployment-Umgebung verwaltet." },
    { status: 409 }
  );
}

async function requirePermission(module: "usersRoles" | "backups" | "activityLogs" | "security" | "invoices", permission: "view" | "create" | "update") {
  await ensureAdminBootstrap();
  const allowed = await requireModulePermission(module, permission);
  if (!allowed.ok) {
    return { response: NextResponse.json({ message: allowed.message }, { status: allowed.status }) } as const;
  }
  return { sessionUser: allowed.sessionUser } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "store-control") {
    const permission = await requirePermission("usersRoles", "view");
    if ("response" in permission) return permission.response;
    const storeControl = await prisma.storeControlSetting.findUnique({ where: { id: "store-control" } });
    return NextResponse.json({
      storeControl: {
        maintenanceMode: Boolean(storeControl?.maintenanceMode),
        vacationMode: Boolean(storeControl?.vacationMode),
        disableCheckout: Boolean(storeControl?.disableCheckout),
        announcementBar: storeControl?.announcementBar ?? "",
        maintenanceAvailableAt: storeControl?.maintenanceAvailableAt ?? ""
      }
    });
  }

  if (action === "crm-status") {
    const permission = await requirePermission("invoices", "view");
    if ("response" in permission) return permission.response;

    const [syncRows, stripeOrders] = await Promise.all([
      readCrmSyncRows(),
      prisma.adminOrder.findMany({
        where: {
          status: { in: ["Bezahlt", "Paid"] }
        },
        orderBy: { createdAt: "desc" },
        take: 300
      })
    ]);

    const syncedByOrder = new Set(syncRows.map((row) => row.orderId));
    const syncedOrders = stripeOrders.filter((order) => syncedByOrder.has(order.id));
    const pendingOrders = stripeOrders.filter((order) => !syncedByOrder.has(order.id));
    const syncedRevenue = syncedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const pendingRevenue = pendingOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return NextResponse.json({
      summary: {
        stripeOrders: stripeOrders.length,
        crmSynced: syncedOrders.length,
        crmPending: pendingOrders.length,
        syncedRevenue,
        pendingRevenue
      },
      recentSyncs: syncRows.slice(-20).reverse(),
      pending: pendingOrders.slice(0, 30).map((order) => ({
        id: order.id,
        customer: order.customer,
        total: order.total,
        createdAt: order.createdAt
      }))
    });
  }

  if (action === "email") {
    const permission = await requirePermission("usersRoles", "view");
    if ("response" in permission) return permission.response;
    const envPath = getEnvLocalPath();
    const content = await fs.readFile(envPath, "utf8").catch(() => "");
    const parsed = parseEnv(content);
    const smtp = runtimeValues(ENV_KEYS, parsed);
    return NextResponse.json({ smtp });
  }

  if (action === "tax") {
    const permission = await requirePermission("usersRoles", "view");
    if ("response" in permission) return permission.response;
    const tax = await prisma.taxSetting.findUnique({ where: { id: "tax" } });
    return NextResponse.json({ vatPercent: Number(tax?.vatPercent ?? 20) });
  }

  if (action === "ga-config") {
    const permission = await requirePermission("usersRoles", "view");
    if ("response" in permission) return permission.response;
    const envPath = getEnvLocalPath();
    const content = await fs.readFile(envPath, "utf8").catch(() => "");
    const parsed = parseEnv(content);
    const ga = runtimeValues(GA_ENV_KEYS, parsed);
    return NextResponse.json({ ga });
  }

  if (action === "marketing-config") {
    const permission = await requirePermission("usersRoles", "view");
    if ("response" in permission) return permission.response;
    const envPath = getEnvLocalPath();
    const content = await fs.readFile(envPath, "utf8").catch(() => "");
    const parsed = parseEnv(content);
    const marketing = runtimeValues(MARKETING_ENV_KEYS, parsed);
    return NextResponse.json({ marketing });
  }

  if (action === "uploads") {
    const permission = await requirePermission("activityLogs", "view");
    if ("response" in permission) return permission.response;
    const folders = [
      { key: "products", label: "Product Images", relative: path.join("public", "uploads", "products") },
      { key: "documents", label: "Documents", relative: path.join("public", "uploads", "documents") },
      { key: "contact", label: "Kontakt Form", relative: path.join("public", "uploads", "contact") }
    ];

    const items = await Promise.all(folders.map(async (folder) => {
      const absolute = path.join(process.cwd(), folder.relative);
      await fs.mkdir(absolute, { recursive: true });
      const entries = await fs.readdir(absolute, { withFileTypes: true });
      const fileEntries = entries.filter((entry) => entry.isFile());
      const files = await Promise.all(fileEntries.map(async (entry) => {
        const fullPath = path.join(absolute, entry.name);
        const stat = await fs.stat(fullPath);
        const relativeUrl = `/${folder.relative.replace(/^public[\\/]/, "").replace(/\\/g, "/")}/${encodeURIComponent(entry.name)}`;
        const lower = entry.name.toLowerCase();
        const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".tif", ".tiff"].some((ext) => lower.endsWith(ext));
        return {
          name: entry.name,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
          url: relativeUrl,
          isImage
        };
      }));

      return {
        key: folder.key,
        label: folder.label,
        folder: folder.relative,
        filesCount: files.length,
        files: files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40)
      };
    }));

    return NextResponse.json({ items });
  }

  if (action === "shutdown") {
    const permission = await requirePermission("security", "view");
    if ("response" in permission) return permission.response;
    const markerPath = path.join(process.cwd(), "data", "shutdown-request.json");
    const marker = await fs.readFile(markerPath, "utf8").catch(() => "");
    const current = marker ? JSON.parse(marker) as { requestedAt: string; requestedBy: string; reason: string } : null;
    return NextResponse.json({ shutdownRequest: current });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  if (action === "store-control") {
    const permission = await requirePermission("usersRoles", "update");
    if ("response" in permission) return permission.response;

    const updates: { maintenanceMode?: boolean; vacationMode?: boolean; disableCheckout?: boolean; announcementBar?: string | null; maintenanceAvailableAt?: string | null } = {};
    if (typeof body.maintenanceMode === "boolean") updates.maintenanceMode = body.maintenanceMode;
    if (typeof body.vacationMode === "boolean") updates.vacationMode = body.vacationMode;
    if (typeof body.disableCheckout === "boolean") updates.disableCheckout = body.disableCheckout;
    if (typeof body.announcementBar === "string") updates.announcementBar = body.announcementBar;
    const maintenanceAvailableAt = typeof body.maintenanceAvailableAt === "string" ? body.maintenanceAvailableAt : "";
    updates.maintenanceAvailableAt = maintenanceAvailableAt || null;

    const updated = await prisma.storeControlSetting.update({
      where: { id: "store-control" },
      data: updates
    });
    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "usersRoles",
      action: "store-control-update",
      payload: { ...updates, maintenanceAvailableAt }
    });

    return NextResponse.json({
      success: true,
      storeControl: {
        maintenanceMode: updated.maintenanceMode,
        vacationMode: updated.vacationMode,
        disableCheckout: updated.disableCheckout,
        announcementBar: updated.announcementBar ?? "",
        maintenanceAvailableAt
      }
    });
  }

  if (action === "email") {
    const permission = await requirePermission("usersRoles", "update");
    if ("response" in permission) return permission.response;
    if (process.env.NODE_ENV === "production") return productionFilesystemResponse();
    const envPath = getEnvLocalPath();
    const current = await fs.readFile(envPath, "utf8").catch(() => "");
    let next = current;
    for (const key of ENV_KEYS) {
      const raw = body[key];
      if (typeof raw === "string") {
        next = setEnvValue(next, key, raw);
      }
    }
    await fs.writeFile(envPath, next, "utf8");

    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "usersRoles",
      action: "email-config-update",
      payload: Object.fromEntries(ENV_KEYS.map((key) => [key, body[key] ?? ""]))
    });
    return NextResponse.json({ success: true });
  }

  if (action === "tax") {
    const permission = await requirePermission("usersRoles", "update");
    if ("response" in permission) return permission.response;
    const vatPercent = typeof body.vatPercent === "number" ? body.vatPercent : Number(body.vatPercent ?? 20);
    const updated = await prisma.taxSetting.update({
      where: { id: "tax" },
      data: { vatPercent: Number.isFinite(vatPercent) ? Math.max(0, vatPercent) : 20 }
    });
    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "usersRoles",
      action: "tax-update",
      payload: { vatPercent: updated.vatPercent }
    });
    return NextResponse.json({ success: true, vatPercent: updated.vatPercent });
  }

  if (action === "ga-config") {
    const permission = await requirePermission("usersRoles", "update");
    if ("response" in permission) return permission.response;
    if (process.env.NODE_ENV === "production") return productionFilesystemResponse();
    const envPath = getEnvLocalPath();
    const current = await fs.readFile(envPath, "utf8").catch(() => "");
    let next = current;
    for (const key of GA_ENV_KEYS) {
      const raw = body[key];
      if (typeof raw === "string") next = setEnvValue(next, key, raw);
    }
    await fs.writeFile(envPath, next, "utf8");
    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "usersRoles",
      action: "ga-config-update",
      payload: Object.fromEntries(GA_ENV_KEYS.map((key) => [key, body[key] ?? ""]))
    });
    return NextResponse.json({ success: true });
  }

  if (action === "marketing-config") {
    const permission = await requirePermission("usersRoles", "update");
    if ("response" in permission) return permission.response;
    if (process.env.NODE_ENV === "production") return productionFilesystemResponse();
    const envPath = getEnvLocalPath();
    const current = await fs.readFile(envPath, "utf8").catch(() => "");
    let next = current;
    for (const key of MARKETING_ENV_KEYS) {
      const raw = body[key];
      if (typeof raw === "string") next = setEnvValue(next, key, raw);
    }
    await fs.writeFile(envPath, next, "utf8");
    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "usersRoles",
      action: "marketing-config-update",
      payload: Object.fromEntries(MARKETING_ENV_KEYS.map((key) => [key, body[key] ?? ""]))
    });
    return NextResponse.json({ success: true });
  }

  if (action === "backup") {
    if (process.env.NODE_ENV === "production") return productionFilesystemResponse();
    const permission = await requirePermission("backups", "create");
    if ("response" in permission) return permission.response;
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : `backup-${Date.now()}`;
    const sourceDb = path.join(process.cwd(), "dev.db");
    const backupsDir = path.join(process.cwd(), "data", "backups");
    await fs.mkdir(backupsDir, { recursive: true });
    const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}-${label}.db`;
    const target = path.join(backupsDir, filename);
    await fs.copyFile(sourceDb, target);

    const record = await prisma.backupRecord.create({
      data: {
        label,
        status: "completed",
        location: path.join("data", "backups", filename)
      }
    });

    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "backups",
      action: "backup-create",
      entityId: record.id,
      payload: { label, location: record.location }
    });

    return NextResponse.json({ success: true, backup: record });
  }

  if (action === "shutdown") {
    if (process.env.NODE_ENV === "production") return productionFilesystemResponse();
    const permission = await requirePermission("security", "create");
    if ("response" in permission) return permission.response;
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Manual admin request";
    const markerPath = path.join(process.cwd(), "data", "shutdown-request.json");
    await fs.mkdir(path.dirname(markerPath), { recursive: true });

    const payload = {
      requestedAt: new Date().toISOString(),
      requestedBy: permission.sessionUser.email,
      reason
    };
    await fs.writeFile(markerPath, JSON.stringify(payload, null, 2), "utf8");

    await prisma.storeControlSetting.update({
      where: { id: "store-control" },
      data: {
        maintenanceMode: true,
        disableCheckout: true
      }
    });

    await prisma.securityEvent.create({
      data: {
        level: "warning",
        event: "shutdown-requested",
        metadata: payload
      }
    });

    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "security",
      action: "shutdown-request",
      payload
    });

    return NextResponse.json({ success: true, shutdownRequest: payload });
  }

  if (action === "crm-manage") {
    const permission = await requirePermission("invoices", "update");
    if ("response" in permission) return permission.response;

    let orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId.trim() : "";
    const operation = typeof body.operation === "string" ? body.operation.trim().toLowerCase() : "";
    if (!["stornieren", "delete"].includes(operation)) {
      return NextResponse.json({ message: "Invalid operation." }, { status: 400 });
    }

    if (!orderId && invoiceId) {
      const syncRows = await readCrmSyncRows();
      const matched = syncRows.find((row) => String(row.invoiceId || "").trim() === invoiceId);
      if (matched?.orderId) {
        orderId = matched.orderId;
      }
    }

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId/invoiceId mapping." }, { status: 400 });
    }

    if (operation === "stornieren") {
      const order = await prisma.adminOrder.findUnique({ where: { id: orderId } });
      if (!order) {
        return NextResponse.json({ message: "Order not found." }, { status: 404 });
      }
      const syncRows = await readCrmSyncRows();
      const syncRow = syncRows.find((row) => row.orderId === orderId);
      const crmResult = await callCrmInvoiceMutation("stornieren", syncRow?.invoiceId);

      if (order.status === "Storniert") {
        await writeAuditLog({
          actorEmail: permission.sessionUser.email,
          module: "invoices",
          action: "crm-storno-idempotent",
          entityId: orderId,
          payload: { orderId, status: order.status, alreadyCancelled: true, crmResult }
        });
        return NextResponse.json({ success: true, orderId, status: order.status, alreadyCancelled: true, crmResult });
      }

      let refund = null as null | { id: string; status: string | null };
      const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
      if (orderId.startsWith("STRIPE-") && stripeSecret) {
        try {
          const stripeSessionId = orderId.replace(/^STRIPE-/, "");
          const stripe = new Stripe(stripeSecret);
          const session = await stripe.checkout.sessions.retrieve(stripeSessionId, { expand: ["payment_intent"] });
          const paymentIntent = session.payment_intent;
          if (paymentIntent && typeof paymentIntent !== "string") {
            const stripeRefund = await stripe.refunds.create({
              payment_intent: paymentIntent.id,
              reason: "requested_by_customer",
              metadata: { orderId }
            });
            refund = { id: stripeRefund.id, status: stripeRefund.status };
          }
        } catch (error) {
          const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
          const alreadyRefunded =
            message.includes("already been refunded") ||
            message.includes("charge has already been refunded") ||
            message.includes("has already been refunded");
          if (alreadyRefunded) {
            refund = { id: "already_refunded", status: "succeeded" };
          } else {
            throw error;
          }
        }
      }

      const updated = await prisma.adminOrder.update({
        where: { id: orderId },
        data: { status: "Storniert" }
      });
      await writeAuditLog({
        actorEmail: permission.sessionUser.email,
        module: "invoices",
        action: "crm-storno",
        entityId: orderId,
        payload: { orderId, status: updated.status, refund, crmResult }
      });
      return NextResponse.json({ success: true, orderId, status: updated.status, refund, crmResult });
    }

    const syncRows = await readCrmSyncRows();
    const syncRow = syncRows.find((row) => row.orderId === orderId);
    const crmResult = await callCrmInvoiceMutation("delete", syncRow?.invoiceId);

    await prisma.adminOrder.delete({ where: { id: orderId } });
    const nextRows = syncRows.filter((row) => row.orderId !== orderId);
    if (nextRows.length !== syncRows.length) {
      await writeCrmSyncRows(nextRows);
    }
    await writeAuditLog({
      actorEmail: permission.sessionUser.email,
      module: "invoices",
      action: "crm-delete",
      entityId: orderId,
      payload: { orderId, crmResult }
    });
    return NextResponse.json({ success: true, orderId, deleted: true, crmResult });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function PUT(request: Request) {
  return POST(request);
}
