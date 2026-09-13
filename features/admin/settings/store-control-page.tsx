"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { BackupToolPage, CrmToolPage, EmailConfigToolPage, SystemDangerPage } from "@/features/admin/tools/admin-tool-pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsResponse = {
  storeControl: {
    maintenanceMode?: boolean;
    vacationMode?: boolean;
    disableCheckout?: boolean;
    announcementBar?: string | null;
    maintenanceAvailableAt?: string | null;
    studentDiscountPercent?: number;
  };
  company: {
    name?: string;
    legalName?: string | null;
    email?: string | null;
    phone?: string | null;
    vatId?: string | null;
    address?: string | null;
    website?: string | null;
  };
  tax: { vatPercent?: number };
};

export function StoreControlPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/settings");
      if (response.ok) setSettings(await response.json() as SettingsResponse);
    }
    void load();
  }, []);

  async function save(next: SettingsResponse) {
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    if (response.ok) {
      setSettings(await response.json() as SettingsResponse);
      setMessage("Gespeichert.");
    } else {
      setMessage("Speichern fehlgeschlagen.");
    }
    setSaving(false);
  }

  function updateStoreControl(next: Partial<SettingsResponse["storeControl"]>) {
    if (!settings) return;
    setSettings({ ...settings, storeControl: { ...settings.storeControl, ...next } });
  }

  return (
    <>
      <PageHeader title="Shop-Steuerung" description="Tägliche Betriebssteuerung für Wartungsmodus, Urlaubsmodus, Checkout-Verfügbarkeit und Ankündigungsleiste." actions={<Button size="sm" onClick={() => settings && void save(settings)} disabled={!settings || saving}>{saving ? "Speichert..." : "Speichern"}</Button>} />
      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold">{message}</div> : null}
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Toggle label="Wartungsmodus" checked={Boolean(settings?.storeControl.maintenanceMode)} onChange={(checked) => updateStoreControl({ maintenanceMode: checked })} />
          <Toggle label="Urlaubsmodus" checked={Boolean(settings?.storeControl.vacationMode)} onChange={(checked) => updateStoreControl({ vacationMode: checked })} />
          <Toggle label="Checkout deaktivieren" checked={Boolean(settings?.storeControl.disableCheckout)} onChange={(checked) => updateStoreControl({ disableCheckout: checked })} />
        </div>
        <label className="mt-4 grid gap-1.5">
          <span className="text-xs font-black uppercase text-slate-500">Ankündigungsleiste</span>
          <textarea value={settings?.storeControl.announcementBar ?? ""} onChange={(event) => updateStoreControl({ announcementBar: event.target.value })} className="min-h-28 rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
    </>
  );
}

