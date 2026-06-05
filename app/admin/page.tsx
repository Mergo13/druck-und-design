import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "@/app/admin/admin-client";
import { getSessionUser, isAdmin2FAVerifiedFor } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin-Dashboard für Produkte, News, Gruppen, Bestellungen, Rechnungen und Shop-Steuerung."
};

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user?.email) {
    redirect("/login?next=/admin");
  }
  const verified = await isAdmin2FAVerifiedFor(user.email);
  if (!verified) {
    redirect("/admin/verify-2fa");
  }
  return <AdminClient />;
}
