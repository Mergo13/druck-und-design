"use client";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField as MuiTextField, Typography } from "@mui/material";
import Image from "next/image";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Admin,
  ArrayInput,
  BooleanField,
  BooleanInput,
  Create,
  DataProvider,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  RaRecord,
  Resource,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required,
  CustomRoutes,
  useRedirect,
  useGetList,
  useNotify,
  useRecordContext
} from "react-admin";
import { Route } from "react-router-dom";
import { useFormContext, useWatch } from "react-hook-form";

type AdminRecord = RaRecord & {
  slug?: string;
  name?: string;
};

function normalizeCatalogRecordForAdmin(record: AdminRecord): AdminRecord {
  if (!Array.isArray(record.properties)) return record;
  return {
    ...record,
    properties: record.properties.map((property: { values?: unknown[] }) => ({
      ...property,
      values: Array.isArray(property.values)
        ? property.values.map((value) => typeof value === "string" ? { value } : value)
        : []
    }))
  };
}

const catalogApiUrl = "/api/catalog";
const catalogResources = new Set(["products", "categories"]);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({} as { message?: string }));
    const message = typeof errorBody?.message === "string" && errorBody.message
      ? errorBody.message
      : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

const dataProvider = {
  getList: async (resource: string, params: { pagination?: { page: number; perPage: number }; filter?: Record<string, unknown> }) => {
    if (catalogResources.has(resource)) {
      const data = await fetchJson<AdminRecord[]>(`${catalogApiUrl}/${resource}?scope=admin`);
      return {
        data: data.map((item) => normalizeCatalogRecordForAdmin({ ...item, visible: item.visible ?? true, published: item.published ?? true, id: item.slug ?? item.id })),
        total: data.length
      };
    }
    const query = new URLSearchParams({
      page: String(params.pagination?.page ?? 1),
      pageSize: String(params.pagination?.perPage ?? 25)
    });
    const q = params.filter?.q;
    const status = params.filter?.status;
    if (typeof q === "string" && q) query.set("q", q);
    if (typeof status === "string" && status) query.set("status", status);
    const payload = await fetchJson<{ items: AdminRecord[]; total: number }>(`/api/admin/modules/${resource}?${query}`);
    return { data: payload.items.map((item) => ({ ...item, id: item.id })), total: payload.total };
  },
  getOne: async (resource: string, params: { id: string }) => {
    if (catalogResources.has(resource)) {
      const data = await fetchJson<AdminRecord>(`${catalogApiUrl}/${resource}/${params.id}?scope=admin`);
      return { data: normalizeCatalogRecordForAdmin({ ...data, visible: data.visible ?? true, published: data.published ?? true, id: data.slug ?? data.id }) };
    }
    const payload = await fetchJson<{ items: AdminRecord[] }>(`/api/admin/modules/${resource}?q=${encodeURIComponent(params.id)}&page=1&pageSize=100`);
    const item = payload.items.find((entry) => String(entry.id) === String(params.id));
    if (!item) throw new Error("Datensatz nicht gefunden.");
    return { data: { ...item, id: item.id } };
  },
  getMany: async (resource: string, params: { ids: string[] }) => {
    const items = await Promise.all(params.ids.map((id) => dataProvider.getOne(resource, { id })));
    return { data: items.map((item) => item.data) };
  },
  getManyReference: async () => ({ data: [], total: 0 }),
  create: async (resource: string, params: { data: AdminRecord }) => {
    const { id: _id, ...payload } = params.data;
    const endpoint = catalogResources.has(resource) ? `${catalogApiUrl}/${resource}` : `/api/admin/modules/${resource}`;
    const data = await fetchJson<AdminRecord>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { data: { ...data, id: data.slug ?? data.id } };
  },
  update: async (resource: string, params: { id: string; data: AdminRecord; previousData?: AdminRecord }) => {
    const merged = { ...(params.previousData ?? {}), ...params.data };
    const { id: _id, ...rest } = merged;
    const isCatalog = catalogResources.has(resource);
    const payload = resource === "categories"
      ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
      : resource === "products"
        ? { ...rest, slug: params.id }
        : { id: params.id, data: rest };
    const data = await fetchJson<AdminRecord>(isCatalog ? `${catalogApiUrl}/${resource}` : `/api/admin/modules/${resource}`, {
      method: isCatalog ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { data: { ...data, id: data.slug ?? data.id } };
  },
  updateMany: async () => ({ data: [] }),
  delete: async (resource: string, params: { id: string }) => {
    if (catalogResources.has(resource)) {
      await fetchJson(`${catalogApiUrl}/${resource}/${params.id}`, { method: "DELETE" });
    } else {
      await fetchJson(`/api/admin/modules/${resource}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [params.id] })
      });
    }
    return { data: { id: params.id } };
  },
  deleteMany: async (resource: string, params: { ids: string[] }) => {
    if (catalogResources.has(resource)) {
      await Promise.all(params.ids.map((id) => fetchJson(`${catalogApiUrl}/${resource}/${id}`, { method: "DELETE" })));
    } else {
      await fetchJson(`/api/admin/modules/${resource}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: params.ids })
      });
    }
    return { data: params.ids };
  }
} as unknown as DataProvider;

