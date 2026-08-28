"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin-audit";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taxSchema = z.object({
  vatPercent: z.number().nonnegative()
});

export async function saveTaxSettingAction(input: { vatPercent: number }) {
  await ensureAdminBootstrap();
  const parsed = taxSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Ungültige Steuerdaten");
  }
  const sessionUser = await getSessionUser();
  const updated = await prisma.taxSetting.update({
    where: { id: "tax" },
    data: { vatPercent: parsed.data.vatPercent }
  });
  await writeAuditLog({
    actorEmail: sessionUser?.email,
    module: "usersRoles",
    action: "tax-update-action",
    payload: parsed.data
  });
  revalidatePath("/admin");
  return updated;
}

export async function toggleStoreControlAction(key: "maintenanceMode" | "vacationMode" | "disableCheckout", value: boolean) {
  await ensureAdminBootstrap();
  const sessionUser = await getSessionUser();
  const updated = await prisma.storeControlSetting.update({
    where: { id: "store-control" },
    data: { [key]: value }
  });
  await writeAuditLog({
    actorEmail: sessionUser?.email,
    module: "usersRoles",
    action: `toggle-${key}`,
    payload: { value }
  });
  revalidatePath("/admin");
  return updated;
}
