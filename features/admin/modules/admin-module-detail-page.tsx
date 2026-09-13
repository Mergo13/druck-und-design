"use client";

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addAdminRecent } from "@/components/admin/admin-recents";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminRecord = Record<string, unknown> & { id: string; status?: string; items?: unknown[]; total?: number; amount?: number; customer?: string; email?: string; createdAt?: string; issuedAt?: string };

type ModuleDetailConfig = {
  moduleKey: "orders" | "quotes" | "invoices";
  title: string;
  listPath: string;
  statusChoices: string[];
};

type AdminModuleDetailPageProps = ModuleDetailConfig & {
  id: string;
};

export function AdminModuleDetailPage({ moduleKey, title, listPath, statusChoices, id }: AdminModuleDetailPageProps) {
  const [record, setRecord] = useState<AdminRecord | null>(null);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");
      const response = await fetch(`/api/admin/modules/${moduleKey}?page=1&pageSize=100&q=${encodeURIComponent(id)}`);
      if (!response.ok) {
        setMessage("Datensatz konnte nicht geladen werden.");
      } else {
        const payload = await response.json() as { items?: AdminRecord[] };
        const found = (payload.items ?? []).find((item) => item.id === id) ?? payload.items?.[0] ?? null;
        setRecord(found);
        setJson(found ? JSON.stringify(found, null, 2) : "");
        if (found) {
          addAdminRecent({
            id: found.id,
            type: title,
            label: String(found.customer ?? found.email ?? found.id),
            href: `${listPath}/${encodeURIComponent(found.id)}`,
            subtitle: String(found.status ?? "")
          });
        }
        if (!found) setMessage("Datensatz nicht gefunden.");
      }
      setLoading(false);
    }
    void load();
  }, [id, moduleKey]);

  const pageTitle = useMemo(() => `${title}: ${record?.id ?? id}`, [id, record?.id, title]);

  function setStatus(status: string) {
    if (!record) return;
    const next = { ...record, status };
    setRecord(next);
    setJson(JSON.stringify(next, null, 2));
  }

  async function save() {
    if (!record) return;
    setSaving(true);
    setMessage("");
    let data: AdminRecord;
    try {
      data = JSON.parse(json) as AdminRecord;
    } catch {
      setSaving(false);
      setMessage("JSON ist ungültig.");
      return;
    }
    const response = await fetch(`/api/admin/modules/${moduleKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data: editableData(data) })
    });
    const body = await response.json().catch(() => null) as AdminRecord | { message?: string } | null;
    setSaving(false);
    if (!response.ok) {
      const errorMessage = body && "message" in body && typeof body.message === "string" ? body.message : "Speichern fehlgeschlagen.";
      setMessage(errorMessage);
      return;
    }
    const saved = body as AdminRecord;
    setRecord(saved);
    setJson(JSON.stringify(saved, null, 2));
    setMessage("Gespeichert.");
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        description="Detailansicht mit bestehenden Admin-API-Aktionen. Beträge werden angezeigt, aber nicht neu berechnet."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={listPath}>
                <ArrowLeft className="h-4 w-4" />
                Zur Liste
              </Link>
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={loading || saving || !record}>
              <Save className="h-4 w-4" />
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </>
        }
      />
      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold text-slate-700">{message}</div> : null}
      {record ? (
        <div className="grid gap-4">
          <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-4">
            <Summary label="Kunde" value={record.customer ?? "-"} />
            <Summary label="E-Mail" value={record.email ?? "-"} />
            <Summary label="Betrag" value={formatMoney(record.total ?? record.amount)} />
            <div>
              <p className="text-xs font-black uppercase text-slate-500">Status</p>
              <Select value={String(record.status ?? "")} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{statusChoices.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {moduleKey === "orders" && Array.isArray(record.items) ? (
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Positionen</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-2">Produkt</th><th className="px-4 py-2">Menge</th><th className="px-4 py-2">Preis</th><th className="px-4 py-2">Konfiguration</th></tr>
                  </thead>
                  <tbody>
                    {record.items.map((item, index) => {
                      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
                      return (
                        <tr key={String(row.id ?? index)} className="border-t">
                          <td className="px-4 py-2 font-semibold">{String(row.name ?? row.productSlug ?? "-")}</td>
                          <td className="px-4 py-2">{String(row.quantity ?? row.qty ?? "-")}</td>
                          <td className="px-4 py-2">{formatMoney(Number(row.price ?? row.finalPrice ?? 0))}</td>
                          <td className="px-4 py-2 text-xs text-slate-600">{row.config ? JSON.stringify(row.config) : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-slate-950">Vollständige Daten</p>
              <Badge variant="outline">{moduleKey}</Badge>
            </div>
            <textarea value={json} onChange={(event) => setJson(event.target.value)} className="min-h-[520px] w-full rounded-md border bg-slate-950 p-4 font-mono text-xs text-slate-50 outline-none focus:ring-2 focus:ring-ring" spellCheck={false} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatMoney(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(number) : "-";
}

function editableData(record: AdminRecord) {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, issuedAt: _issuedAt, ...data } = record;
  return data;
}
