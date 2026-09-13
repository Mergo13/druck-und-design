"use client";

import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { adminNav, isNavGroup } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function AdminSidebar({ mobile = false, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    Verkauf: true,
    Katalog: true
  }));
  const isCollapsed = !mobile && collapsed;

  const content = useMemo(() => adminNav, []);

  return (
    <TooltipProvider delayDuration={150}>
      <aside className={cn("flex h-full flex-col border-r bg-white", isCollapsed ? "w-[72px]" : mobile ? "w-full" : "w-64")}>
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-black text-white">D</div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight text-slate-950">DUD Studio</p>
              <p className="truncate text-xs font-semibold text-slate-500">Admin</p>
            </div>
          ) : null}
          {!mobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              aria-label={collapsed ? "Sidebar erweitern" : "Sidebar einklappen"}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {content.map((item) => {
            if (!isNavGroup(item)) {
              const active = pathname === item.href;
              const Icon = item.icon;
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed ? <span className="truncate">{item.title}</span> : null}
                </Link>
              );
              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : link;
            }

            const groupActive = item.items.some((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
            const groupOpen = openGroups[item.title] ?? groupActive;
            const GroupIcon = item.icon;
            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [item.title]: !groupOpen }))}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring",
                    groupActive && "text-slate-950",
                    isCollapsed && "justify-center px-0"
                  )}
                  aria-expanded={groupOpen}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  {!isCollapsed ? (
                    <>
                      <span className="truncate">{item.title}</span>
                      <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", groupOpen && "rotate-180")} />
                    </>
                  ) : null}
                </button>
                {isCollapsed ? null : groupOpen ? (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                    {item.items.map((entry) => {
                      const active = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
                      const Icon = entry.icon;
                      return (
                        <Link
                          key={entry.href}
                          href={entry.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring",
                            active && "bg-slate-100 text-slate-950"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{entry.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/admin/legacy"
            onClick={onNavigate}
            className={cn("flex h-9 items-center justify-center rounded-md border px-3 text-xs font-bold text-slate-600 hover:bg-slate-50", isCollapsed && "px-0")}
          >
            {isCollapsed ? "RA" : "Altes react-admin"}
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}