function DashboardCard({ label, value }: { label: string; value: string }) {
  return (
    <Card sx={{ borderRadius: 3, borderColor: "#e2e8f0", boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 12px 32px rgba(15,23,42,.08)" }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", fontSize: 11 }}>{label}</Typography>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

type AdminOrderItem = { id: string; total: number; createdAt: string; status?: string };
type PeriodKey = "7d" | "30d" | "90d" | "365d";

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

function AdminDashboardHome() {
  const { total: productsTotal } = useGetList("products", { pagination: { page: 1, perPage: 1 }, sort: { field: "name", order: "ASC" } });
  const { total: categoriesTotal } = useGetList("categories", { pagination: { page: 1, perPage: 1 }, sort: { field: "name", order: "ASC" } });
  const redirect = useRedirect();
  const notify = useNotify();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [vatPercent, setVatPercent] = useState(20);
  const [savingTax, setSavingTax] = useState(false);

  const tools = [
    { label: "Wartungsmodus", path: "/tools/maintenance", color: "primary" as const },
    { label: "Online Shop", path: "/tools/online-shop", color: "primary" as const },
    { label: "Urlaubsmodus", path: "/tools/vacation", color: "primary" as const },
    { label: "E-Mail Konfiguration", path: "/tools/email", color: "primary" as const },
    { label: "Upload-Ordner", path: "/tools/uploads", color: "primary" as const },
    { label: "Bildpfade Import", path: "/tools/image-import", color: "primary" as const },
    { label: "Website Bilder", path: "/tools/site-images", color: "primary" as const },
    { label: "Backup", path: "/tools/backup", color: "primary" as const },
    { label: "Werbung", path: "/tools/werbung", color: "primary" as const },
    { label: "CRM", path: "/tools/crm", color: "primary" as const },
    { label: "Shutdown", path: "/tools/shutdown", color: "error" as const },
    { label: "Layout Studio", path: "/tools/layouts", color: "inherit" as const }
  ];

  useEffect(() => {
    void (async () => {
      setLoadingStats(true);
      try {
        const [ordersRes, taxRes] = await Promise.all([
          fetch("/api/admin/modules/orders?page=1&pageSize=1000"),
          fetch("/api/admin/tools?action=tax")
        ]);
        if (ordersRes.ok) {
          const payload = await ordersRes.json() as { items: AdminOrderItem[] };
          setOrders(payload.items ?? []);
        }
        if (taxRes.ok) {
          const payload = await taxRes.json() as { vatPercent: number };
          setVatPercent(Number(payload.vatPercent ?? 20));
        }
      } catch {
        notify("Dashboard-Daten konnten nicht geladen werden.", { type: "error" });
      } finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const fromDate = useMemo(() => new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000), [periodDays]);
  const filteredOrders = useMemo(() => orders.filter((order) => new Date(order.createdAt) >= fromDate), [orders, fromDate]);
  const grossRevenue = useMemo(() => filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0), [filteredOrders]);
  const taxAmount = useMemo(() => grossRevenue * (vatPercent / (100 + vatPercent)), [grossRevenue, vatPercent]);
  const netRevenue = useMemo(() => grossRevenue - taxAmount, [grossRevenue, taxAmount]);
  const averageOrder = useMemo(() => filteredOrders.length ? grossRevenue / filteredOrders.length : 0, [filteredOrders, grossRevenue]);

  const chartBuckets = useMemo(() => {
    const bucketCount = period === "7d" ? 7 : period === "30d" ? 10 : period === "90d" ? 12 : 12;
    const spanDays = Math.max(1, Math.round(periodDays / bucketCount));
    const labels: string[] = [];
    const values = Array.from({ length: bucketCount }, () => 0);
    for (let i = 0; i < bucketCount; i += 1) {
      const point = new Date(fromDate.getTime() + i * spanDays * 24 * 60 * 60 * 1000);
      labels.push(point.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }));
    }
    for (const order of filteredOrders) {
      const diffDays = Math.floor((new Date(order.createdAt).getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(diffDays / spanDays)));
      values[idx] += Number(order.total || 0);
    }
    const max = Math.max(1, ...values);
    return values.map((value, index) => ({
      label: labels[index],
      value,
      height: Math.max(6, (value / max) * 100)
    }));
  }, [filteredOrders, fromDate, period, periodDays]);

  async function saveTax() {
    setSavingTax(true);
    try {
      const res = await fetch("/api/admin/tools?action=tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatPercent })
      });
      if (!res.ok) throw new Error();
      notify("Steuersatz gespeichert.", { type: "success" });
    } catch {
      notify("Steuersatz konnte nicht gespeichert werden.", { type: "error" });
    } finally {
      setSavingTax(false);
    }
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h5">DUD Studio Admin</Typography>
        <Typography variant="body2" color="text.secondary">Schnellzugriffe für den täglichen Betrieb.</Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={1.5}>
          {tools.map((tool) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tool.path}>
              <Button
                fullWidth
                variant={tool.color === "inherit" ? "outlined" : "contained"}
                color={tool.color}
                sx={{ minHeight: 84, textAlign: "center", fontWeight: 700, fontSize: 15, borderRadius: 2 }}
                onClick={() => redirect(tool.path)}
              >
                {tool.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardCard label="Products" value={String(productsTotal ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DashboardCard label="Categories" value={String(categoriesTotal ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
              <Typography variant="h6">Umsatz Analytics</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { key: "7d", label: "Woche" },
                  { key: "30d", label: "Monat" },
                  { key: "90d", label: "Quartal" },
                  { key: "365d", label: "Jahr" }
                ].map((item) => (
                  <Button key={item.key} variant={period === item.key ? "contained" : "outlined"} size="small" onClick={() => setPeriod(item.key as PeriodKey)}>
                    {item.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Brutto Umsatz" value={formatCurrency(grossRevenue)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label={`Netto (bei ${vatPercent}%)`} value={formatCurrency(netRevenue)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="MwSt Betrag" value={formatCurrency(taxAmount)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Ø Bestellwert" value={formatCurrency(averageOrder)} /></Grid>
            </Grid>

            <Box sx={{ mt: 2, border: "1px solid #e2e8f0", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Umsatzverlauf</Typography>
              <Box sx={{ height: 180, display: "flex", alignItems: "flex-end", gap: 0.75 }}>
                {chartBuckets.map((bucket) => (
                  <Box key={bucket.label} sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: `${bucket.height}%`,
                        borderRadius: 1,
                        bgcolor: "#2563eb",
                        transition: "height 500ms ease"
                      }}
                      title={`${bucket.label}: ${formatCurrency(bucket.value)}`}
                    />
                    <Typography variant="caption" sx={{ display: "block", mt: 0.4, textAlign: "center", color: "#64748b" }}>
                      {bucket.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 2, display: "grid", gap: 1.25 }}>
              <Typography variant="subtitle2">Steuer (MwSt)</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <MuiTextField
                  size="small"
                  type="number"
                  label="MwSt %"
                  value={vatPercent}
                  onChange={(event) => setVatPercent(Number(event.target.value))}
                  sx={{ width: 130 }}
                />
                <Button variant="contained" onClick={() => void saveTax()} disabled={savingTax}>
                  {savingTax ? "Speichert..." : "Steuer speichern"}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Standard: 20%. Der Satz wird für Netto/Brutto Umsatzberechnung im Dashboard verwendet.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {loadingStats ? (
        <Grid size={{ xs: 12 }}>
          <Typography variant="caption" color="text.secondary">Analytics wird geladen...</Typography>
        </Grid>
      ) : null}
    </Grid>
  );
}

function ProductList() {
  return (
    <List sort={{ field: "name", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="slug" />
        <TextField source="name" />
        <TextField source="category" />
        <BooleanField source="visible" />
        <BooleanField source="published" />
        <NumberField source="basePrice" />
        <DateField source="updatedAt" emptyText="-" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" confirmTitle="Produkt löschen?" confirmContent="Diese Aktion kann nicht rückgängig gemacht werden." />
      </Datagrid>
    </List>
  );
}

function OrdersList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="id" label="Bestellung" />
        <TextField source="customer" label="Kunde" />
        <TextField source="email" label="E-Mail" />
        <NumberField source="total" label="Summe" options={{ style: "currency", currency: "EUR" }} />
        <TextField source="status" label="Status" />
        <DateField source="createdAt" label="Eingang" showTime />
        <EditButton />
      </Datagrid>
    </List>
  );
}

function OrderEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="customer" label="Kunde" validate={[required()]} />
        <TextInput source="email" label="E-Mail" />
        <NumberInput source="total" label="Summe" disabled />
        <SelectInput source="status" choices={[
          { id: "Anfrage", name: "Anfrage" },
          { id: "Neu", name: "Neu" },
          { id: "Bezahlt", name: "Bezahlt" },
          { id: "In Prüfung", name: "In Prüfung" },
          { id: "In Produktion", name: "In Produktion" },
          { id: "Versendet", name: "Versendet" },
          { id: "Storniert", name: "Storniert" }
        ]} />
        <TextInput source="billingAddress" label="Rechnungsadresse" multiline />
        <TextInput source="shippingAddress" label="Lieferadresse" multiline />
      </SimpleForm>
    </Edit>
  );
}

function InvoicesList() {
  return (
    <List sort={{ field: "issuedAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="id" label="Rechnung" />
        <TextField source="customer" label="Kunde" />
        <NumberField source="amount" label="Betrag" options={{ style: "currency", currency: "EUR" }} />
        <TextField source="status" label="Status" />
        <DateField source="issuedAt" label="Ausgestellt" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function InvoiceForm() {
  return (
    <>
      <TextInput source="id" label="Rechnungsnummer" validate={[required()]} />
      <TextInput source="customer" label="Kunde" validate={[required()]} />
      <NumberInput source="amount" label="Betrag" min={0} validate={[required()]} />
      <SelectInput source="status" defaultValue="Offen" choices={[
        { id: "Offen", name: "Offen" },
        { id: "Bezahlt", name: "Bezahlt" },
        { id: "Überfällig", name: "Überfällig" },
        { id: "Storniert", name: "Storniert" }
      ]} />
      <TextInput source="dueDate" label="Fälligkeitsdatum (ISO)" />
    </>
  );
}

function InvoiceEdit() {
  return <Edit><SimpleForm><InvoiceForm /></SimpleForm></Edit>;
}

function InvoiceCreate() {
  return <Create><SimpleForm><InvoiceForm /></SimpleForm></Create>;
}

function QuotesList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="customer" label="Kunde" />
        <TextField source="email" label="E-Mail" />
        <NumberField source="amount" label="Betrag" options={{ style: "currency", currency: "EUR" }} />
        <TextField source="status" label="Status" />
        <DateField source="createdAt" label="Erstellt" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function QuoteForm() {
  return (
    <>
      <TextInput source="customer" label="Kunde" validate={[required()]} />
      <TextInput source="email" label="E-Mail" type="email" validate={[required()]} />
      <NumberInput source="amount" label="Betrag" min={0} validate={[required()]} />
      <SelectInput source="status" defaultValue="draft" choices={[
        { id: "draft", name: "Entwurf" },
        { id: "sent", name: "Gesendet" },
        { id: "accepted", name: "Angenommen" },
        { id: "rejected", name: "Abgelehnt" }
      ]} />
      <TextInput source="note" label="Notiz" multiline />
    </>
  );
}

function QuoteEdit() {
  return <Edit><SimpleForm><QuoteForm /></SimpleForm></Edit>;
}

function QuoteCreate() {
  return <Create><SimpleForm><QuoteForm /></SimpleForm></Create>;
}

function FileUploadsList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Name" />
        <TextField source="email" label="E-Mail" />
        <TextField source="topic" label="Thema" />
        <TextField source="status" label="Status" />
        <DateField source="createdAt" label="Eingang" showTime />
        <EditButton />
      </Datagrid>
    </List>
  );
}

function FileUploadEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="name" label="Name" disabled />
        <TextInput source="email" label="E-Mail" disabled />
        <TextInput source="topic" label="Thema" disabled />
        <TextInput source="message" label="Nachricht" multiline disabled />
        <SelectInput source="status" choices={[
          { id: "new", name: "Neu" },
          { id: "in-progress", name: "In Bearbeitung" },
          { id: "completed", name: "Erledigt" }
        ]} />
      </SimpleForm>
    </Edit>
  );
}

function CouponsList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="code" label="Code" />
        <TextField source="discountType" label="Art" />
        <NumberField source="discountValue" label="Wert" />
        <BooleanField source="active" label="Aktiv" />
        <NumberField source="usedCount" label="Verwendet" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function CouponForm({ includeDelivery = false }: { includeDelivery?: boolean }) {
  return (
    <>
      <TextInput source="code" label="Code" validate={[required()]} />
      <SelectInput source="discountType" defaultValue="percent" choices={[
        { id: "percent", name: "Prozent" },
        { id: "fixed", name: "Fixbetrag" }
      ]} />
      <NumberInput source="discountValue" label="Rabattwert" min={0} validate={[required()]} />
      <BooleanInput source="active" label="Aktiv" defaultValue />
      <NumberInput source="usageLimit" label="Nutzungslimit" min={1} />
      {includeDelivery ? (
        <>
          <TextInput source="recipientEmail" label="Empfänger E-Mail" type="email" helperText="Optional: erstellt den Gutschein direkt im Kundenkonto und/oder sendet PDF per E-Mail." />
          <TextInput source="recipientName" label="Empfänger Name" />
          <BooleanInput source="deliverToDashboard" label="Im Kundenkonto anzeigen" defaultValue />
          <BooleanInput source="sendPdfEmail" label="PDF per E-Mail senden" />
        </>
      ) : null}
    </>
  );
}

function CouponEdit() {
  return <Edit><SimpleForm><CouponForm /></SimpleForm></Edit>;
}

function CouponCreate() {
  return <Create><SimpleForm><CouponForm includeDelivery /></SimpleForm></Create>;
}

function ReviewsList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="customer" label="Kunde" />
        <NumberField source="rating" label="Bewertung" />
        <TextField source="comment" label="Kommentar" />
        <BooleanField source="published" label="Veröffentlicht" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function ReviewEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="customer" label="Kunde" validate={[required()]} />
        <NumberInput source="rating" label="Bewertung" min={1} max={5} validate={[required()]} />
        <TextInput source="comment" label="Kommentar" multiline validate={[required()]} />
        <BooleanInput source="published" label="Veröffentlicht" />
      </SimpleForm>
    </Edit>
  );
}

function NewsletterList() {
  return (
    <List>
      <Datagrid>
        <TextField source="email" label="E-Mail" />
        <BooleanField source="active" label="Aktiv" />
        <DateField source="createdAt" label="Registriert" />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function ShippingList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" label="Versandart" />
        <NumberField source="price" label="Preis" options={{ style: "currency", currency: "EUR" }} />
        <NumberField source="etaDays" label="Tage" />
        <BooleanField source="active" label="Aktiv" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function ShippingForm() {
  return (
    <>
      <TextInput source="name" label="Versandart" validate={[required()]} />
      <NumberInput source="price" label="Preis" min={0} validate={[required()]} />
      <NumberInput source="etaDays" label="Lieferzeit in Tagen" min={0} validate={[required()]} />
      <BooleanInput source="active" label="Aktiv" defaultValue />
    </>
  );
}

function ShippingEdit() {
  return <Edit><SimpleForm><ShippingForm /></SimpleForm></Edit>;
}

function ShippingCreate() {
  return <Create><SimpleForm><ShippingForm /></SimpleForm></Create>;
}

function ProductImageUploadControls() {
  const notify = useNotify();
  const { setValue } = useFormContext();
  const record = useRecordContext<AdminRecord & { heroImage?: string; gallery?: string[] }>();
  const heroImage = useWatch({ name: "heroImage" }) as string | undefined;
  const gallery = (useWatch({ name: "gallery" }) as string[] | undefined) ?? [];
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads/product-image", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    const payload = await response.json() as { url: string };
    return payload.url;
  }

  async function onHeroImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadFile(file);
      setValue("heroImage", url, { shouldDirty: true });
      notify("Hero image updated.", { type: "success" });
    } catch {
      notify("Image upload failed.", { type: "error" });
    } finally {
      setUploadingHero(false);
      event.target.value = "";
    }
  }

  async function onGalleryImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadFile(file)));
      const nextGallery = Array.from(new Set([...(gallery ?? []), ...urls]));
      setValue("gallery", nextGallery, { shouldDirty: true });
      notify(`${urls.length} image${urls.length === 1 ? "" : "s"} added to gallery.`, { type: "success" });
    } catch {
      notify("Image upload failed.", { type: "error" });
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  }

  const currentHero = heroImage ?? record?.heroImage;
  const currentGallery = gallery.length > 0 ? gallery : (record?.gallery ?? []);
  const removeHeroImage = () => {
    setValue("heroImage", "", { shouldDirty: true });
    notify("Hero image removed.", { type: "info" });
  };

  const removeGalleryImage = (url: string) => {
    const nextGallery = currentGallery.filter((item) => item !== url);
    setValue("gallery", nextGallery, { shouldDirty: true });
    notify("Gallery image removed.", { type: "info" });
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5, mb: 1 }}>
      <Typography variant="subtitle2">Product Images</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="outlined" component="label" disabled={uploadingHero}>
          {uploadingHero ? "Uploading hero..." : "Upload Hero Image"}
          <input type="file" accept="image/*,.heic,.heif" hidden onChange={onHeroImageChange} />
        </Button>
        <Button variant="outlined" component="label" disabled={uploadingGallery}>
          {uploadingGallery ? "Adding to gallery..." : "Add Gallery Images"}
          <input type="file" accept="image/*,.heic,.heif" multiple hidden onChange={onGalleryImageChange} />
        </Button>
      </Box>
      {currentHero ? (
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 180 }}>
            <Typography variant="caption" color="text.secondary">Hero Preview</Typography>
            <IconButton size="small" aria-label="Remove hero image" onClick={removeHeroImage}>
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box sx={{ mt: 0.5, border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", width: 180, height: 100, position: "relative" }}>
            <Image src={currentHero} alt="Hero" fill style={{ objectFit: "cover" }} />
          </Box>
        </Box>
      ) : null}
      {currentGallery.length > 0 ? (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Gallery ({currentGallery.length})</Typography>
          <Box sx={{ mt: 0.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {currentGallery.slice(0, 12).map((url) => (
              <Box key={url} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", width: 84, height: 56, position: "relative" }}>
                <Image src={url} alt="Gallery" fill style={{ objectFit: "cover" }} />
                <IconButton
                  size="small"
                  aria-label="Remove gallery image"
                  onClick={() => removeGalleryImage(url)}
                  sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "white" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function ProductEdit() {
  return (
    <Edit>
      <SimpleForm>
        <ProductImageUploadControls />
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <ProductCategorySelect />
        <TextInput source="short" multiline />
        <TextInput source="description" multiline />
        <TextInput source="seo" multiline />
        <BooleanInput source="visible" label="Sichtbar im Shop" />
        <BooleanInput source="published" label="Veröffentlicht" />
        <TextInput source="heroImage" />
        <NumberInput source="basePrice" />
        <TextInput source="deliveryText" />
        <ProductCategoryPropertiesControl />
      </SimpleForm>
    </Edit>
  );
}

function ProductCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ visible: true, published: true, rating: 4.8, tags: [], gallery: [], variants: [], enabledCategoryProperties: [], production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" } }}>
        <ProductImageUploadControls />
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <ProductCategorySelect />
        <TextInput source="short" multiline />
        <TextInput source="description" multiline />
        <TextInput source="seo" multiline />
        <BooleanInput source="visible" label="Sichtbar im Shop" />
        <BooleanInput source="published" label="Veröffentlicht" />
        <TextInput source="heroImage" />
        <NumberInput source="basePrice" />
        <TextInput source="deliveryText" />
        <ProductCategoryPropertiesControl />
      </SimpleForm>
    </Create>
  );
}

function ProductCategorySelect() {
  const { data = [], isPending } = useGetList("categories", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" }
  });

  return (
    <SelectInput
      source="category"
      label="Kategorie"
      choices={data.map((category) => ({
        id: String(category.slug ?? category.id),
        name: String(category.name ?? category.slug ?? category.id)
      }))}
      optionText="name"
      optionValue="id"
      validate={[required()]}
      isLoading={isPending}
      emptyText="Kategorie auswählen"
      fullWidth
    />
  );
}

function ProductCategoryPropertiesControl() {
  const notify = useNotify();
  const { setValue } = useFormContext();
  const categorySlug = useWatch({ name: "category" }) as string | undefined;
  const selected = (useWatch({ name: "enabledCategoryProperties" }) as string[] | undefined) ?? [];
  const [categories, setCategories] = useState<Array<{ slug: string; properties?: Array<{ name: string; values: Array<string | { value: string; label?: string; basePrice?: number; stepPrice?: number }> }> }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/catalog/categories?scope=admin");
        if (!res.ok) return;
        const payload = await res.json() as Array<{ slug: string; properties?: Array<{ name: string; values: Array<string | { value: string; label?: string; basePrice?: number; stepPrice?: number }> }> }>;
        setCategories(payload);
      } catch {
        notify("Kategorien konnten nicht geladen werden.", { type: "warning" });
      }
    })();
  }, []);

  const category = categories.find((entry) => entry.slug === categorySlug);
  const properties = category?.properties ?? [];

  useEffect(() => {
    if (!properties.length && selected.length) {
      setValue("enabledCategoryProperties", [], { shouldDirty: true });
    }
  }, [categorySlug]);

  if (!categorySlug) {
    return <Typography variant="body2" color="text.secondary">Wählen Sie zuerst eine Kategorie, um Eigenschaften zu aktivieren.</Typography>;
  }

  return (
    <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
      <Typography variant="subtitle2">Kategorie-Eigenschaften im Konfigurator anzeigen</Typography>
      {properties.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Diese Kategorie hat keine Eigenschaften.</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 0.6 }}>
          {properties.map((property) => {
            const checked = selected.includes(property.name);
            return (
              <label key={property.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? Array.from(new Set([...selected, property.name]))
                      : selected.filter((name) => name !== property.name);
                    setValue("enabledCategoryProperties", next, { shouldDirty: true });
                  }}
                />
                <span>{property.name}</span>
              </label>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function CategoryList() {
  return (
    <List sort={{ field: "name", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="slug" />
        <TextField source="name" />
        <TextField source="description" />
        <BooleanField source="visible" />
        <BooleanField source="published" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" confirmTitle="Kategorie löschen?" confirmContent="Nur möglich, wenn keine Produkte zugeordnet sind." />
      </Datagrid>
    </List>
  );
}

function CategoryPropertiesInput() {
  return (
    <ArrayInput source="properties" label="Eigenschaften">
      <SimpleFormIterator inline>
        <TextInput source="name" label="Name" placeholder="z.B. Papier" />
        <NumberInput source="basePrice" label="Fallback Basispreis (€)" min={0} step={0.01} />
        <NumberInput source="stepPrice" label="Fallback Stückpreis (€)" min={0} step={0.01} />
        <ArrayInput source="values" label="Werte mit Preis">
          <SimpleFormIterator inline>
            <TextInput source="value" label="Wert" placeholder="z.B. 170g Bilderdruck" />
            <TextInput source="label" label="Label" placeholder="optional" />
            <NumberInput source="basePrice" label="Basispreis (€)" min={0} step={0.01} />
            <NumberInput source="stepPrice" label="Stückpreis (€)" min={0} step={0.01} />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleFormIterator>
    </ArrayInput>
  );
}

function CategoryEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="description" multiline />
        <BooleanInput source="visible" label="Sichtbar im Shop" />
        <BooleanInput source="published" label="Veröffentlicht" />
        <CategoryImageUploadControls />
        <TextInput source="logo" label="Bild URL" />
        <SelectInput
          source="defaultPropertyTemplate"
          choices={[
            { id: "print-basic", name: "Print Standard" },
            { id: "large-format", name: "Werbetechnik" },
            { id: "textile", name: "Textil" },
            { id: "sticker", name: "Aufkleber" },
            { id: "marketing-service", name: "Marketing Service" }
          ]}
        />
        <CategoryPropertiesInput />
      </SimpleForm>
    </Edit>
  );
}

function CategoryCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ visible: true, published: true, defaultPropertyTemplate: "print-basic", quantitySteps: [1, 10, 100, 1000], properties: [] }}>
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="description" multiline />
        <BooleanInput source="visible" label="Sichtbar im Shop" />
        <BooleanInput source="published" label="Veröffentlicht" />
        <CategoryImageUploadControls />
        <TextInput source="logo" label="Bild URL" />
        <CategoryPropertiesInput />
      </SimpleForm>
    </Create>
  );
}

function CategoryImageUploadControls() {
  const notify = useNotify();
  const { setValue } = useFormContext();
  const record = useRecordContext<AdminRecord & { logo?: string }>();
  const logo = useWatch({ name: "logo" }) as string | undefined;
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const currentLogo = logo ?? record?.logo;

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads/product-image", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload failed");
    const payload = await response.json() as { url: string };
    return payload.url;
  }

  async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      setValue("logo", url, { shouldDirty: true });
      notify("Category image updated.", { type: "success" });
    } catch {
      notify("Image upload failed.", { type: "error" });
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  const removeLogo = () => {
    setValue("logo", "", { shouldDirty: true });
    notify("Category image removed.", { type: "info" });
  };

  return (
    <Box sx={{ display: "grid", gap: 1, mb: 1 }}>
      <Typography variant="subtitle2">Category Image</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="outlined" component="label" disabled={uploadingLogo}>
          {uploadingLogo ? "Uploading..." : "Upload Category Image"}
          <input type="file" accept="image/*,.heic,.heif" hidden onChange={onLogoChange} />
        </Button>
        {currentLogo ? (
          <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={removeLogo}>
            Remove Image
          </Button>
        ) : null}
      </Box>
      {currentLogo ? (
        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", width: 180, height: 100, position: "relative" }}>
          <Image src={currentLogo} alt="Category" fill style={{ objectFit: "cover" }} />
        </Box>
      ) : null}
    </Box>
  );
}

