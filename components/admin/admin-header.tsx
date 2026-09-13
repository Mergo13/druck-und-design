"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, Menu, Package, Plus, ReceiptText, Tags, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { adminTitleForPath } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type AdminHeaderProps = {
  title?: string;
  email?: string;
};

export function AdminHeader({ title, email }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = title ?? adminTitleForPath(pathname);
  const segments = pathname.split("/").filter(Boolean);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur md:px-6">
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="Navigation öffnen">
            <Menu className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-dvh max-h-dvh w-80 max-w-[85vw] translate-x-0 translate-y-0 rounded-none p-0">
        <DialogTitle className="sr-only">Admin-Navigation</DialogTitle>
          <AdminSidebar mobile onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          {segments.map((segment, index) => (
            <span key={`${segment}-${index}`} className="truncate capitalize">
              {index > 0 ? " / " : ""}
              {segment.replaceAll("-", " ")}
            </span>
          ))}
        </div>
        <h1 className="truncate text-lg font-black text-slate-950">{pageTitle}</h1>
      </div>

      <div className="hidden w-full max-w-sm md:block">
        <AdminCommandPalette />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild><a href="/admin/catalog/products/new"><Package className="mr-2 h-4 w-4" />Produkt</a></DropdownMenuItem>
          <DropdownMenuItem asChild><a href="/admin/sales/quotes?new=1"><FileText className="mr-2 h-4 w-4" />Angebot</a></DropdownMenuItem>
          <DropdownMenuItem asChild><a href="/admin/sales/invoices?new=1"><ReceiptText className="mr-2 h-4 w-4" />Rechnung</a></DropdownMenuItem>
          <DropdownMenuItem asChild><a href="/admin/marketing/coupons?new=1"><Tags className="mr-2 h-4 w-4" />Gutschein</a></DropdownMenuItem>
          <DropdownMenuItem asChild><a href="/admin/marketing/newsletter?tab=campaigns&new=1"><FileText className="mr-2 h-4 w-4" />Newsletter-Kampagne</a></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Account">
            <UserCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{email ?? "Admin"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void logout()}>
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
