import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { writeAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";

const permissionsSchema = z.object({
  roleId: z.string().min(1),
  permissions: z.array(
    z.object({
      module: z.string().min(1),
      canView: z.boolean(),
      canCreate: z.boolean(),
      canUpdate: z.boolean(),
      canDelete: z.boolean()
    })
  )
});

export async function GET() {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "view");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(roles);
}

export async function PUT(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("usersRoles", "update");
  if (!permission.ok) {
    return NextResponse.json({ message: permission.message }, { status: permission.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = permissionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const item of parsed.data.permissions) {
      await tx.rolePermission.upsert({
        where: { roleId_module: { roleId: parsed.data.roleId, module: item.module } },
        update: {
          canView: item.canView,
          canCreate: item.canCreate,
          canUpdate: item.canUpdate,
          canDelete: item.canDelete
        },
        create: {
          roleId: parsed.data.roleId,
          module: item.module,
          canView: item.canView,
          canCreate: item.canCreate,
          canUpdate: item.canUpdate,
          canDelete: item.canDelete
        }
      });
    }
  });

  await writeAuditLog({
    actorEmail: permission.sessionUser.email,
    module: "usersRoles",
    action: "role-permissions-update",
    entityId: parsed.data.roleId,
    payload: parsed.data.permissions
  });

  return NextResponse.json({ success: true });
}
