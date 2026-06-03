import type { Metadata } from "next";
import { AdminClient } from "@/app/admin/admin-client";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin-Dashboard für Produkte, News, Gruppen, Bestellungen, Rechnungen und Shop-Steuerung."
};

export default function AdminPage() {
  return <AdminClient />;
}
