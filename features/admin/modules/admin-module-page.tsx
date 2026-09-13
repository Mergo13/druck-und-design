"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table/data-table";
import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { PageHeader } from "@/components/admin/page-header";
import { CsvExportMenu } from "@/components/admin/csv/csv-export-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { addAdminRecent } from "@/components/admin/admin-recents";

type AdminRecord = Record<string, unknown> & { id?: string; status?: string; createdAt?: string; updatedAt?: string };
type FieldType = "text" | "email" | "number" | "textarea" | "boolean" | "select" | "datetime";
type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  createOnly?: boolean;
  readOnly?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

type AdminModulePageProps = {
  moduleKey: string;
  title: string;
  description: string;
  csvResource?: string;
  detailBasePath?: string;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  formFields?: FormField[];
};

export function AdminModulePage({
  moduleKey,
  title,
  description,
  csvResource,
  detailBasePath,
  allowCreate,
  allowEdit,
  allowDelete,
  formFields
}: AdminModulePageProps) {
  const [rows, setRows] = useState<AdminRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [activeRecord, setActiveRecord] = useState<AdminRecord | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const fields = formFields ?? moduleFormFields[moduleKey] ?? [];
  const canCreate = allowCreate ?? fields.length > 0;
  const canEdit = allowEdit ?? fields.length > 0;
  const canDelete = allowDelete ?? !["activityLogs"].includes(moduleKey);

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/modules/${moduleKey}?page=1&pageSize=100`);
    if (!response.ok) {
      setError(`${title} konnten nicht geladen werden.`);
    } else {
      const json = await response.json() as { items?: AdminRecord[] };
      setRows(json.items ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [moduleKey, title]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1" && canCreate && !dialogMode) {
      openCreate();
      params.delete("new");
      window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }
    if (!rows.length) return;
    const openId = params.get("open");
    const record = openId ? rows.find((row) => String(row.id) === openId) : undefined;
    if (record && canEdit && !dialogMode) {
      openEdit(record);
      params.delete("open");
      window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    }
  }, [canCreate, canEdit, dialogMode, rows]);

  const keys = useMemo(() => {
    const preferred = ["id", "customer", "email", "code", "name", "subject", "amount", "total", "status", "active", "published", "createdAt"];
    const available = new Set(rows.flatMap((row) => Object.keys(row)));
    return preferred.filter((key) => available.has(key)).slice(0, 6);
  }, [rows]);

  const columns = useMemo<ColumnDef<AdminRecord>[]>(() => [
    ...keys.map((key) => ({
      accessorKey: key,
      header: ({ column }) => <DataTableColumnHeader column={column} title={labelForKey(key)} />,
      cell: ({ row }) => formatValue(row.original[key])
    }) satisfies ColumnDef<AdminRecord>),
    ...((detailBasePath || canEdit || canDelete) ? [{
      id: "actions",
      header: "",
      cell: ({ row }) => row.original.id ? (
        <div className="flex justify-end gap-1">
          {detailBasePath ? (
            <Button asChild type="button" variant="ghost" size="sm">
              <Link href={`${detailBasePath}/${encodeURIComponent(String(row.original.id))}`}>
                <Edit className="h-4 w-4" />
                Öffnen
              </Link>
            </Button>
          ) : null}
          {canEdit ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
              <Edit className="h-4 w-4" />
              Bearbeiten
            </Button>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="ghost" size="sm" className="text-red-700 hover:text-red-800" onClick={() => void removeRecord(String(row.original.id))}>
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          ) : null}
        </div>
      ) : null
    } satisfies ColumnDef<AdminRecord>] : [])
  ], [canDelete, canEdit, detailBasePath, keys]);

  function openCreate() {
    setActiveRecord(null);
    setForm(defaultForm(fields));
    setDialogMode("create");
  }

  function openEdit(record: AdminRecord) {
    setActiveRecord(record);
    setForm(defaultForm(fields, record));
    setDialogMode("edit");
  }

  function updateField(name: string, value: string | number | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitForm() {
    setMessage("");
    const data = normalizeForm(fields, form, dialogMode === "edit");
    const response = await fetch(`/api/admin/modules/${moduleKey}`, {
      method: dialogMode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dialogMode === "edit" ? { id: String(activeRecord?.id ?? ""), data } : data)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(body?.message ?? "Speichern fehlgeschlagen.");
      return;
    }
    setDialogMode(null);
    setMessage(dialogMode === "edit" ? "Änderungen gespeichert." : "Datensatz erstellt.");
    await load();
  }

  async function removeRecord(id: string) {
    if (!window.confirm("Diesen Datensatz wirklich löschen?")) return;
    setMessage("");
    const response = await fetch(`/api/admin/modules/${moduleKey}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(body?.message ?? "Löschen fehlgeschlagen.");
      return;
    }
    setMessage("Datensatz gelöscht.");
    await load();
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      {csvResource ? <CsvExportMenu resource={csvResource} /> : null}
      {canCreate ? <Button size="sm" type="button" onClick={openCreate}><Plus className="h-4 w-4" /> Neu</Button> : null}
    </div>
  );

  return (
    <>
      <PageHeader title={title} description={description} actions={headerActions} />
      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold">{message}</div> : null}
      <DataTable
        columns={columns}
        data={rows}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={`${title} suchen...`}
        loading={loading}
        error={error}
        getRowHref={detailBasePath ? (row) => row.id ? `${detailBasePath}/${encodeURIComponent(String(row.id))}` : undefined : undefined}
        onRowOpen={!detailBasePath && canEdit ? (row) => {
          if (row.id) {
            addAdminRecent({
              id: String(row.id),
              type: title,
              label: String(row.name ?? row.subject ?? row.customer ?? row.email ?? row.code ?? row.id),
              href: `${window.location.pathname}?open=${encodeURIComponent(String(row.id))}`,
              subtitle: String(row.status ?? row.email ?? "")
            });
          }
          openEdit(row);
        } : detailBasePath ? (row) => {
          if (!row.id) return;
          addAdminRecent({
            id: String(row.id),
            type: title,
            label: String(row.customer ?? row.email ?? row.id),
            href: `${detailBasePath}/${encodeURIComponent(String(row.id))}`,
            subtitle: String(row.status ?? "")
          });
        } : undefined}
      />
      <Dialog open={Boolean(dialogMode)} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "edit" ? `${title} bearbeiten` : `${title} anlegen`}</DialogTitle>
            <DialogDescription>Die Felder entsprechen der bestehenden Admin-API für dieses Modul.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.filter((field) => !(dialogMode === "edit" && field.createOnly)).map((field) => (
              <FormFieldControl key={field.name} field={field} value={form[field.name]} onChange={(value) => updateField(field.name, value)} />
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogMode(null)}>Abbrechen</Button>
            <Button type="button" onClick={() => void submitForm()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormFieldControl({ field, value, onChange }: { field: FormField; value: string | number | boolean | undefined; onChange: (value: string | number | boolean) => void }) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 rounded-md border bg-slate-50 p-3 text-sm font-semibold">
        <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => onChange(Boolean(checked))} />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase text-slate-500">{field.label}</span>
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={field.placeholder ?? "Auswählen"} /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="grid gap-1.5 md:col-span-2">
        <span className="text-xs font-black uppercase text-slate-500">{field.label}</span>
        <textarea
          className="min-h-32 rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
        />
      </label>
    );
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-slate-500">{field.label}</span>
      <Input
        type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type}
        step={field.type === "number" ? "0.01" : undefined}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
        placeholder={field.placeholder}
        readOnly={field.readOnly}
      />
    </label>
  );
}

