import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin-audit";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    legalName: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    vatId: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional()
  }),
  tax: z.object({
    vatPercent: z.number().nonnegative()
  }),
  storeControl: z.object({
    maintenanceMode: z.boolean(),
    vacationMode: z.boolean(),
    disableCheckout: z.boolean(),
    studentDiscountPercent: z.number().min(0).max(100).optional(),
    announcementBar: z.string().optional()
  })
});

export async function GET() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "view");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const [company, tax, storeControl] = await Promise.all([
    prisma.companyInformation.findUnique({ where: { id: "company" } }),
    prisma.taxSetting.findUnique({ where: { id: "tax" } }),
    prisma.storeControlSetting.findUnique({ where: { id: "store-control" } })
  ]);

  return NextResponse.json({ company, tax, storeControl });
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "update");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { company, tax, storeControl } = parsed.data;
  const [companyRow, taxRow, storeControlRow] = await Promise.all([
    prisma.companyInformation.update({
      where: { id: "company" },
      data: {
        name: company.name,
        legalName: company.legalName || null,
        email: company.email || null,
        phone: company.phone || null,
        vatId: company.vatId || null,
        address: company.address || null,
        website: company.website || null
      }
    }),
    prisma.taxSetting.update({
      where: { id: "tax" },
      data: { vatPercent: tax.vatPercent }
    }),
    prisma.storeControlSetting.update({
      where: { id: "store-control" },
      data: {
        maintenanceMode: storeControl.maintenanceMode,
        vacationMode: storeControl.vacationMode,
        disableCheckout: storeControl.disableCheckout,
        studentDiscountPercent: storeControl.studentDiscountPercent ?? 20,
        announcementBar: storeControl.announcementBar || null
      }
    })
  ]);

  await writeAuditLog({
    actorEmail: permission.sessionUser.email,
    module: "usersRoles",
    action: "settings-update",
    payload: parsed.data
  });

  return NextResponse.json({ company: companyRow, tax: taxRow, storeControl: storeControlRow });
}
