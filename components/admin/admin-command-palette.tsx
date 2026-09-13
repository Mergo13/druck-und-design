"use client";

import { FileText, Package, Plus, ReceiptText, Search, Settings, SlidersHorizontal, Tags, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { addAdminRecent, readAdminRecents, type AdminRecentItem } from "@/components/admin/admin-recents";
import { adminNav, isNavGroup } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CommandResult = {
  id: string;
  type: string;
  label: string;
  href: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
};

const quickCommands: CommandResult[] = [
  { id: "new-product", type: "Aktion", label: "Neues Produkt", href: "/admin/catalog/products/new", icon: Package },
  { id: "new-quote", type: "Aktion", label: "Neues Angebot", href: "/admin/sales/quotes?new=1", icon: FileText },
  { id: "new-invoice", type: "Aktion", label: "Neue Rechnung", href: "/admin/sales/invoices?new=1", icon: ReceiptText },
  { id: "new-coupon", type: "Aktion", label: "Neuer Gutschein", href: "/admin/marketing/coupons?new=1", icon: Tags },
  { id: "new-newsletter-campaign", type: "Aktion", label: "Neue Newsletter-Kampagne", href: "/admin/marketing/newsletter?tab=campaigns&new=1", icon: FileText },
  { id: "csv-import", type: "Aktion", label: "CSV Import", href: "/admin/catalog/tools", icon: SlidersHorizontal },
  { id: "store-control", type: "Aktion", label: "Shop-Steuerung öffnen", href: "/admin/operations/store", icon: Settings },
  { id: "settings", type: "Aktion", label: "Einstellungen öffnen", href: "/admin/settings", icon: Settings }
];

function navCommands(): CommandResult[] {
  return adminNav.flatMap((item) => {
    if (isNavGroup(item)) {
      return item.items.map((entry) => ({
        id: entry.href,
        type: item.title,
        label: entry.title,
        href: entry.href,
        icon: entry.icon
      }));
    }
    return [{ id: item.href, type: "Navigation", label: item.title, href: item.href, icon: item.icon }];
  });
}

export function AdminCommandPalette({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandResult[]>([]);
  const [recents, setRecents] = useState<AdminRecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function loadRecents() {
      setRecents(readAdminRecents());
    }
    loadRecents();
    window.addEventListener("admin-recents-changed", loadRecents);
    window.addEventListener("storage", loadRecents);
    return () => {
      window.removeEventListener("admin-recents-changed", loadRecents);
      window.removeEventListener("storage", loadRecents);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      const next: CommandResult[] = [];
      try {
        const [products, categories, properties, orders, quotes, invoices, customers, coupons, reviews, campaigns] = await Promise.all([
          fetch(`/api/catalog/products?scope=admin`, { signal: controller.signal }).then((res) => res.ok ? res.json() : []),
          fetch(`/api/catalog/categories?scope=admin`, { signal: controller.signal }).then((res) => res.ok ? res.json() : []),
          fetch(`/api/catalog/properties?scope=admin`, { signal: controller.signal }).then((res) => res.ok ? res.json() : []),
          fetch(`/api/admin/modules/orders?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/quotes?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/invoices?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/customers?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/coupons?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/reviews?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] }),
          fetch(`/api/admin/modules/newsletterCampaigns?page=1&pageSize=8&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal }).then((res) => res.ok ? res.json() : { items: [] })
        ]);
        const needle = trimmed.toLowerCase();
        next.push(...array(products).filter((item) => match(item, needle)).slice(0, 8).map((item) => command(item, "Produkt", `/admin/catalog/products/${encodeURIComponent(String(item.slug))}`, Package)));
        next.push(...array(categories).filter((item) => match(item, needle)).slice(0, 6).map((item) => command(item, "Kategorie", `/admin/catalog/categories/${encodeURIComponent(String(item.slug))}`, Tags)));
        next.push(...array(properties).filter((item) => match(item, needle)).slice(0, 6).map((item) => command(item, "Eigenschaft", `/admin/catalog/properties/${encodeURIComponent(String(item.slug))}`, SlidersHorizontal)));
        next.push(...moduleItems(orders, "Bestellung", "/admin/sales/orders", ReceiptText, "detail"));
        next.push(...moduleItems(quotes, "Angebot", "/admin/sales/quotes", FileText, "detail"));
        next.push(...moduleItems(invoices, "Rechnung", "/admin/sales/invoices", FileText, "detail"));
        next.push(...moduleItems(customers, "Kunde", "/admin/marketing/customers", Users, "query"));
        next.push(...moduleItems(coupons, "Gutschein", "/admin/marketing/coupons", Tags, "query"));
        next.push(...moduleItems(reviews, "Bewertung", "/admin/marketing/reviews", Users, "query"));
        next.push(...moduleItems(campaigns, "Newsletter-Kampagne", "/admin/marketing/newsletter?tab=campaigns", FileText, "query"));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
      setResults(next.slice(0, 36));
    }, 180);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  const defaultResults = useMemo(() => [...quickCommands, ...navCommands()], []);
  const visibleResults = query.trim().length >= 2 ? results : defaultResults;

  function openCommand(result: CommandResult) {
    addAdminRecent({
      id: result.id,
      type: result.type,
      label: result.label,
      href: result.href,
      subtitle: result.subtitle
    });
    window.location.href = result.href;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("flex h-9 w-full items-center gap-2 rounded-md border bg-white px-3 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50", triggerClassName)}
      >
        <Search className="h-4 w-4 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">Admin durchsuchen...</span>
        <kbd className="rounded border bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-500">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl gap-3 p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">Befehlspalette</DialogTitle>
            <DialogDescription>Datensätze öffnen, Adminseiten wechseln und schnelle Aktionen starten.</DialogDescription>
          </DialogHeader>
          <div className="px-4">
            <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produkt, Bestellung, Rechnung, Einstellung..." />
          </div>
          <div className="max-h-[58vh] overflow-y-auto px-2 pb-3">
            {query.trim().length < 2 && recents.length ? (
              <CommandSection title="Zuletzt geöffnet">
                {recents.map((item) => <CommandRow key={item.href} result={item} onOpen={() => openCommand(item)} />)}
              </CommandSection>
            ) : null}
            <CommandSection title={query.trim().length >= 2 ? (loading ? "Suche..." : "Treffer") : "Aktionen & Seiten"}>
              {visibleResults.length ? visibleResults.map((result) => (
                <CommandRow key={`${result.type}-${result.id}-${result.href}`} result={result} onOpen={() => openCommand(result)} />
              )) : <div className="px-3 py-8 text-center text-sm font-semibold text-slate-500">Keine Treffer.</div>}
            </CommandSection>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CommandSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="py-2"><div className="px-3 py-1 text-xs font-black uppercase text-slate-500">{title}</div>{children}</section>;
}

function CommandRow({ result, onOpen }: { result: CommandResult | AdminRecentItem; onOpen: () => void }) {
  const Icon = "icon" in result ? result.icon : undefined;
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-white text-slate-500">
        {Icon ? <Icon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-slate-950">{result.label}</span>
        <span className="block truncate text-xs font-semibold text-slate-500">{result.type}{result.subtitle ? ` · ${result.subtitle}` : ""}</span>
      </span>
    </button>
  );
}

function array(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
}

function match(item: Record<string, unknown>, needle: string) {
  return `${String(item.name ?? "")} ${String(item.slug ?? "")} ${String(item.id ?? "")}`.toLowerCase().includes(needle);
}

function command(item: Record<string, unknown>, type: string, href: string, icon: CommandResult["icon"]): CommandResult {
  return {
    id: String(item.slug ?? item.id ?? href),
    type,
    label: String(item.name ?? item.subject ?? item.customer ?? item.code ?? item.id ?? item.slug ?? href),
    href,
    subtitle: String(item.slug ?? item.email ?? item.status ?? ""),
    icon
  };
}

function moduleItems(payload: unknown, type: string, basePath: string, icon: CommandResult["icon"], mode: "detail" | "query") {
  const rows = array((payload as { items?: unknown })?.items);
  return rows.map((item) => {
    const id = String(item.id);
    const joiner = basePath.includes("?") ? "&" : "?";
    const href = mode === "detail" ? `${basePath}/${encodeURIComponent(id)}` : `${basePath}${joiner}open=${encodeURIComponent(id)}`;
    return command(item, type, href, icon);
  });
}
