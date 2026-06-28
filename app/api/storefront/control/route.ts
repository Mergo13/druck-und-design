import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await ensureAdminBootstrap();
  const storeControl = await prisma.storeControlSetting.findUnique({ where: { id: "store-control" } });

  return NextResponse.json({
    maintenanceMode: Boolean(storeControl?.maintenanceMode),
    vacationMode: Boolean(storeControl?.vacationMode),
    disableCheckout: Boolean(storeControl?.disableCheckout),
    announcementBar: storeControl?.announcementBar ?? "",
    maintenanceAvailableAt: storeControl?.maintenanceAvailableAt ?? ""
  });
}