function defaultForm(fields: FormField[], record?: AdminRecord) {
  return Object.fromEntries(fields.map((field) => {
    const existing = record?.[field.name];
    if (field.type === "boolean") return [field.name, typeof existing === "boolean" ? existing : false];
    if (field.type === "number") return [field.name, typeof existing === "number" ? existing : ""];
    if (field.type === "datetime") return [field.name, typeof existing === "string" ? toDateTimeLocal(existing) : ""];
    return [field.name, typeof existing === "string" || typeof existing === "number" ? String(existing) : ""];
  }));
}

function normalizeForm(fields: FormField[], form: Record<string, string | number | boolean>, isEdit: boolean) {
  const data: Record<string, string | number | boolean | null> = {};
  for (const field of fields) {
    if (isEdit && field.createOnly) continue;
    const value = form[field.name];
    if (field.type === "number") {
      if (value === "") continue;
      data[field.name] = Number(value);
    } else if (field.type === "boolean") {
      data[field.name] = Boolean(value);
    } else if (field.type === "datetime") {
      if (typeof value === "string" && value) data[field.name] = new Date(value).toISOString();
    } else {
      data[field.name] = typeof value === "string" ? value : String(value ?? "");
    }
  }
  return data;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toLocaleString("de-AT");
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleString("de-AT");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function labelForKey(key: string) {
  const labels: Record<string, string> = {
    id: "ID",
    customer: "Kunde",
    email: "E-Mail",
    code: "Code",
    name: "Name",
    subject: "Betreff",
    amount: "Betrag",
    total: "Summe",
    status: "Status",
    createdAt: "Erstellt am",
    updatedAt: "Aktualisiert am"
  };
  return labels[key] ?? key;
}

export const moduleFormFields: Record<string, FormField[]> = {
  quotes: [
    { name: "customer", label: "Kunde", type: "text", required: true },
    { name: "email", label: "E-Mail", type: "email", required: true },
    { name: "amount", label: "Betrag", type: "number", required: true },
    { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Entwurf" }, { value: "sent", label: "Gesendet" }, { value: "accepted", label: "Angenommen" }, { value: "declined", label: "Abgelehnt" }] },
    { name: "note", label: "Notiz", type: "textarea" }
  ],
  invoices: [
    { name: "invoiceNumber", label: "Rechnungsnummer", type: "text", placeholder: "Leer lassen für automatische Nummer" },
    { name: "customer", label: "Kunde", type: "text", required: true },
    { name: "email", label: "E-Mail", type: "email" },
    { name: "amount", label: "Betrag", type: "number", required: true },
    { name: "status", label: "Status", type: "select", options: [{ value: "Offen", label: "Offen" }, { value: "Bezahlt", label: "Bezahlt" }, { value: "Überfällig", label: "Überfällig" }, { value: "Storniert", label: "Storniert" }] },
    { name: "dueDate", label: "Fällig am", type: "datetime" }
  ],
  coupons: [
    { name: "code", label: "Code", type: "text", placeholder: "Leer lassen für automatischen Code" },
    { name: "discountType", label: "Rabattart", type: "select", options: [{ value: "percent", label: "Prozent" }, { value: "fixed", label: "Fixbetrag" }] },
    { name: "discountValue", label: "Rabattwert", type: "number", required: true },
    { name: "usageLimit", label: "Nutzungslimit", type: "number" },
    { name: "startsAt", label: "Gültig ab", type: "datetime" },
    { name: "endsAt", label: "Gültig bis", type: "datetime" },
    { name: "recipientEmail", label: "Empfänger E-Mail", type: "email", createOnly: true },
    { name: "recipientName", label: "Empfänger Name", type: "text", createOnly: true },
    { name: "active", label: "Aktiv", type: "boolean" },
    { name: "deliverToDashboard", label: "Im Kundenkonto anzeigen", type: "boolean", createOnly: true },
    { name: "sendPdfEmail", label: "PDF per E-Mail senden", type: "boolean", createOnly: true }
  ],
  reviews: [
    { name: "customer", label: "Kunde", type: "text", required: true },
    { name: "email", label: "E-Mail", type: "email" },
    { name: "orderId", label: "Bestellung", type: "text" },
    { name: "productName", label: "Produkt", type: "text" },
    { name: "rating", label: "Bewertung", type: "number", required: true },
    { name: "comment", label: "Kommentar", type: "textarea", required: true },
    { name: "adminNote", label: "Admin-Notiz", type: "textarea" },
    { name: "published", label: "Veröffentlicht", type: "boolean" }
  ],
  newsletter: [
    { name: "email", label: "E-Mail", type: "email", required: true },
    { name: "active", label: "Aktiv", type: "boolean" }
  ],
  customers: [
    { name: "email", label: "E-Mail", type: "email", required: true },
    { name: "fullName", label: "Name", type: "text" },
    { name: "company", label: "Firma", type: "text" },
    { name: "phone", label: "Telefon", type: "text" }
  ],
  newsletterCampaigns: [
    { name: "subject", label: "Betreff", type: "text", required: true },
    { name: "preheader", label: "Vorschautext", type: "text" },
    { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Entwurf" }, { value: "sent", label: "Senden/gesendet" }] },
    { name: "body", label: "Inhalt", type: "textarea", required: true },
    { name: "ctaLabel", label: "Button-Text", type: "text" },
    { name: "ctaUrl", label: "Button-Link", type: "text" }
  ],
  fileUploads: [
    { name: "status", label: "Status", type: "select", options: [{ value: "Neu", label: "Neu" }, { value: "In Prüfung", label: "In Prüfung" }, { value: "Erledigt", label: "Erledigt" }, { value: "Archiviert", label: "Archiviert" }] }
  ],
  studentArticles: [
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "title", label: "Titel", type: "text", required: true },
    { name: "excerpt", label: "Kurzbeschreibung", type: "textarea", required: true },
    { name: "category", label: "Kategorie", type: "select", options: [{ value: "ratgeber", label: "Ratgeber" }, { value: "druck", label: "Druck" }, { value: "bindung", label: "Bindung" }, { value: "kosten", label: "Kosten" }, { value: "hochschule", label: "Hochschule" }] },
    { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Entwurf" }, { value: "published", label: "Veröffentlicht" }] },
    { name: "featuredImage", label: "Bild URL", type: "text" },
    { name: "seoTitle", label: "SEO Titel", type: "text" },
    { name: "metaDescription", label: "Meta Description", type: "textarea" },
    { name: "canonicalUrl", label: "Canonical URL", type: "text" },
    { name: "body", label: "Artikeltext", type: "textarea", required: true },
    { name: "featured", label: "Featured", type: "boolean" },
    { name: "sortOrder", label: "Reihenfolge", type: "number" }
  ],
  studentVerifications: [
    { name: "email", label: "E-Mail", type: "email", readOnly: true },
    { name: "fullName", label: "Name", type: "text", readOnly: true },
    { name: "university", label: "Uni/FH", type: "text", readOnly: true },
    { name: "documentPath", label: "Interner Dokumentpfad", type: "text", readOnly: true },
    { name: "status", label: "Status", type: "select", options: [{ value: "pending", label: "Ausstehend" }, { value: "approved", label: "Bestätigt" }, { value: "rejected", label: "Abgelehnt" }] },
    { name: "validUntil", label: "Gültig bis", type: "text" },
    { name: "reviewNote", label: "Notiz", type: "textarea" }
  ],
  shipping: [
    { name: "name", label: "Versandart", type: "text", required: true },
    { name: "price", label: "Preis", type: "number", required: true },
    { name: "etaDays", label: "Lieferzeit in Tagen", type: "number", required: true },
    { name: "active", label: "Aktiv", type: "boolean" }
  ],
  paymentMethods: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "provider", label: "Provider", type: "text", required: true },
    { name: "active", label: "Aktiv", type: "boolean" }
  ],
  usersRoles: [
    { name: "email", label: "E-Mail", type: "email", required: true },
    { name: "name", label: "Name", type: "text" },
    { name: "roleId", label: "Rollen-ID", type: "text", required: true },
    { name: "active", label: "Aktiv", type: "boolean" }
  ],
  emailTemplates: [
    { name: "key", label: "Schlüssel", type: "text", required: true },
    { name: "subject", label: "Betreff", type: "text", required: true },
    { name: "body", label: "Inhalt", type: "textarea", required: true },
    { name: "active", label: "Aktiv", type: "boolean" }
  ],
  security: [
    { name: "level", label: "Level", type: "select", options: [{ value: "info", label: "Info" }, { value: "warning", label: "Warnung" }, { value: "error", label: "Fehler" }] },
    { name: "event", label: "Ereignis", type: "text", required: true }
  ],
  backups: [
    { name: "label", label: "Bezeichnung", type: "text", required: true },
    { name: "status", label: "Status", type: "text" },
    { name: "location", label: "Speicherort", type: "text" }
  ]
};
