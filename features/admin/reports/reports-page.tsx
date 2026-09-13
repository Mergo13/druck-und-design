"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StatsPayload = {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  taxAmount: number;
  averageOrder: number;
  orderCount: number;
  revenueOrderCount: number;
  openRequestCount: number;
  productsTotal: number;
  categoriesTotal: number;
  customersTotal: number;
  chartBuckets: Array<{ label: string; value: number; height: number }>;
  ordersByStatus?: Array<{ status: string; count: number }>;
  recentOrders?: Array<{ id: string; customer: string; total: number; status: string; createdAt: string }>;
  topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
};

export function ReportsPage({ mode }: { mode: "sales" | "analytics" }) {
  const [period, setPeriod] = useState("30d");
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      const response = await fetch(`/api/admin/stats?period=${period}`);
      if (!response.ok) {
        setError("Statistiken konnten nicht geladen werden.");
        return;
      }
      setStats(await response.json() as StatsPayload);
    }
    void load();
  }, [period]);

  return (
    <>
      <PageHeader
        title={mode === "sales" ? "Verkäufe" : "Analysen"}
        description="Kennzahlen aus der bestehenden Bestell-, Kunden- und Katalogdatenbank."
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="90d">90 Tage</SelectItem>
              <SelectItem value="365d">365 Tage</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {error ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold">{error}</div> : null}
      {stats ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi label="Bruttoumsatz" value={formatMoney(stats.grossRevenue)} />
            <Kpi label="Nettoumsatz" value={formatMoney(stats.netRevenue)} />
            <Kpi label="Bestellungen" value={stats.orderCount} />
            <Kpi label="Ø Bestellwert" value={formatMoney(stats.averageOrder)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Umsatzverlauf">
              <div className="flex h-48 items-end gap-2">
                {stats.chartBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-slate-900" style={{ height: `${bucket.height}%` }} title={formatMoney(bucket.value)} />
                    <span className="text-[11px] font-semibold text-slate-500">{bucket.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Bestellungen nach Status">
              <Rows rows={(stats.ordersByStatus ?? []).map((row) => [row.status, String(row.count)])} />
            </Panel>
            <Panel title="Top-Produkte">
              <Rows rows={(stats.topProducts ?? []).map((row) => [row.name, `${row.quantity} Stk. · ${formatMoney(row.revenue)}`])} />
            </Panel>
            <Panel title="Letzte Bestellungen">
              <Rows rows={(stats.recentOrders ?? []).map((row) => [row.id, `${row.customer} · ${row.status} · ${formatMoney(row.total)}`])} />
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border bg-white p-4"><h3 className="mb-3 text-sm font-black text-slate-950">{title}</h3>{children}</div>;
}

function Rows({ rows }: { rows: Array<[string, string]> }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Keine Daten vorhanden.</p>;
  return <div className="grid gap-2">{rows.map(([label, value]) => <div key={`${label}-${value}`} className="flex items-center justify-between gap-3 border-t pt-2 text-sm"><span className="font-semibold text-slate-700">{label}</span><span className="text-right font-bold text-slate-950">{value}</span></div>)}</div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(value);
}
