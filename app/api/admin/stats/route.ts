import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

type PeriodKey = "7d" | "30d" | "90d" | "365d";

function periodDays(period: string | null): number {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  if (period === "365d") return 365;
  return 30;
}

function bucketCount(period: string | null): number {
  if (period === "7d") return 7;
  if (period === "30d") return 10;
  return 12;
}

function isRevenueStatus(status: string) {
  return !["Anfrage", "Storniert", "Cancelled", "Canceled"].includes(status);
}

export async function GET(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("orders", "view");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") || "30d") as PeriodKey;
  const days = periodDays(period);
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const vatSetting = await prisma.taxSetting.findUnique({ where: { id: "tax" } });
  const vatPercent = Number(vatSetting?.vatPercent ?? 20);

  const [orders, productsTotal, categoriesTotal, customersTotal] = await Promise.all([
    prisma.adminOrder.findMany({
      where: { createdAt: { gte: fromDate } },
      select: { id: true, total: true, status: true, createdAt: true }
    }),
    prisma.catalogProduct.count(),
    prisma.catalogCategory.count(),
    prisma.customerAccount.count()
  ]);

  const revenueOrders = orders.filter((order) => isRevenueStatus(order.status));
  const grossRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const taxAmount = grossRevenue * (vatPercent / (100 + vatPercent));
  const netRevenue = grossRevenue - taxAmount;
  const averageOrder = revenueOrders.length ? grossRevenue / revenueOrders.length : 0;
  const buckets = bucketCount(period);
  const spanDays = Math.max(1, Math.round(days / buckets));
  const values = Array.from({ length: buckets }, (_, index) => {
    const point = new Date(fromDate.getTime() + index * spanDays * 24 * 60 * 60 * 1000);
    return {
      label: point.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      value: 0
    };
  });

  for (const order of revenueOrders) {
    const diffDays = Math.floor((order.createdAt.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
    const index = Math.min(buckets - 1, Math.max(0, Math.floor(diffDays / spanDays)));
    values[index].value += Number(order.total || 0);
  }
  const max = Math.max(1, ...values.map((bucket) => bucket.value));

  return NextResponse.json({
    period,
    fromDate: fromDate.toISOString(),
    vatPercent,
    productsTotal,
    categoriesTotal,
    customersTotal,
    orderCount: orders.length,
    revenueOrderCount: revenueOrders.length,
    openRequestCount: orders.filter((order) => order.status === "Anfrage").length,
    grossRevenue,
    netRevenue,
    taxAmount,
    averageOrder,
    chartBuckets: values.map((bucket) => ({
      ...bucket,
      height: Math.max(6, (bucket.value / max) * 100)
    }))
  });
}
