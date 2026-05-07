import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin-Dashboard für Produkte, News, Gruppen, Bestellungen, Rechnungen und Shop-Steuerung."
};

export default function AdminPage() {
  return <AdminDashboard />;
}
