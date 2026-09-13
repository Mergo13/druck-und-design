"use client";

import { useEffect, useMemo, useState } from "react";
import { addAdminRecent } from "@/components/admin/admin-recents";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import type { ProductCatalogItem } from "@/types/print-platform";

type StatsResponse = {
  revenue?: number;
  orderCount?: number;
  averageOrderValue?: number;
  productCount?: number;
  quoteCount?: number;
  invoiceCount?: number;
  ordersByStatus?: Array<{ status: string; count: number }>;
  recentOrders?: Array<{ id: string; customer?: string; total?: number; status?: string; createdAt?: string }>;
};

type ModuleResponse = {
  items?: Array<Record<string, unknown>>;
  total?: number;
};

export function AdminDashboardHome() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [quotes, setQuotes] = useState<ModuleResponse | null>(null);
  const [invoices, setInvoices] = useState<ModuleResponse | null>(null);
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [statsRes, quotesRes, invoicesRes, productsRes] = await Promise.all([
        fetch("/api/admin/stats?period=30d"),
        fetch("/api/admin/modules/quotes?page=1&pageSize=5"),
        fetch("/api/admin/modules/invoices?page=1&pageSize=10"),
        fetch("/api/catalog/products?scope=admin")
      ]);
      if (!statsRes.ok) {
        setError("Dashboard-Kennzahlen konnten nicht geladen werden.");
        return;
      }
      setStats(await statsRes.json() as StatsResponse);
      if (quotesRes.ok) setQuotes(await quotesRes.json() as ModuleResponse);
      if (invoicesRes.ok) setInvoices(await invoicesRes.json() as ModuleResponse);
      if (productsRes.ok) setProducts(await productsRes.json() as ProductCatalogItem[]);
    }
    void load();
  }, []);

  const openQuotes = useMemo(() => {
    const rows = quotes?.items ?? [];
    return rows.filter((row) => !["accepted", "declined", "abgelehnt", "angenommen"].includes(String(row.status ?? "").toLowerCase())).length;
  }, [quotes]);

  const openInvoices = useMemo(() => {
    const rows = invoices?.items ?? [];
    return rows.filter((row) => !["bezahlt", "paid", "storniert", "cancelled"].includes(String(row.status ?? "").toLowerCase())).length;
  }, [invoices]);

  const productWarnings = useMemo(() => products.map((product) => {
    const warnings: string[] = [];
    if (!Number(product.basePrice) && product.pricingType !== "tiered") warnings.push("kein Preis");
    if (product.pricingType === "tiered" && !(product.priceTiers ?? []).length) warnings.push("keine Preisstaffeln");
    if ((product.priceTiers ?? []).some((tier) => Number(tier.unitPrice ?? tier.price) === 0)) warnings.push("0-Euro-Staffel");
    if (!product.category) warnings.push("keine Kategorie");
    if (!product.heroImage && !(product.gallery ?? []).length) warnings.push("kein Bild");
    if (product.visible === false || product.published === false || product.productStatus !== "active") warnings.push("nicht aktiv sichtbar");
    if (!product.seo?.trim()) warnings.push("SEO fehlt");
    if ((product.pricingProperties ?? []).some((property) => property.required !== false && !(property.values ?? []).some((value) => value.enabled !== false))) warnings.push("Eigenschaft ohne aktive Werte");
    return { product, warnings };
  }).filter((item) => item.warnings.length).slice(0, 10), [products]);

  function openOrder(order: NonNullable<StatsResponse["recentOrders"]>[number]) {
    addAdminRecent({ id: order.id, type: "Bestellung", label: order.customer || order.id, href: `/admin/sales/orders/${encodeURIComponent(order.id)}`, subtitle: order.status });
    window.location.href = `/admin/sales/orders/${encodeURIComponent(order.id)}`;
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Operative Übersicht aus Bestellungen, Angeboten, Rechnungen und Katalogdaten." />
      {error ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Kpi title="Umsatz 30 Tage" value={formatCurrency(stats?.revenue)} />
        <Kpi title="Bestellungen" value={formatNumber(stats?.orderCount)} />
        <Kpi title="Ø Bestellwert" value={formatCurrency(stats?.averageOrderValue)} />
        <Kpi title="Offene Angebote" value={formatNumber(openQuotes)} />
        <Kpi title="Offene Rechnungen" value={formatNumber(openInvoices)} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-950">Letzte Bestellungen</h3>
            <Badge variant="outline">{formatNumber(stats?.productCount)} Produkte</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 text-left">Bestellung</th>
                  <th className="py-2 text-left">Kunde</th>
                  <th className="py-2 text-right">Summe</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders ?? []).map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    onClick={() => openOrder(order)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openOrder(order);
                    }}
                    className="cursor-pointer border-b outline-none last:border-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <td className="py-2 font-semibold">{order.id}</td>
                    <td className="py-2">{order.customer || "-"}</td>
                    <td className="py-2 text-right">{formatCurrency(order.total)}</td>
                    <td className="py-2"><Badge variant="secondary">{order.status || "-"}</Badge></td>
                  </tr>
                ))}
                {!(stats?.recentOrders ?? []).length ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">Keine Bestellungen gefunden.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-black text-slate-950">Status & Hinweise</h3>
          <div className="grid gap-2">
            {(stats?.ordersByStatus ?? []).map((row) => (
              <div key={row.status} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold">{row.status || "Ohne Status"}</span>
                <Badge variant="outline">{row.count}</Badge>
              </div>
            ))}
            {openInvoices > 0 ? <Warning text={`${openInvoices} Rechnungen sind nicht als bezahlt oder storniert markiert.`} /> : null}
            {openQuotes > 0 ? <Warning text={`${openQuotes} Angebote benötigen Nachverfolgung.`} /> : null}
          </div>
        </section>
      </div>
      <section className="mt-4 rounded-lg border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-950">Produktwarnungen</h3>
          <Badge variant="outline">{productWarnings.length}</Badge>
        </div>
        <div className="grid gap-2">
          {productWarnings.map(({ product, warnings }) => (
            <button
              key={product.slug}
              type="button"
              onClick={() => {
                addAdminRecent({ id: product.slug, type: "Produkt", label: product.name, href: `/admin/catalog/products/${encodeURIComponent(product.slug)}`, subtitle: warnings.join(", ") });
                window.location.href = `/admin/catalog/products/${encodeURIComponent(product.slug)}`;
              }}
              className="flex items-center justify-between gap-3 rounded-md border bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <span className="font-black text-slate-950">{product.name}</span>
              <span className="truncate text-xs font-semibold text-amber-800">{warnings.join(" · ")}</span>
            </button>
          ))}
          {!productWarnings.length ? <p className="text-sm font-semibold text-slate-500">Keine Produktwarnungen gefunden.</p> : null}
        </div>
      </section>
    </>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs font-black uppercase text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{text}</div>;
}

function formatCurrency(value: unknown) {
  const number = Number(value ?? 0);
  return number.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

function formatNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString("de-AT");
}
