import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await ensureAdminBootstrap();
  const storeControl = await prisma.storeControlSetting.findUnique({ where: { id: "store-control" } });
  const extraPath = path.join(process.cwd(), "data", "storefront-control.json");
  const extraRaw = await fs.readFile(extraPath, "utf8").catch(() => "");
  const extra = extraRaw ? JSON.parse(extraRaw) as { maintenanceAvailableAt?: string } : {};

  return NextResponse.json({
    maintenanceMode: Boolean(storeControl?.maintenanceMode),
    vacationMode: Boolean(storeControl?.vacationMode),
    disableCheckout: Boolean(storeControl?.disableCheckout),
    announcementBar: storeControl?.announcementBar ?? "",
    maintenanceAvailableAt: extra.maintenanceAvailableAt ?? ""
  });
}
