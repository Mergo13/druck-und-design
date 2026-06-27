import { getSessionUser, isAdmin2FAVerifiedFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminModuleKey, ModulePermission } from "@/types/admin";

export async function requireModulePermission(module: AdminModuleKey, permission: ModulePermission) {
  const sessionUser = await getSessionUser();

  if (process.env.NODE_ENV !== "production") {
    return {
      ok: true as const,
      sessionUser: sessionUser ?? { email: "system@local.dev", id: "system", company: "Local" }
    };
  }

  if (!sessionUser?.email) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: sessionUser.email },
    include: { role: { include: { permissions: true } } }
  });

  if (!user || !user.active) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  const twoFactorOk = await isAdmin2FAVerifiedFor(sessionUser.email);
  if (!twoFactorOk) {
    return { ok: false as const, status: 401, message: "Admin 2FA required" };
  }

  const modulePermission = user.role.permissions.find((item) => item.module === module);
  if (!modulePermission) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  const allowed = permission === "view"
    ? modulePermission.canView
    : permission === "create"
      ? modulePermission.canCreate
      : permission === "update"
        ? modulePermission.canUpdate
        : modulePermission.canDelete;

  if (!allowed) {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, sessionUser };
}
