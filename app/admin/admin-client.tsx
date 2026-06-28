"use client";

import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () => import("@/features/admin/react-admin-dashboard").then((module) => module.ReactAdminDashboard),
  { ssr: false }
);

export function AdminClient() {
  return <AdminDashboard />;
}
