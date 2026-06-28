import { prisma } from "@/lib/prisma";
import { getOrders } from "@/lib/catalog-repository";
import type { AdminModuleKey } from "@/types/admin";

const modules: AdminModuleKey[] = [
  "orders",
  "quotes",
  "invoices",
  "fileUploads",
  "coupons",
  "reviews",
  "newsletter",
  "shipping",
  "paymentMethods",
  "usersRoles",
  "emailTemplates",
  "activityLogs",
  "backups",
  "security",
  "categories",
  "products"
];

let bootstrapped = false;

export async function ensureAdminBootstrap() {
  if (bootstrapped) return;

  await prisma.companyInformation.upsert({
    where: { id: "company" },
    update: {},
    create: { id: "company" }
  });
  await prisma.taxSetting.upsert({
    where: { id: "tax" },
    update: {},
    create: { id: "tax" }
  });
  await prisma.storeControlSetting.upsert({
    where: { id: "store-control" },
    update: {},
    create: { id: "store-control" }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" }
  });

  for (const module of modules) {
    await prisma.rolePermission.upsert({
      where: { roleId_module: { roleId: adminRole.id, module } },
      update: {},
      create: {
        roleId: adminRole.id,
        module,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }
    });
  }

  const configuredAdminEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (process.env.NODE_ENV === "production" && configuredAdminEmails.length === 0) {
    throw new Error("ADMIN_EMAILS muss in Produktion mindestens eine Admin-E-Mail enthalten.");
  }
  const adminEmails = Array.from(
    new Set(
      process.env.NODE_ENV === "production"
        ? configuredAdminEmails
        : [...configuredAdminEmails, "mergoiza@mail.com", "izairimergim@gmail.com"]
    )
  );

  for (const adminEmail of adminEmails) {
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        roleId: adminRole.id,
        active: true
      },
      create: {
        email: adminEmail,
        name: "Admin",
        roleId: adminRole.id,
        active: true
      }
    });
  }

  const ordersCount = await prisma.adminOrder.count();
  if (ordersCount === 0) {
    const legacyOrders = await getOrders();
    for (const order of legacyOrders) {
      await prisma.adminOrder.upsert({
        where: { id: order.id },
        update: {
          customer: "customer" in order && typeof (order as { customer?: string }).customer === "string"
            ? (order as { customer?: string }).customer ?? "Kunde"
            : "Kunde",
          total: order.total,
          status: "status" in order && typeof (order as { status?: string }).status === "string"
            ? (order as { status?: string }).status ?? "Neu"
            : "Neu",
          items: order.items as unknown as object
        },
        create: {
          id: order.id,
          customer: "customer" in order && typeof (order as { customer?: string }).customer === "string"
            ? (order as { customer?: string }).customer ?? "Kunde"
            : "Kunde",
          total: order.total,
          status: "status" in order && typeof (order as { status?: string }).status === "string"
            ? (order as { status?: string }).status ?? "Neu"
            : "Neu",
          items: order.items as unknown as object
        }
      });
    }
  }

  bootstrapped = true;
}
