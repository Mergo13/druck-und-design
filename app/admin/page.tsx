import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/app/admin/admin-client";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { getSessionUser, isAdmin2FAVerifiedFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin-Dashboard für Produkte, News, Gruppen, Bestellungen, Rechnungen und Shop-Steuerung."
};

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user?.email) {
    redirect("/login?next=/admin");
  }
  await ensureAdminBootstrap();
  const admin = await prisma.adminUser.findUnique({ where: { email: user.email } });
  if (!admin?.active) {
    redirect("/login?next=/admin&error=forbidden");
  }
  const verified = await isAdmin2FAVerifiedFor(user.email);
  if (!verified) {
    redirect("/admin/verify-2fa");
  }
  return <AdminClient />;
}