export function SettingsConsolidatedPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/settings");
      if (response.ok) setSettings(await response.json() as SettingsResponse);
      else setMessage("Einstellungen konnten nicht geladen werden.");
    }
    void load();
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: {
          name: settings.company.name || "DUD Studio",
          legalName: settings.company.legalName || "",
          email: settings.company.email || "",
          phone: settings.company.phone || "",
          vatId: settings.company.vatId || "",
          address: settings.company.address || "",
          website: settings.company.website || ""
        },
        tax: { vatPercent: Number(settings.tax.vatPercent ?? 20) },
        storeControl: {
          maintenanceMode: Boolean(settings.storeControl.maintenanceMode),
          vacationMode: Boolean(settings.storeControl.vacationMode),
          disableCheckout: Boolean(settings.storeControl.disableCheckout),
          studentDiscountPercent: Number(settings.storeControl.studentDiscountPercent ?? 20),
          announcementBar: settings.storeControl.announcementBar || ""
        }
      })
    });
    if (response.ok) {
      setSettings(await response.json() as SettingsResponse);
      setMessage("Gespeichert.");
    } else {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(body?.message ?? "Speichern fehlgeschlagen.");
    }
    setSaving(false);
  }

  function updateCompany(key: keyof SettingsResponse["company"], value: string) {
    if (!settings) return;
    setSettings({ ...settings, company: { ...settings.company, [key]: value } });
  }

  function updateTax(value: string) {
    if (!settings) return;
    setSettings({ ...settings, tax: { ...settings.tax, vatPercent: Number(value) } });
  }

  function updateStore(key: keyof SettingsResponse["storeControl"], value: string | boolean | number) {
    if (!settings) return;
    setSettings({ ...settings, storeControl: { ...settings.storeControl, [key]: value } });
  }

  return (
    <>
      <PageHeader title="Einstellungen" description="Gebündelte Einstellungen mit Tabs statt dauerhafter Seitenleisten-Einträge." actions={<Button size="sm" onClick={() => void save()} disabled={!settings || saving}>{saving ? "Speichert..." : "Speichern"}</Button>} />
      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold">{message}</div> : null}
      <Tabs defaultValue="general">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="company">Unternehmen</TabsTrigger>
          <TabsTrigger value="payments">Zahlungen</TabsTrigger>
          <TabsTrigger value="tax">Steuern</TabsTrigger>
          <TabsTrigger value="users">Benutzer</TabsTrigger>
          <TabsTrigger value="email">E-Mail</TabsTrigger>
          <TabsTrigger value="integrations">CRM / Integrationen</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
            <Toggle label="Wartungsmodus" checked={Boolean(settings?.storeControl.maintenanceMode)} onChange={(checked) => updateStore("maintenanceMode", checked)} />
            <Toggle label="Urlaubsmodus" checked={Boolean(settings?.storeControl.vacationMode)} onChange={(checked) => updateStore("vacationMode", checked)} />
            <Toggle label="Checkout deaktivieren" checked={Boolean(settings?.storeControl.disableCheckout)} onChange={(checked) => updateStore("disableCheckout", checked)} />
            <Field label="Studentenrabatt (%)"><Input type="number" value={settings?.storeControl.studentDiscountPercent ?? 20} onChange={(event) => updateStore("studentDiscountPercent", Number(event.target.value))} /></Field>
            <label className="grid gap-1.5 md:col-span-2">
              <span className="text-xs font-black uppercase text-slate-500">Ankündigungsleiste</span>
              <textarea className="min-h-24 rounded-md border p-3 text-sm" value={settings?.storeControl.announcementBar ?? ""} onChange={(event) => updateStore("announcementBar", event.target.value)} />
            </label>
          </div>
        </TabsContent>
        <TabsContent value="company">
          <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
            <Field label="Name"><Input value={settings?.company.name ?? ""} onChange={(event) => updateCompany("name", event.target.value)} /></Field>
            <Field label="Rechtlicher Name"><Input value={settings?.company.legalName ?? ""} onChange={(event) => updateCompany("legalName", event.target.value)} /></Field>
            <Field label="E-Mail"><Input value={settings?.company.email ?? ""} onChange={(event) => updateCompany("email", event.target.value)} /></Field>
            <Field label="Telefon"><Input value={settings?.company.phone ?? ""} onChange={(event) => updateCompany("phone", event.target.value)} /></Field>
            <Field label="UID"><Input value={settings?.company.vatId ?? ""} onChange={(event) => updateCompany("vatId", event.target.value)} /></Field>
            <Field label="Website"><Input value={settings?.company.website ?? ""} onChange={(event) => updateCompany("website", event.target.value)} /></Field>
            <label className="grid gap-1.5 md:col-span-2">
              <span className="text-xs font-black uppercase text-slate-500">Adresse</span>
              <textarea className="min-h-24 rounded-md border p-3 text-sm" value={settings?.company.address ?? ""} onChange={(event) => updateCompany("address", event.target.value)} />
            </label>
          </div>
        </TabsContent>
        <TabsContent value="payments"><AdminModulePage moduleKey="paymentMethods" title="Zahlungsarten" description="Bestehende Zahlungsarten aus der Admin-API." /></TabsContent>
        <TabsContent value="tax">
          <div className="rounded-lg border bg-white p-4">
            <Field label="Umsatzsteuer (%)"><Input type="number" step="0.01" value={settings?.tax.vatPercent ?? 20} onChange={(event) => updateTax(event.target.value)} /></Field>
          </div>
        </TabsContent>
        <TabsContent value="users"><AdminModulePage moduleKey="usersRoles" title="Benutzer & Rollen" description="Admin-Benutzer und Rollen aus der bestehenden Rechteverwaltung." /></TabsContent>
        <TabsContent value="email">
          <div className="grid gap-4">
            <EmailConfigToolPage />
            <AdminModulePage moduleKey="emailTemplates" title="E-Mail-Vorlagen" description="Vorlagen aus der bestehenden Admin-API." />
          </div>
        </TabsContent>
        <TabsContent value="integrations"><CrmToolPage /></TabsContent>
        <TabsContent value="security"><AdminModulePage moduleKey="security" title="Sicherheit" description="Sicherheitsereignisse aus der Datenbank." /></TabsContent>
        <TabsContent value="system">
          <div className="grid gap-4">
            <BackupToolPage />
            <AdminModulePage moduleKey="activityLogs" title="Aktivitätsprotokolle" description="Audit-Logs der Admin-Aktionen." />
            <AdminModulePage moduleKey="backups" title="Backups" description="Backup-Datensätze aus der bestehenden Admin-API." />
            <SystemDangerPage />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black uppercase text-slate-500">{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border bg-slate-50 p-3">
      <span className="text-sm font-black text-slate-950">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-slate-950" />
    </label>
  );
}
