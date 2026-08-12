import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await ensureAdminBootstrap();
  const [storeControl, session] = await Promise.all([
    prisma.storeControlSetting.findUnique({ where: { id: "store-control" } }),
    getSessionUser()
  ]);
  const adminUser = session?.email
    ? await prisma.adminUser.findUnique({ where: { email: session.email.toLowerCase() } })
    : null;

  return NextResponse.json({
    maintenanceMode: Boolean(storeControl?.maintenanceMode),
    vacationMode: Boolean(storeControl?.vacationMode),
    disableCheckout: Boolean(storeControl?.disableCheckout),
    announcementBar: storeControl?.announcementBar ?? "",
    maintenanceAvailableAt: storeControl?.maintenanceAvailableAt ?? "",
    isAdmin: Boolean(adminUser?.active)
  });
}