function AdminToolShell({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
        {children ? <Box sx={{ mt: 2 }}>{children}</Box> : null}
      </CardContent>
    </Card>
  );
}

type StoreSettingsResponse = {
  storeControl: {
    maintenanceMode: boolean;
    vacationMode: boolean;
    disableCheckout: boolean;
    announcementBar?: string | null;
    maintenanceAvailableAt?: string;
  };
};

function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tools?action=store-control");
      if (!res.ok) throw new Error("Failed to load settings");
      const payload = await res.json() as StoreSettingsResponse;
      setSettings(payload);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to load settings", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function updateStoreControl(patch: Partial<StoreSettingsResponse["storeControl"]>) {
    const res = await fetch("/api/admin/tools?action=store-control", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(typeof payload?.message === "string" ? payload.message : "Update failed");
    }
    const payload = await res.json() as { storeControl: StoreSettingsResponse["storeControl"] };
    setSettings({ storeControl: payload.storeControl });
  }

  return { settings, loading, updateStoreControl, reload };
}

function MaintenanceToolPage() {
  const notify = useNotify();
  const { settings, loading, updateStoreControl } = useStoreSettings();
  const maintenanceOn = Boolean(settings?.storeControl.maintenanceMode);
  const [availableAt, setAvailableAt] = useState("");

  useEffect(() => {
    setAvailableAt(settings?.storeControl.maintenanceAvailableAt ?? "");
  }, [settings?.storeControl.maintenanceAvailableAt]);

  async function toggle() {
    try {
      await updateStoreControl({ maintenanceMode: !maintenanceOn, maintenanceAvailableAt: availableAt });
      notify(`Maintenance mode ${!maintenanceOn ? "enabled" : "disabled"}.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Update failed", { type: "error" });
    }
  }

  async function saveAvailability() {
    try {
      await updateStoreControl({ maintenanceAvailableAt: availableAt });
      notify("Wiederverfügbarkeit gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Update failed", { type: "error" });
    }
  }

  return (
    <AdminToolShell
      title="Maintenance Mode"
      description="Aktiviert den Wartungsmodus für technische Arbeiten."
    >
      <Button variant="contained" size="large" onClick={() => void toggle()} disabled={loading}>
        {maintenanceOn ? "Wartungsmodus deaktivieren" : "Wartungsmodus aktivieren"}
      </Button>
      <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
        <MuiTextField
          size="small"
          label="Wieder verfügbar am"
          placeholder="z. B. 06.06.2026, 09:00"
          value={availableAt}
          onChange={(event) => setAvailableAt(event.target.value)}
        />
        <Box>
          <Button variant="outlined" onClick={() => void saveAvailability()} disabled={loading}>
            Datum speichern
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Status: {maintenanceOn ? "AKTIV" : "INAKTIV"}
      </Typography>
    </AdminToolShell>
  );
}

function VacationToolPage() {
  const notify = useNotify();
  const { settings, loading, updateStoreControl } = useStoreSettings();
  const vacationOn = Boolean(settings?.storeControl.vacationMode);

  async function toggle() {
    try {
      await updateStoreControl({ vacationMode: !vacationOn });
      notify(`Urlaub mode ${!vacationOn ? "enabled" : "disabled"}.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Update failed", { type: "error" });
    }
  }

  return (
    <AdminToolShell
      title="Urlaub Mode"
      description="Aktiviert den Urlaubsmodus mit angepassten Lieferhinweisen."
    >
      <Button variant="contained" size="large" onClick={() => void toggle()} disabled={loading}>
        {vacationOn ? "Urlaubsmodus deaktivieren" : "Urlaubsmodus aktivieren"}
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Status: {vacationOn ? "AKTIV" : "INAKTIV"}
      </Typography>
    </AdminToolShell>
  );
}

function OnlineShopToolPage() {
  const notify = useNotify();
  const { settings, loading, updateStoreControl } = useStoreSettings();
  const checkoutDisabled = Boolean(settings?.storeControl.disableCheckout);
  const shopActive = !checkoutDisabled;

  async function toggle() {
    try {
      await updateStoreControl({ disableCheckout: shopActive });
      notify(shopActive ? "Online Shop deaktiviert. Checkout und neue Transaktionen sind gesperrt." : "Online Shop aktiviert.", {
        type: shopActive ? "warning" : "success"
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Update failed", { type: "error" });
    }
  }

  return (
    <AdminToolShell
      title="Online Shop"
      description="Steuert, ob Kunden neue Bestellungen und Stripe-Zahlungen starten können."
    >
      <Alert severity={shopActive ? "success" : "error"} sx={{ mb: 2 }}>
        Status: {shopActive ? "AKTIV - Bestellungen und Zahlungen sind möglich." : "DEAKTIVIERT - Checkout, Transaktionen und neue Bestellungen sind gesperrt."}
      </Alert>
      <Button
        variant="contained"
        color={shopActive ? "success" : "error"}
        size="large"
        onClick={() => void toggle()}
        disabled={loading}
      >
        {shopActive ? "Online Shop aktiv" : "Online Shop deaktiviert"}
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Ein Klick wechselt den Status. Bei deaktiviertem Shop bleibt der Katalog sichtbar, aber `/api/checkout` blockiert jede Zahlung.
      </Typography>
    </AdminToolShell>
  );
}

function CheckoutLockToolPage() {
  return <OnlineShopToolPage />;
}

function EmailConfigToolPage() {
  const notify = useNotify();
  const [form, setForm] = useState<Record<string, string>>({
    SMTP_HOST: "",
    SMTP_PORT: "",
    SMTP_USER: "",
    SMTP_FROM_EMAIL: "",
    CONTACT_NOTIFY_EMAIL: "",
    PRODUCT_SELECTION_NOTIFY_EMAIL: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/tools?action=email");
        if (!res.ok) throw new Error("Failed to load email configuration");
        const payload = await res.json() as { smtp: Record<string, string> };
        setForm((current) => ({ ...current, ...payload.smtp }));
      } catch (error) {
        notify(error instanceof Error ? error.message : "Load failed", { type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(typeof payload?.message === "string" ? payload.message : "Save failed");
      }
      notify("Email configuration saved to .env.local", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Save failed", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell
      title="E-Mail Konfiguration"
      description="SMTP- und Benachrichtigungsadressen in .env.local verwalten."
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {Object.keys(form).map((key) => (
          <MuiTextField
            key={key}
            size="small"
            label={key}
            value={form[key] ?? ""}
            disabled={loading || saving}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
          />
        ))}
        <Box>
          <Button variant="contained" onClick={() => void onSave()} disabled={loading || saving}>
            {saving ? "Speichert..." : "E-Mail Konfiguration speichern"}
          </Button>
        </Box>
      </Box>
    </AdminToolShell>
  );
}

function UploadFoldersToolPage() {
  const notify = useNotify();
  const [folders, setFolders] = useState<Array<{
    key: string;
    label: string;
    folder: string;
    filesCount: number;
    files: Array<{ name: string; size: number; updatedAt: string; url: string; isImage: boolean }>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tools?action=uploads");
      if (!res.ok) throw new Error("Failed to load upload folders");
      const payload = await res.json() as {
        items: Array<{
          key: string;
          label: string;
          folder: string;
          filesCount: number;
          files: Array<{ name: string; size: number; updatedAt: string; url: string; isImage: boolean }>;
        }>;
      };
      setFolders(payload.items);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Load failed", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminToolShell
      title="Upload-Ordner"
      description="Ordner und Dateianzahl für Bilder, Dokumente und Kontaktformular-Dateien."
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {folders.map((item) => (
          <Card key={item.key} variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="subtitle2">{item.label}</Typography>
              <Typography variant="body2" color="text.secondary">{item.folder}</Typography>
              <Typography variant="body2">Dateien: {item.filesCount}</Typography>
              {item.files.length > 0 ? (
                <Box sx={{ mt: 1.25, display: "grid", gap: 0.8 }}>
                  {item.files.map((file) => (
                    <Box key={`${item.key}-${file.name}`} sx={{ display: "flex", alignItems: "center", gap: 1, border: "1px solid #e2e8f0", borderRadius: 1, p: 0.75 }}>
                      {file.isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.url} alt={file.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid #e2e8f0" }} />
                      ) : (
                        <Box sx={{ width: 40, height: 40, borderRadius: 1, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#475569" }}>
                          Datei
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024).toFixed(1)} KB - {new Date(file.updatedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" href={file.url} target="_blank" rel="noreferrer">
                        Öffnen
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </CardContent>
          </Card>
        ))}
        <Box>
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>Ordner aktualisieren</Button>
        </Box>
      </Box>
    </AdminToolShell>
  );
}

function CatalogImageImportToolPage() {
  const notify = useNotify();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; mimeType: string }>>([]);
  const [uploadedMimeType, setUploadedMimeType] = useState("");
  const [uploadStats, setUploadStats] = useState<{ size?: number; originalSize?: number; optimized?: boolean } | null>(null);
  const [targetType, setTargetType] = useState<"product" | "category">("product");
  const [targetSlug, setTargetSlug] = useState("");
  const [imageUsage, setImageUsage] = useState<"hero" | "gallery" | "logo">("hero");
  const [products, setProducts] = useState<Array<{ slug: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [result, setResult] = useState<{
    updatedProducts: string[];
    updatedCategories: string[];
    skipped: Array<{ slug?: string; reason: string }>;
  } | null>(null);

  const jsonExample = JSON.stringify({
    products: [
      {
        slug: "alu-dibond-schilder",
        image_path: "/uploads/products/alu-dibond.webp",
        gallery: ["/uploads/products/alu-dibond-detail.webp"]
      }
    ],
    categories: [
      {
        slug: "schilder",
        image: "/uploads/products/kategorie-schilder.webp"
      }
    ]
  }, null, 2);

  const csvExample = "type,slug,image_path,gallery\nproduct,alu-dibond-schilder,/uploads/products/alu-dibond.webp,/uploads/products/detail-1.webp|/uploads/products/detail-2.webp\ncategory,schilder,/uploads/products/kategorie-schilder.webp,";

  useEffect(() => {
    void (async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/catalog/products?scope=admin"),
          fetch("/api/catalog/categories?scope=admin")
        ]);
        if (productsRes.ok) setProducts(await productsRes.json() as Array<{ slug: string; name: string }>);
        if (categoriesRes.ok) setCategories(await categoriesRes.json() as Array<{ slug: string; name: string }>);
      } catch {
        notify("Produkte/Kategorien konnten nicht geladen werden.", { type: "error" });
      }
    })();
  }, []);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const payloads = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads/product-image", { method: "POST", body: formData });
        const payload = await res.json().catch(() => ({})) as { url?: string; mimeType?: string; size?: number; originalSize?: number; optimized?: boolean; message?: string };
        if (!res.ok) {
          throw new Error(typeof payload?.message === "string" ? payload.message : "Upload fehlgeschlagen");
        }
        return { ...payload, sourceType: file.type };
      }));
      const uploaded = payloads
        .filter((item): item is typeof item & { url: string } => Boolean(item.url))
        .map((item) => ({ url: item.url, mimeType: item.mimeType ?? item.sourceType ?? "" }));
      const urls = uploaded.map((item) => item.url);
      const first = payloads[0];
      setUploadedFiles(uploaded);
      setUploadedUrls(urls);
      setUploadedUrl(urls[0] ?? "");
      setUploadedMimeType(first?.mimeType ?? first?.sourceType ?? "");
      setUploadStats({ size: first?.size, originalSize: first?.originalSize, optimized: first?.optimized });
      notify(payloads.some((item) => item.optimized) ? "Dateien hochgeladen und für Web optimiert." : "Dateien hochgeladen.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload fehlgeschlagen", { type: "error" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function assignUploadedImage() {
    const imageUrls = uploadedFiles.length
      ? uploadedFiles.filter((item) => !item.mimeType.startsWith("video/")).map((item) => item.url)
      : [uploadedUrl].filter(Boolean);
    if (!imageUrls.length || !targetSlug) return;
    if (uploadedMimeType.startsWith("video/")) {
      notify("Videos werden gespeichert, aber nicht als Produktbild/Kategoriebild zugewiesen.", { type: "warning" });
      return;
    }
    const row = targetType === "category"
      ? { categories: [{ slug: targetSlug, image_path: imageUrls[0] }] }
      : imageUsage === "gallery"
        ? { products: [{ slug: targetSlug, gallery: imageUrls }] }
        : { products: [{ slug: targetSlug, image_path: imageUrls[0], gallery: imageUrls.slice(1) }] };
    setContent(JSON.stringify(row, null, 2));
    await importImages(JSON.stringify(row, null, 2));
  }

  async function importImages(nextContent = content) {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/tools?action=catalog-image-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.message === "string" ? payload.message : "Import fehlgeschlagen");
      }
      setResult(payload.result);
      notify("Bildpfade importiert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Import fehlgeschlagen", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell
      title="Bildpfade Import"
      description="Produkt- und Kategorie-Bilder per JSON oder CSV bestehenden Slugs zuweisen."
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Alert severity="info">
          Der Import aktualisiert nur vorhandene Produkte und Kategorien. Produktbild = heroImage, Kategorie-Bild = logo.
        </Alert>
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5, display: "grid", gap: 1.3 }}>
            <Typography variant="subtitle2">Bild hochladen und zuweisen</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "160px 1fr 170px" }, gap: 1 }}>
              <MuiTextField
                select
                size="small"
                label="Verwenden für"
                value={targetType}
                onChange={(event) => {
                  const nextType = event.target.value as "product" | "category";
                  setTargetType(nextType);
                  setImageUsage(nextType === "category" ? "logo" : "hero");
                  setTargetSlug("");
                }}
              >
                <MenuItem value="product">Produkt</MenuItem>
                <MenuItem value="category">Kategorie</MenuItem>
              </MuiTextField>
              <MuiTextField
                select
                size="small"
                label={targetType === "product" ? "Produkt" : "Kategorie"}
                value={targetSlug}
                onChange={(event) => setTargetSlug(event.target.value)}
              >
                {(targetType === "product" ? products : categories).map((item) => (
                  <MenuItem value={item.slug} key={item.slug}>{item.name} ({item.slug})</MenuItem>
                ))}
              </MuiTextField>
              <MuiTextField
                select
                size="small"
                label="Position"
                value={targetType === "category" ? "logo" : imageUsage}
                disabled={targetType === "category"}
                onChange={(event) => setImageUsage(event.target.value as "hero" | "gallery")}
              >
                <MenuItem value="hero">Hauptbild</MenuItem>
                <MenuItem value="gallery">Galerie</MenuItem>
                <MenuItem value="logo">Kategorie-Bild</MenuItem>
              </MuiTextField>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Button variant="outlined" component="label" disabled={uploading}>
                {uploading ? "Optimiert..." : "Bild/Video hochladen"}
                <input type="file" accept="image/*,.heic,.heif,video/mp4,video/webm,video/quicktime" multiple hidden onChange={uploadImage} />
              </Button>
              <Button variant="contained" onClick={() => void assignUploadedImage()} disabled={saving || !uploadedUrl || !targetSlug || uploadedMimeType.startsWith("video/")}>
                Bild zuweisen
              </Button>
              {uploadedUrl ? (
                <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {uploadedUrls.length > 1 ? `${uploadedUrls.length} Dateien hochgeladen` : uploadedUrl}
                  {uploadStats?.size && uploadStats?.originalSize ? ` | ${(uploadStats.originalSize / 1024 / 1024).toFixed(1)} MB -> ${(uploadStats.size / 1024 / 1024).toFixed(1)} MB` : ""}
                </Typography>
              ) : null}
            </Box>
            {uploadedUrl ? (
              <Box>
                {uploadedMimeType.startsWith("video/") ? (
                  <video src={uploadedUrl} controls muted style={{ width: 180, height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadedUrl} alt="Hochgeladenes Bild" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                )}
              </Box>
            ) : null}
          </CardContent>
        </Card>
        <MuiTextField
          label="JSON oder CSV"
          multiline
          minRows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={csvExample}
          fullWidth
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => void importImages()} disabled={saving || !content.trim()}>
            {saving ? "Importiert..." : "Bildpfade importieren"}
          </Button>
          <Button variant="outlined" onClick={() => setContent(jsonExample)} disabled={saving}>JSON Beispiel</Button>
          <Button variant="outlined" onClick={() => setContent(csvExample)} disabled={saving}>CSV Beispiel</Button>
        </Box>
        {result ? (
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, display: "grid", gap: 0.8 }}>
              <Typography variant="subtitle2">Import Ergebnis</Typography>
              <Typography variant="body2">Produkte aktualisiert: {result.updatedProducts.length}</Typography>
              <Typography variant="body2">Kategorien aktualisiert: {result.updatedCategories.length}</Typography>
              <Typography variant="body2">Übersprungen: {result.skipped.length}</Typography>
              {result.skipped.length ? (
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {result.skipped.slice(0, 12).map((item, index) => (
                    <Typography component="li" variant="caption" color="text.secondary" key={`${item.slug ?? "row"}-${index}`}>
                      {item.slug ?? "Zeile"}: {item.reason}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </Box>
    </AdminToolShell>
  );
}

function SiteImagesToolPage() {
  const notify = useNotify();
  const [slots, setSlots] = useState<Array<{ key: string; label: string; defaultUrl: string }>>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/tools?action=site-images");
      const payload = await res.json() as { slots: Array<{ key: string; label: string; defaultUrl: string }>; images: Record<string, string> };
      if (!res.ok) throw new Error("Bilder konnten nicht geladen werden.");
      setSlots(payload.slots);
      setImages(payload.images);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Bilder konnten nicht geladen werden.", { type: "error" });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(nextImages = images) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=site-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: nextImages })
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen.");
      const payload = await res.json() as { images: Record<string, string> };
      setImages((current) => ({ ...current, ...payload.images }));
      notify("Website Bilder gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Speichern fehlgeschlagen.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function uploadForSlot(slotKey: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingKey(slotKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: formData });
      const payload = await res.json().catch(() => ({})) as { url?: string; message?: string };
      if (!res.ok || !payload.url) throw new Error(payload.message ?? "Upload fehlgeschlagen.");
      const nextImages = { ...images, [slotKey]: payload.url };
      setImages(nextImages);
      await save(nextImages);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Upload fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingKey(null);
      event.target.value = "";
    }
  }

  return (
    <AdminToolShell
      title="Website Bilder"
      description="Alle zentralen Website-Bilder hochladen, austauschen und speichern."
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Alert severity="info">
          Produktbilder und Kategoriebilder bleiben direkt bei Produkte/Kategorien editierbar. Diese Liste steuert Logo, Startseite und Service-Seiten.
        </Alert>
        <Box sx={{ display: "grid", gap: 1.2 }}>
          {slots.map((slot) => {
            const value = images[slot.key] || slot.defaultUrl;
            return (
              <Card key={slot.key} variant="outlined">
                <CardContent sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "120px 1fr auto" }, alignItems: "center", py: 1.5 }}>
                  <Box sx={{ width: 104, height: 64, position: "relative", border: "1px solid #e2e8f0", borderRadius: 1, overflow: "hidden", bgcolor: "#f8fafc" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt={slot.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </Box>
                  <Box sx={{ display: "grid", gap: 0.8 }}>
                    <Typography variant="subtitle2">{slot.label}</Typography>
                    <MuiTextField
                      size="small"
                      label={slot.key}
                      value={value}
                      onChange={(event) => setImages((current) => ({ ...current, [slot.key]: event.target.value }))}
                    />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="outlined" component="label" disabled={uploadingKey === slot.key || saving}>
                      {uploadingKey === slot.key ? "Upload..." : "Upload"}
                      <input type="file" accept="image/*,.heic,.heif" hidden onChange={(event) => void uploadForSlot(slot.key, event)} />
                    </Button>
                    <Button variant="contained" disabled={saving} onClick={() => void save()}>
                      Speichern
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </AdminToolShell>
  );
}

function BackupToolPage() {
  const notify = useNotify();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; label: string; status: string; location?: string | null; createdAt: string }>>([]);

  async function loadBackups() {
    const res = await fetch("/api/admin/modules/backups?page=1&pageSize=10");
    if (!res.ok) return;
    const payload = await res.json() as { items: Array<{ id: string; label: string; status: string; location?: string | null; createdAt: string }> };
    setItems(payload.items);
  }

  useEffect(() => {
    void loadBackups();
  }, []);

  async function createBackup() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(typeof payload?.message === "string" ? payload.message : "Backup failed");
      }
      notify("Backup created", { type: "success" });
      setLabel("");
      await loadBackups();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Backup failed", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell
      title="Backup"
      description="SQLite-Backups erstellen und als Datensatz speichern."
    >
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <MuiTextField
          size="small"
          label="Backup Bezeichnung"
          placeholder="vor-wartung"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Box>
          <Button variant="contained" onClick={() => void createBackup()} disabled={saving}>
            {saving ? "Erstellt..." : "Backup jetzt erstellen"}
          </Button>
        </Box>
        {items.map((item) => (
          <Card key={item.id} variant="outlined">
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="subtitle2">{item.label}</Typography>
              <Typography variant="body2" color="text.secondary">{item.status} - {new Date(item.createdAt).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">{item.location ?? "-"}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </AdminToolShell>
  );
}

function ShutdownToolPage() {
  const notify = useNotify();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ requestedAt: string; requestedBy: string; reason: string } | null>(null);

  async function loadState() {
    const res = await fetch("/api/admin/tools?action=shutdown");
    if (!res.ok) return;
    const payload = await res.json() as { shutdownRequest: { requestedAt: string; requestedBy: string; reason: string } | null };
    setState(payload.shutdownRequest);
  }

  useEffect(() => {
    void loadState();
  }, []);

  async function requestShutdown() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=shutdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(typeof payload?.message === "string" ? payload.message : "Shutdown request failed");
      }
      const payload = await res.json() as { shutdownRequest: { requestedAt: string; requestedBy: string; reason: string } };
      setState(payload.shutdownRequest);
      notify("Shutdown request recorded. Maintenance and checkout lock enabled.", { type: "warning" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Shutdown request failed", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell
      title="Shutdown"
      description="Shutdown-Anfrage protokollieren und Shop in Wartung + Bestellstopp setzen."
    >
      <Alert severity="warning" sx={{ mb: 2 }}>
        Dieser Button stoppt nicht den Next.js-Prozess. Er setzt eine kontrollierte Shutdown-Anfrage und schützt den Shop.
      </Alert>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <MuiTextField
          size="small"
          label="Grund"
          placeholder="Dringendes Wartungsfenster"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <Box>
          <Button variant="contained" color="error" onClick={() => void requestShutdown()} disabled={saving}>
            {saving ? "Sendet..." : "Shutdown anfragen"}
          </Button>
        </Box>
        {state ? (
          <Typography variant="body2" color="text.secondary">
            Letzte Anfrage: {new Date(state.requestedAt).toLocaleString()} von {state.requestedBy} ({state.reason})
          </Typography>
        ) : null}
      </Box>
    </AdminToolShell>
  );
}

function LayoutStudioPage() {
  const [layout, setLayout] = useState<"magazine" | "split" | "grid">("magazine");
  const [showNews, setShowNews] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showCta, setShowCta] = useState(true);

  return (
    <AdminToolShell
      title="Layout Studio"
      description="1 von 3 Layouts wählen und Module (News, Highlights, CTA) interaktiv umschalten."
    >
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Button variant={layout === "magazine" ? "contained" : "outlined"} onClick={() => setLayout("magazine")}>Layout 1</Button>
        <Button variant={layout === "split" ? "contained" : "outlined"} onClick={() => setLayout("split")}>Layout 2</Button>
        <Button variant={layout === "grid" ? "contained" : "outlined"} onClick={() => setLayout("grid")}>Layout 3</Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        <Button size="small" variant={showNews ? "contained" : "outlined"} onClick={() => setShowNews((v) => !v)}>News</Button>
        <Button size="small" variant={showHighlights ? "contained" : "outlined"} onClick={() => setShowHighlights((v) => !v)}>Highlights</Button>
        <Button size="small" variant={showCta ? "contained" : "outlined"} onClick={() => setShowCta((v) => !v)}>CTA</Button>
      </Box>

      {layout === "magazine" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>{showNews ? <DashboardCard label="News" value="Hero + list" /> : null}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{showHighlights ? <DashboardCard label="Highlights" value="Sidebar cards" /> : null}</Grid>
          <Grid size={{ xs: 12 }}>{showCta ? <DashboardCard label="CTA" value="Bottom banner" /> : null}</Grid>
        </Grid>
      ) : null}

      {layout === "split" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{showNews ? <DashboardCard label="News Feed" value="Left column" /> : null}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{showHighlights ? <DashboardCard label="Highlights + CTA" value={showCta ? "Right stacked modules" : "Right highlights only"} /> : null}</Grid>
        </Grid>
      ) : null}

      {layout === "grid" ? (
        <Grid container spacing={2}>
          {showNews ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="News Cards" value="3-column grid" /></Grid> : null}
          {showHighlights ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Highlights" value="KPI cards" /></Grid> : null}
          {showCta ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="CTA Block" value="Action module" /></Grid> : null}
        </Grid>
      ) : null}
    </AdminToolShell>
  );
}

function WerbungToolPage() {
  const redirect = useRedirect();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [form, setForm] = useState<Record<string, string>>({
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
    NEXT_PUBLIC_CLARITY_PROJECT_ID: "",
    NEXT_PUBLIC_META_PIXEL_ID: "",
    GOOGLE_SITE_VERIFICATION: ""
  });

  useEffect(() => {
    void (async () => {
      try {
        const [configRes, ordersRes] = await Promise.all([
          fetch("/api/admin/tools?action=marketing-config"),
          fetch("/api/admin/modules/orders?page=1&pageSize=300")
        ]);
        if (configRes.ok) {
          const payload = await configRes.json() as { marketing: Record<string, string> };
          setForm((current) => ({ ...current, ...payload.marketing }));
        }
        if (ordersRes.ok) {
          const payload = await ordersRes.json() as { items: AdminOrderItem[] };
          setOrders(payload.items ?? []);
        }
      } catch {
        notify("Werbung-Konfiguration konnte nicht geladen werden.", { type: "error" });
      }
    })();
  }, []);

  const statusItems = [
    { label: "Google Analytics 4", key: "NEXT_PUBLIC_GA_MEASUREMENT_ID" },
    { label: "Microsoft Clarity", key: "NEXT_PUBLIC_CLARITY_PROJECT_ID" },
    { label: "Google Search Console", key: "GOOGLE_SITE_VERIFICATION" },
    { label: "Meta Pixel", key: "NEXT_PUBLIC_META_PIXEL_ID" }
  ];

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const fromDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const filteredOrders = orders.filter((order) => new Date(order.createdAt) >= fromDate);
  const revenue = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const avg = filteredOrders.length ? revenue / filteredOrders.length : 0;
  const chartBuckets = useMemo(() => {
    const bucketCount = period === "7d" ? 7 : period === "30d" ? 10 : period === "90d" ? 12 : 12;
    const spanDays = Math.max(1, Math.round(periodDays / bucketCount));
    const labels: string[] = [];
    const values = Array.from({ length: bucketCount }, () => 0);
    for (let i = 0; i < bucketCount; i += 1) {
      const point = new Date(fromDate.getTime() + i * spanDays * 24 * 60 * 60 * 1000);
      labels.push(point.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }));
    }
    for (const order of filteredOrders) {
      const diffDays = Math.floor((new Date(order.createdAt).getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(diffDays / spanDays)));
      values[idx] += Number(order.total || 0);
    }
    const max = Math.max(1, ...values);
    return values.map((value, index) => ({ label: labels[index], value, height: Math.max(8, (value / max) * 100) }));
  }, [filteredOrders, fromDate.getTime(), period, periodDays]);

  async function saveMarketing() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=marketing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      notify("Werbung-Konfiguration gespeichert. Bitte Server neu starten.", { type: "success" });
    } catch {
      notify("Speichern fehlgeschlagen.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell
      title="Werbung"
      description="Professionelle Konfiguration für Tracking, SEO, Werbung und Umsatzdaten."
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Grid container spacing={1.5}>
          {statusItems.map((item) => {
            const value = (form[item.key] ?? "").trim();
            const configured = Boolean(value);
            const preview = value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={item.key}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <Typography variant="body2" color={configured ? "success.main" : "text.secondary"}>
                      {configured ? "Verbunden" : "Nicht verbunden"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {configured ? `Wert: ${preview}` : "Wert: -"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card variant="outlined">
          <CardContent sx={{ py: 1.8, display: "grid", gap: 1.25 }}>
            <Typography variant="subtitle2">Tracking & SEO Konfiguration</Typography>
            <MuiTextField
              size="small"
              label="Google Analytics 4 Measurement ID"
              placeholder="G-XXXXXXXXXX"
              value={form.NEXT_PUBLIC_GA_MEASUREMENT_ID}
              onChange={(event) => setForm((current) => ({ ...current, NEXT_PUBLIC_GA_MEASUREMENT_ID: event.target.value }))}
            />
            <MuiTextField
              size="small"
              label="Microsoft Clarity Project ID"
              placeholder="xxxxxxxxxx"
              value={form.NEXT_PUBLIC_CLARITY_PROJECT_ID}
              onChange={(event) => setForm((current) => ({ ...current, NEXT_PUBLIC_CLARITY_PROJECT_ID: event.target.value }))}
            />
            <MuiTextField
              size="small"
              label="Meta Pixel ID"
              placeholder="123456789012345"
              value={form.NEXT_PUBLIC_META_PIXEL_ID}
              onChange={(event) => setForm((current) => ({ ...current, NEXT_PUBLIC_META_PIXEL_ID: event.target.value }))}
            />
            <MuiTextField
              size="small"
              label="Google Search Console Verification"
              placeholder="google-site-verification token"
              value={form.GOOGLE_SITE_VERIFICATION}
              onChange={(event) => setForm((current) => ({ ...current, GOOGLE_SITE_VERIFICATION: event.target.value }))}
            />
            <Box>
              <Button variant="contained" onClick={() => void saveMarketing()} disabled={saving}>
                {saving ? "Speichert..." : "Konfiguration speichern"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ py: 1.8 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Typography variant="subtitle2">Sales Analytics Dashboard</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  { key: "7d", label: "Woche" },
                  { key: "30d", label: "Monat" },
                  { key: "90d", label: "Quartal" },
                  { key: "365d", label: "Jahr" }
                ].map((item) => (
                  <Button key={item.key} variant={period === item.key ? "contained" : "outlined"} size="small" onClick={() => setPeriod(item.key as PeriodKey)}>
                    {item.label}
                  </Button>
                ))}
              </Box>
            </Box>
            <Grid container spacing={1.25} sx={{ mt: 0.2 }}>
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Umsatz" value={formatCurrency(revenue)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Bestellungen" value={String(filteredOrders.length)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Ø Warenkorb" value={formatCurrency(avg)} /></Grid>
            </Grid>
            <Box sx={{ mt: 1.5, height: 170, display: "flex", alignItems: "flex-end", gap: 0.7 }}>
              {chartBuckets.map((bucket) => (
                <Box key={bucket.label} sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: `${bucket.height}%`,
                      borderRadius: 1,
                      bgcolor: "#0ea5e9",
                      transition: "height 450ms ease"
                    }}
                    title={`${bucket.label}: ${formatCurrency(bucket.value)}`}
                  />
                  <Typography variant="caption" sx={{ display: "block", mt: 0.4, textAlign: "center", color: "#64748b" }}>
                    {bucket.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Button variant="outlined" onClick={() => redirect("/")}>Zum Hauptdashboard</Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ mt: 2, border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5 }}>
        <Typography variant="subtitle2">Diese Kombination deckt ab:</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Traffic, Nutzerverhalten, SEO, Werbung und Umsatz.
        </Typography>
      </Box>
    </AdminToolShell>
  );
}

function CRMToolPage() {
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [crmConfig, setCrmConfig] = useState({
    CRM_API_URL: "",
    CRM_API_TOKEN: ""
  });
  const [crmConfigured, setCrmConfigured] = useState({ url: false, token: false });
  const [payload, setPayload] = useState<{
    summary: {
      stripeOrders: number;
      crmSynced: number;
      crmPending: number;
      syncedRevenue: number;
      pendingRevenue: number;
    };
    recentSyncs: Array<{ stripeSessionId: string; syncedAt: string; orderId: string }>;
    pending: Array<{ id: string; customer: string; total: number; createdAt: string }>;
  } | null>(null);

  async function loadConfig() {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/admin/tools?action=crm-config");
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
      }
      const json = await res.json() as {
        crm: { CRM_API_URL: string; CRM_API_TOKEN: string };
        configured: { url: boolean; token: boolean };
      };
      setCrmConfig(json.crm);
      setCrmConfigured(json.configured);
    } catch (error) {
      notify(`CRM API Konfiguration konnte nicht geladen werden. ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, { type: "error" });
    } finally {
      setConfigLoading(false);
    }
  }

  async function saveConfig() {
    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=crm-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmConfig)
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
      }
      notify("Webshop Order API gespeichert.", { type: "success" });
      await loadConfig();
    } catch (error) {
      notify(`CRM API Konfiguration konnte nicht gespeichert werden. ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, { type: "error" });
    } finally {
      setConfigSaving(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tools?action=crm-status");
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
      }
      const json = await res.json() as {
        summary: {
          stripeOrders: number;
          crmSynced: number;
          crmPending: number;
          syncedRevenue: number;
          pendingRevenue: number;
        };
        recentSyncs: Array<{ stripeSessionId: string; syncedAt: string; orderId: string }>;
        pending: Array<{ id: string; customer: string; total: number; createdAt: string }>;
      };
      setPayload(json);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      notify(`CRM Status konnte nicht geladen werden. ${message}`, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
    void load();
  }, []);

  async function handleAction(orderId: string, operation: "stornieren" | "delete") {
    setActionLoadingId(`${operation}:${orderId}`);
    try {
      const res = await fetch("/api/admin/tools?action=crm-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, operation })
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`);
      }
      notify(operation === "stornieren" ? "Bestellung storniert." : "Bestellung gelöscht.", { type: "info" });
      await load();
    } catch (error) {
      notify(`Aktion fehlgeschlagen. ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, { type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <AdminToolShell title="CRM" description="Rechnungen, Sync-Status und Umsatz-Kalkulationen für CRM-Anbindung.">
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2">Webshop Order API</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
              Ziel-Endpoint für Webshop-Bestellungen. Requests werden als JSON mit Bearer Token gesendet.
            </Typography>
            <Box sx={{ mt: 1.5, display: "grid", gap: 1.25 }}>
              <MuiTextField
                size="small"
                label="API URL"
                placeholder="https://example.com/api/webshop/orders"
                value={crmConfig.CRM_API_URL}
                disabled={configLoading || configSaving}
                onChange={(event) => setCrmConfig((current) => ({ ...current, CRM_API_URL: event.target.value }))}
                fullWidth
              />
              <MuiTextField
                size="small"
                label="Bearer Token"
                type="password"
                placeholder={crmConfigured.token ? "Gespeichert - leer lassen zum Beibehalten" : "Token eingeben"}
                value={crmConfig.CRM_API_TOKEN}
                disabled={configLoading || configSaving}
                onFocus={() => {
                  if (crmConfig.CRM_API_TOKEN === "********") {
                    setCrmConfig((current) => ({ ...current, CRM_API_TOKEN: "" }));
                  }
                }}
                onChange={(event) => setCrmConfig((current) => ({ ...current, CRM_API_TOKEN: event.target.value }))}
                fullWidth
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Button variant="contained" onClick={() => void saveConfig()} disabled={configLoading || configSaving}>
                  {configSaving ? "Speichert..." : "Webshop Order API speichern"}
                </Button>
                <Typography variant="caption" color={crmConfigured.url && crmConfigured.token ? "success.main" : "error.main"}>
                  {crmConfigured.url && crmConfigured.token ? "API URL und Token sind konfiguriert." : "API URL oder Token fehlt."}
                </Typography>
              </Box>
              <Box component="pre" sx={{ m: 0, p: 1.5, borderRadius: 1, bgcolor: "#0f172a", color: "#e2e8f0", overflowX: "auto", fontSize: 12, lineHeight: 1.6 }}>
{`{
  "email": "kunde@example.com",
  "customer": "Webshop Kunde",
  "total": 129.90,
  "items": [
    {
      "description": "Produktname",
      "qty": 1,
      "price": 129.90
    }
  ]
}`}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => void load()} disabled={loading}>
            CRM Sync Status laden
          </Button>
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>
            Rechnungen aktualisieren
          </Button>
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>
            Kalkulation neu berechnen
          </Button>
        </Box>

        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="Stripe Bestellungen" value={String(payload?.summary.stripeOrders ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="CRM synchronisiert" value={String(payload?.summary.crmSynced ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="CRM ausstehend" value={String(payload?.summary.crmPending ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DashboardCard label="Umsatz synchronisiert" value={formatCurrency(payload?.summary.syncedRevenue ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DashboardCard label="Umsatz ausstehend" value={formatCurrency(payload?.summary.pendingRevenue ?? 0)} />
          </Grid>
        </Grid>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2">Ausstehende CRM Rechnungen</Typography>
            {(payload?.pending ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                Keine offenen Rechnungen.
              </Typography>
            ) : (
              <Box sx={{ mt: 1, display: "grid", gap: 0.6 }}>
                {(payload?.pending ?? []).slice(0, 15).map((row) => (
                  <Box key={row.id} sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr .6fr .9fr auto", alignItems: "center", gap: 1, fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 1, px: 1, py: 0.7 }}>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.id}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.customer}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{formatCurrency(Number(row.total || 0))}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{new Date(row.createdAt).toLocaleString()}</Typography>
                    <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={actionLoadingId !== null}
                        onClick={() => void handleAction(row.id, "stornieren")}
                      >
                        Stornieren
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={actionLoadingId !== null}
                        onClick={() => void handleAction(row.id, "delete")}
                      >
                        Löschen
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2">Letzte CRM Syncs</Typography>
            {(payload?.recentSyncs ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                Noch keine Sync-Einträge vorhanden.
              </Typography>
            ) : (
              <Box sx={{ mt: 1, display: "grid", gap: 0.6 }}>
                {(payload?.recentSyncs ?? []).slice(0, 15).map((row) => (
                  <Box key={`${row.orderId}-${row.syncedAt}`} sx={{ display: "grid", gridTemplateColumns: "1.2fr 1.1fr .9fr auto", alignItems: "center", gap: 1, fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 1, px: 1, py: 0.7 }}>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.orderId}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.stripeSessionId}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{new Date(row.syncedAt).toLocaleString()}</Typography>
                    <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={actionLoadingId !== null}
                        onClick={() => void handleAction(row.orderId, "stornieren")}
                      >
                        Stornieren
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={actionLoadingId !== null}
                        onClick={() => void handleAction(row.orderId, "delete")}
                      >
                        Löschen
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </AdminToolShell>
  );
}

export function ReactAdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px]">
    <Admin dataProvider={dataProvider} dashboard={AdminDashboardHome} title="DUD Studio Admin">
      <CustomRoutes>
        <Route path="/tools/maintenance" element={<MaintenanceToolPage />} />
        <Route path="/tools/online-shop" element={<OnlineShopToolPage />} />
        <Route path="/tools/checkout-lock" element={<CheckoutLockToolPage />} />
        <Route path="/tools/vacation" element={<VacationToolPage />} />
        <Route path="/tools/email" element={<EmailConfigToolPage />} />
        <Route path="/tools/uploads" element={<UploadFoldersToolPage />} />
        <Route path="/tools/image-import" element={<CatalogImageImportToolPage />} />
        <Route path="/tools/site-images" element={<SiteImagesToolPage />} />
        <Route path="/tools/backup" element={<BackupToolPage />} />
        <Route path="/tools/werbung" element={<WerbungToolPage />} />
        <Route path="/tools/crm" element={<CRMToolPage />} />
        <Route path="/tools/shutdown" element={<ShutdownToolPage />} />
        <Route path="/tools/layouts" element={<LayoutStudioPage />} />
      </CustomRoutes>
      <Resource name="products" list={ProductList} edit={ProductEdit} create={ProductCreate} icon={Inventory2Icon} />
      <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} icon={LocalOfferIcon} />
      <Resource name="orders" options={{ label: "Bestellungen" }} list={OrdersList} edit={OrderEdit} />
      <Resource name="quotes" options={{ label: "Angebote" }} list={QuotesList} edit={QuoteEdit} create={QuoteCreate} />
      <Resource name="invoices" options={{ label: "Rechnungen" }} list={InvoicesList} edit={InvoiceEdit} create={InvoiceCreate} />
      <Resource name="fileUploads" options={{ label: "Datei-Uploads" }} list={FileUploadsList} edit={FileUploadEdit} />
      <Resource name="coupons" options={{ label: "Gutscheine" }} list={CouponsList} edit={CouponEdit} create={CouponCreate} />
      <Resource name="reviews" options={{ label: "Bewertungen" }} list={ReviewsList} edit={ReviewEdit} />
      <Resource name="newsletter" options={{ label: "Newsletter" }} list={NewsletterList} />
      <Resource name="shipping" options={{ label: "Versandarten" }} list={ShippingList} edit={ShippingEdit} create={ShippingCreate} />
    </Admin>
    </div>
  );
}
