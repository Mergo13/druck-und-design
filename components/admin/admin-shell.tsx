import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

type AdminShellProps = {
  children: ReactNode;
  title?: string;
  email?: string;
};

export function AdminShell({ children, title, email }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <div className="sticky top-0 hidden h-screen shrink-0 md:block">
          <AdminSidebar />
        </div>
        <div className="min-w-0 flex-1">
          <AdminHeader title={title} email={email} />
          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
