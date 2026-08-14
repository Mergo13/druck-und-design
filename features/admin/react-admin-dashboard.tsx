"use client";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Alert, Box, Button, Card, CardContent, Grid, IconButton, MenuItem, TextField as MuiTextField, Typography } from "@mui/material";
import { createTheme } from "@mui/material/styles";
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
import { calculateConfiguredProductPrice, calculateTierPrice, validateProductPricing } from "@/lib/print-workflow";
import type { GlobalProperty, HomepageSettings, ProductCatalogItem, ProductIndustry, ProductPriceTier, ProductPricingProperty, ProductPropertyValue } from "@/types/print-platform";

type AdminRecord = RaRecord & {
  slug?: string;
  name?: string;
};

const adminColors = {
  ink: "#0a1020",
  charcoal: "#151c2f",
  blue: "#1155cc",
  blueDark: "#0d3f99",
  teal: "#007f7f",
  coral: "#d94a32",
  surface: "#ffffff",
  canvas: "#f3f6fb",
  muted: "#526070",
  border: "#d8e0ea",
  tableHead: "#eaf0f8"
};

const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: adminColors.blue, dark: adminColors.blueDark, contrastText: "#ffffff" },
    secondary: { main: adminColors.teal, dark: "#006666", contrastText: "#ffffff" },
    success: { main: "#027a48" },
    warning: { main: "#b54708" },
    error: { main: "#b42318" },
    background: { default: adminColors.canvas, paper: adminColors.surface },
    text: { primary: adminColors.ink, secondary: adminColors.muted },
    divider: adminColors.border
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    h5: { fontWeight: 900, letterSpacing: 0 },
    h6: { fontWeight: 850 },
    subtitle1: { fontWeight: 800 },
    subtitle2: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: "none" }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: adminColors.canvas,
          color: adminColors.ink
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${adminColors.border}`,
          boxShadow: "0 1px 2px rgba(10,16,32,.04), 0 10px 24px rgba(10,16,32,.06)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          color: adminColors.ink
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none"
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none" }
        },
        outlined: {
          borderColor: adminColors.border,
          color: adminColors.ink,
          "&:hover": {
            borderColor: adminColors.blue,
            backgroundColor: "rgba(17,85,204,.06)"
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: adminColors.charcoal,
          fontWeight: 700
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: adminColors.surface,
          color: adminColors.ink
        },
        input: {
          color: adminColors.ink
        }
      }
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: adminColors.surface,
          border: `1px solid ${adminColors.border}`,
          borderRadius: 8,
          "&:before, &:after": { display: "none" },
          "&:hover": { backgroundColor: adminColors.surface, borderColor: "#a9b7c9" },
          "&.Mui-focused": { backgroundColor: adminColors.surface, borderColor: adminColors.blue, boxShadow: "0 0 0 3px rgba(17,85,204,.14)" }
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          margin: 0,
          minHeight: 0,
          color: adminColors.muted
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: adminColors.charcoal,
          fontWeight: 900,
          backgroundColor: adminColors.tableHead
        },
        body: {
          color: adminColors.ink
        }
      }
    }
  }
});

function AdminImagePreview({ src, alt, sx, children }: { src?: string; alt: string; sx?: object; children?: ReactNode }) {
  const value = String(src ?? "").trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [value]);

  return (
    <Box sx={{ position: "relative", overflow: "hidden", bgcolor: "#f8fafc", display: "grid", placeItems: "center", ...sx }}>
      {value && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Box sx={{ minWidth: 0, px: 1, textAlign: "center" }}>
          <Typography variant="caption" sx={{ display: "block", fontWeight: 900, color: "#64748b" }}>
            Bild fehlt
          </Typography>
          {value ? (
            <Typography variant="caption" sx={{ display: "block", maxWidth: "100%", color: "#94a3b8" }} noWrap title={value}>
              {value}
            </Typography>
          ) : null}
        </Box>
      )}
      {children}
    </Box>
  );
}

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
const catalogResources = new Set(["products", "categories", "properties", "industries"]);

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
  getList: async (resource: string, params: { pagination?: { page: number; perPage: number }; sort?: { field: string; order: "ASC" | "DESC" }; filter?: Record<string, unknown> }) => {
    if (catalogResources.has(resource)) {
      const data = await fetchJson<AdminRecord[]>(`${catalogApiUrl}/${resource}?scope=admin`);
      const q = typeof params.filter?.q === "string" ? params.filter.q.toLowerCase() : "";
      const page = params.pagination?.page ?? 1;
      const perPage = params.pagination?.perPage ?? 25;
      const sortField = params.sort?.field ?? "name";
      const sortDirection = params.sort?.order === "DESC" ? -1 : 1;
      const mapped = data.map((item) => {
        const base = { ...item, id: item.slug ?? item.id };
        if (resource !== "products") return normalizeCatalogRecordForAdmin(base);
        return normalizeCatalogRecordForAdmin({ ...base, productStatus: item.productStatus ?? (item.visible === false || item.published === false ? "inactive" : "active"), pricingType: item.pricingType ?? "fixed", priceTiers: item.priceTiers ?? [{ quantity: 1, price: item.basePrice ?? 0 }], pricingProperties: item.pricingProperties ?? [], visible: item.visible ?? true, published: item.published ?? true });
      });
      const filtered = q
        ? mapped.filter((item) => `${item.name ?? ""} ${item.slug ?? ""} ${item.id ?? ""}`.toLowerCase().includes(q))
        : mapped;
      const sorted = [...filtered].sort((a, b) => {
        const left = String(a[sortField] ?? "").toLowerCase();
        const right = String(b[sortField] ?? "").toLowerCase();
        return left.localeCompare(right, "de") * sortDirection;
      });
      const start = (page - 1) * perPage;
      return {
        data: sorted.slice(start, start + perPage),
        total: filtered.length
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
      const base = { ...data, id: data.slug ?? data.id };
      if (resource !== "products") return { data: normalizeCatalogRecordForAdmin(base) };
      return { data: normalizeCatalogRecordForAdmin({ ...base, productStatus: data.productStatus ?? (data.visible === false || data.published === false ? "inactive" : "active"), pricingType: data.pricingType ?? "fixed", priceTiers: data.priceTiers ?? [{ quantity: 1, price: data.basePrice ?? 0 }], pricingProperties: data.pricingProperties ?? [], visible: data.visible ?? true, published: data.published ?? true }) };
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
        : resource === "industries"
          ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
        : resource === "properties"
          ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
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
    <Card sx={{ borderRadius: 2, borderColor: adminColors.border, boxShadow: "0 1px 2px rgba(10,16,32,.05), 0 10px 24px rgba(10,16,32,.06)" }}>
      <CardContent>
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", fontSize: 11 }}>{label}</Typography>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 850, color: adminColors.ink }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

type AdminOrderItem = { id: string; total: number; createdAt: string; status?: string };
type PeriodKey = "7d" | "30d" | "90d" | "365d";
type DashboardStats = {
  vatPercent: number;
  productsTotal: number;
  categoriesTotal: number;
  customersTotal: number;
  orderCount: number;
  revenueOrderCount: number;
  openRequestCount: number;
  grossRevenue: number;
  netRevenue: number;
  taxAmount: number;
  averageOrder: number;
  chartBuckets: Array<{ label: string; value: number; height: number }>;
};

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

function parseCsvRows(input: string): Record<string, string>[] {
  const text = input.trim().replace(/^\uFEFF/, "");
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const parseLine = (line: string) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    return cells;
  };
  const headers = parseLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function normalizeCsvKey(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function csvCell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const direct = row[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeCsvKey(key), value]));
  for (const key of keys) {
    const value = normalized.get(normalizeCsvKey(key));
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function csvBool(value: string | undefined, fallback = true) {
  if (!value) return fallback;
  return ["1", "true", "ja", "yes", "aktiv"].includes(value.trim().toLowerCase());
}

function csvNumber(value: string | undefined, fallback = 0) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : fallback;
}

function csvList(value: string | undefined) {
  return String(value ?? "").split("|").map((item) => item.trim()).filter(Boolean);
}

function csvSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvPriceTiers(value: string | undefined, basePrice: number): ProductPriceTier[] {
  const rows = csvList(value).map((entry) => {
    const [range, price] = entry.split(":");
    const [from, to] = range.split("-");
    const fromQuantity = csvNumber(from);
    const toQuantity = to ? csvNumber(to) : undefined;
    const unitPrice = csvNumber(price);
    return { quantity: fromQuantity, fromQuantity, toQuantity, unitPrice, price: Math.round(unitPrice * fromQuantity * 100) / 100 };
  }).filter((tier) => tier.quantity > 0 && (tier.unitPrice ?? 0) >= 0);
  return rows.length ? rows : [{ quantity: 1, price: basePrice }];
}

function AdminDashboardHome() {
  const redirect = useRedirect();
  const notify = useNotify();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
    { label: "CSV Katalog Import", path: "/tools/catalog-csv", color: "primary" as const },
    { label: "Homepage Inhalte", path: "/tools/homepage", color: "primary" as const },
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
        const statsRes = await fetch(`/api/admin/stats?period=${period}`);
        if (!statsRes.ok) throw new Error();
        const payload = await statsRes.json() as DashboardStats;
        setStats(payload);
        setVatPercent(Number(payload.vatPercent ?? 20));
      } catch {
        notify("Dashboard-Daten konnten nicht geladen werden.", { type: "error" });
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [period]);

  async function saveTax() {
    setSavingTax(true);
    try {
      const res = await fetch("/api/admin/tools?action=tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatPercent })
      });
      if (!res.ok) throw new Error();
      const statsRes = await fetch(`/api/admin/stats?period=${period}`);
      if (statsRes.ok) {
        const payload = await statsRes.json() as DashboardStats;
        setStats(payload);
        setVatPercent(Number(payload.vatPercent ?? vatPercent));
      }
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
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Produkte" value={String(stats?.productsTotal ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Kategorien" value={String(stats?.categoriesTotal ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Bestellungen" value={String(stats?.revenueOrderCount ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Offene Anfragen" value={String(stats?.openRequestCount ?? 0)} />
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
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Brutto Umsatz" value={formatCurrency(stats?.grossRevenue ?? 0)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label={`Netto (bei ${vatPercent}%)`} value={formatCurrency(stats?.netRevenue ?? 0)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="MwSt Betrag" value={formatCurrency(stats?.taxAmount ?? 0)} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Ø Bestellwert" value={formatCurrency(stats?.averageOrder ?? 0)} /></Grid>
            </Grid>

            <Box sx={{ mt: 2, border: "1px solid #e2e8f0", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Umsatzverlauf</Typography>
              <Box sx={{ height: 180, display: "flex", alignItems: "flex-end", gap: 0.75 }}>
                {(stats?.chartBuckets ?? []).map((bucket) => (
                  <Box key={bucket.label} sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: `${bucket.height}%`,
                        borderRadius: 1,
                        bgcolor: adminColors.blue,
                        transition: "height 500ms ease"
                      }}
                      title={`${bucket.label}: ${formatCurrency(bucket.value)}`}
                    />
                    <Typography variant="caption" sx={{ display: "block", mt: 0.4, textAlign: "center", color: adminColors.muted }}>
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
    <List sort={{ field: "category", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="category" label="Gruppe" />
        <TextField source="slug" />
        <TextField source="name" />
        <TextField source="productStatus" label="Status" />
        <BooleanField source="isBestseller" label="Bestseller" />
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
      <TextInput source="invoiceNumber" label="Rechnungsnummer" helperText="Leer lassen für automatische Nummer." />
      <TextInput source="customer" label="Kunde" validate={[required()]} />
      <TextInput source="email" label="E-Mail" type="email" />
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

function FileUploadReadOnlyDetails() {
  const record = useRecordContext<AdminRecord & { name?: string; email?: string; topic?: string; message?: string }>();
  if (!record) return null;
  return (
    <Box sx={{ display: "grid", gap: 1.5, mb: 2 }}>
      {[
        { label: "Name", value: record.name },
        { label: "E-Mail", value: record.email },
        { label: "Thema", value: record.topic },
        { label: "Nachricht", value: record.message }
      ].map((item) => (
        <Box key={item.label} sx={{ border: `1px solid ${adminColors.border}`, borderRadius: 2, p: 1.5, bgcolor: adminColors.canvas }}>
          <Typography variant="caption" sx={{ display: "block", color: adminColors.muted, fontWeight: 800, textTransform: "uppercase" }}>
            {item.label}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", color: adminColors.ink }}>
            {item.value || "-"}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function FileUploadEdit() {
  return (
    <Edit>
      <SimpleForm>
        <FileUploadReadOnlyDetails />
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
    <List sort={{ field: "createdAt", order: "DESC" }}>
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
      <TextInput source="code" label="Code" helperText="Leer lassen für automatischen Code." />
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
    <List sort={{ field: "createdAt", order: "DESC" }}>
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
        <TextInput source="email" label="E-Mail" />
        <TextInput source="orderId" label="Bestellung" />
        <TextInput source="productName" label="Produkt" />
        <NumberInput source="rating" label="Bewertung" min={1} max={5} validate={[required()]} />
        <TextInput source="comment" label="Kommentar" multiline validate={[required()]} />
        <TextInput source="adminNote" label="Admin Notiz" multiline />
        <BooleanInput source="published" label="Veröffentlicht" />
      </SimpleForm>
    </Edit>
  );
}

function NewsletterList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="email" label="E-Mail" />
        <BooleanField source="active" label="Aktiv" />
        <DateField source="createdAt" label="Registriert" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function NewsletterForm() {
  return (
    <>
      <TextInput source="email" label="E-Mail" type="email" validate={[required()]} />
      <BooleanInput source="active" label="Aktiv" defaultValue />
    </>
  );
}

function NewsletterCreate() {
  return <Create><SimpleForm><NewsletterForm /></SimpleForm></Create>;
}

function NewsletterEdit() {
  return <Edit><SimpleForm><NewsletterForm /></SimpleForm></Edit>;
}

function NewsletterCampaignList() {
  return (
    <List sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="subject" label="Betreff" />
        <TextField source="status" label="Status" />
        <NumberField source="recipientCount" label="Empfänger" />
        <DateField source="sentAt" label="Gesendet" emptyText="-" showTime />
        <DateField source="createdAt" label="Erstellt" showTime />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function NewsletterCampaignForm() {
  return (
    <>
      <TextInput source="subject" label="Betreff" validate={[required()]} />
      <TextInput source="preheader" label="Vorschautext" />
      <SelectInput source="status" defaultValue="draft" choices={[
        { id: "draft", name: "Entwurf" },
        { id: "sent", name: "Jetzt senden" }
      ]} />
      <TextInput source="body" label="Newsletter Inhalt" multiline validate={[required()]} />
      <TextInput source="ctaLabel" label="Button Text" />
      <TextInput source="ctaUrl" label="Button Link" type="url" />
      <NumberInput source="recipientCount" label="Empfänger" disabled />
      <TextInput source="sentAt" label="Gesendet am" disabled />
      <TextInput source="lastError" label="Letzter Fehler" multiline disabled />
    </>
  );
}

function NewsletterCampaignEdit() {
  return <Edit><SimpleForm><NewsletterCampaignForm /></SimpleForm></Edit>;
}

function NewsletterCampaignCreate() {
  return <Create><SimpleForm><NewsletterCampaignForm /></SimpleForm></Create>;
}

function StudentArticleList() {
  return (
    <List sort={{ field: "sortOrder", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="slug" label="Slug" />
        <TextField source="title" label="Titel" />
        <TextField source="category" label="Kategorie" />
        <TextField source="status" label="Status" />
        <BooleanField source="featured" label="Featured" />
        <NumberField source="sortOrder" label="Reihenfolge" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" confirmTitle="Artikel löschen?" confirmContent="Der Ratgeber-Artikel wird dauerhaft gelöscht." />
      </Datagrid>
    </List>
  );
}

function StudentArticleForm() {
  return (
    <>
      <TextInput source="slug" label="Slug" validate={[required()]} />
      <TextInput source="title" label="Titel" validate={[required()]} fullWidth />
      <TextInput source="excerpt" label="Kurzbeschreibung" multiline validate={[required()]} fullWidth />
      <SelectInput source="category" label="Kategorie" validate={[required()]} choices={[
        "Abschlussarbeit",
        "Bachelorarbeit",
        "Masterarbeit",
        "Dissertation",
        "Bindungen",
        "Druckvorbereitung",
        "Poster",
        "Skripten",
        "Tipps & Ratgeber"
      ].map((item) => ({ id: item, name: item }))} />
      <SelectInput source="status" label="Status" defaultValue="draft" choices={[
        { id: "draft", name: "Entwurf" },
        { id: "published", name: "Veröffentlicht" }
      ]} />
      <BooleanInput source="featured" label="Featured" />
      <NumberInput source="sortOrder" label="Reihenfolge" defaultValue={0} />
      <TextInput source="publishDate" label="Veröffentlichung (ISO)" helperText="Optional, z.B. 2026-08-11T00:00:00.000Z" />
      <TextInput source="featuredImage" label="Bild URL" />
      <TextInput source="seoTitle" label="SEO Titel" fullWidth />
      <TextInput source="metaDescription" label="Meta Description" multiline fullWidth />
      <TextInput source="canonicalUrl" label="Canonical URL" fullWidth />
      <TextInput source="body" label="Artikeltext" multiline validate={[required()]} fullWidth />
      <ArrayInput source="tags" label="Tags">
        <SimpleFormIterator inline disableClear>
          <TextInput source="" label="Tag" helperText={false} />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="relatedProducts" label="Verknüpfte Produkte">
        <SimpleFormIterator inline disableClear>
          <TextInput source="" label="Produkt-Slug" helperText={false} />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="relatedArticles" label="Verwandte Artikel">
        <SimpleFormIterator inline disableClear>
          <TextInput source="" label="Artikel-Slug" helperText={false} />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="faqs" label="FAQ">
        <SimpleFormIterator disableClear>
          <TextInput source="question" label="Frage" />
          <TextInput source="answer" label="Antwort" multiline />
        </SimpleFormIterator>
      </ArrayInput>
    </>
  );
}

function StudentArticleEdit() {
  return <Edit><SimpleForm warnWhenUnsavedChanges><StudentArticleForm /></SimpleForm></Edit>;
}

function StudentArticleCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ status: "draft", featured: false, sortOrder: 0, tags: [], relatedProducts: [], relatedArticles: [], faqs: [] }}>
        <StudentArticleForm />
      </SimpleForm>
    </Create>
  );
}

function StudentVerificationList() {
  return (
    <List sort={{ field: "submittedAt", order: "DESC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="email" label="E-Mail" />
        <TextField source="fullName" label="Name" />
        <TextField source="university" label="Uni/FH" />
        <TextField source="status" label="Status" />
        <TextField source="validUntil" label="Gültig bis" />
        <TextField source="submittedAt" label="Eingereicht" />
        <EditButton />
      </Datagrid>
    </List>
  );
}

function StudentVerificationEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm warnWhenUnsavedChanges>
        <TextInput source="email" label="E-Mail" disabled />
        <TextInput source="fullName" label="Name" disabled />
        <TextInput source="university" label="Uni/FH" disabled />
        <TextInput source="documentPath" label="Interner Dokumentpfad" disabled fullWidth helperText="Nicht öffentlich auslieferbar; Datei liegt unter data/private." />
        <SelectInput source="status" label="Status" choices={[
          { id: "pending", name: "Pending" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
          { id: "expired", name: "Expired" }
        ]} />
        <TextInput source="validUntil" label="Gültig bis" helperText="Optional, z.B. 2027-09-30" />
        <TextInput source="reviewNote" label="Notiz" multiline fullWidth />
      </SimpleForm>
    </Edit>
  );
}

function ShippingList() {
  return (
    <List sort={{ field: "price", order: "ASC" }}>
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

  async function uploadFile(file: File, imageRole: "hero" | "gallery") {
    const formData = new FormData();
    formData.append("file", file);
    if (record?.slug) {
      formData.append("targetSlug", record.slug);
      formData.append("targetType", "product");
      formData.append("imageRole", imageRole);
    }
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
      const url = await uploadFile(file, "hero");
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
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadFile(file, "gallery"));
      }
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
      <Typography variant="subtitle2">Produktbilder</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="outlined" component="label" disabled={uploadingHero}>
          {uploadingHero ? "Lädt hoch..." : "Hauptbild hochladen"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={onHeroImageChange} />
        </Button>
        <Button variant="outlined" component="label" disabled={uploadingGallery}>
          {uploadingGallery ? "Fügt hinzu..." : "Galeriebilder hochladen"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple hidden onChange={onGalleryImageChange} />
        </Button>
      </Box>
      {currentHero ? (
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: 180 }}>
            <Typography variant="caption" color="text.secondary">Hauptbild Vorschau</Typography>
            <IconButton size="small" aria-label="Remove hero image" onClick={removeHeroImage}>
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <AdminImagePreview src={currentHero} alt="Hero" sx={{ mt: 0.5, border: "1px solid #e2e8f0", borderRadius: "6px", width: 180, height: 100 }} />
        </Box>
      ) : null}
      {currentGallery.length > 0 ? (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Galerie ({currentGallery.length})</Typography>
          <Box sx={{ mt: 0.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {currentGallery.slice(0, 12).map((url) => (
              <AdminImagePreview key={url} src={url} alt="Gallery" sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", width: 84, height: 56 }}>
                <IconButton
                  size="small"
                  aria-label="Remove gallery image"
                  onClick={() => removeGalleryImage(url)}
                  sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "white" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </AdminImagePreview>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function sortNumericTiers(tiers: ProductPriceTier[]) {
  return [...tiers].sort((a, b) => Number(a.fromQuantity ?? a.quantity) - Number(b.fromQuantity ?? b.quantity));
}

function syncTierSurcharges(properties: ProductPricingProperty[], tiers: ProductPriceTier[]) {
  const quantities = tiers.map((tier) => Number(tier.fromQuantity ?? tier.quantity)).filter((quantity) => Number.isFinite(quantity) && quantity > 0);
  return properties.map((property) => ({
    ...property,
    values: (property.values ?? []).map((value) => {
      if (value.pricingMode !== "tiered") return value;
      const current = new Map((value.tierPrices ?? []).map((tier) => [Number(tier.quantity), Number(tier.price) || 0]));
      return {
        ...value,
        tierPrices: quantities.map((quantity) => ({ quantity, price: current.get(quantity) ?? 0, fromQuantity: quantity }))
      };
    })
  }));
}

function productPropertyFromGlobal(property: GlobalProperty, tiers: ProductPriceTier[]): ProductPricingProperty {
  return {
    propertyId: property.slug,
    name: property.name,
    required: true,
    sortOrder: 0,
    values: (property.values ?? [])
      .filter((value) => value.active !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((value, index) => ({
        propertyValueId: value.id,
        value: value.value,
        label: value.label,
        enabled: false,
        defaultSelected: index === 0,
        sortOrder: index,
        pricingMode: "included" as const,
        tierPrices: tiers.map((tier) => ({ quantity: Number(tier.fromQuantity ?? tier.quantity), fromQuantity: Number(tier.fromQuantity ?? tier.quantity), toQuantity: tier.toQuantity, price: 0 }))
      }))
  };
}

function ProductDuplicateButton() {
  const notify = useNotify();
  const redirect = useRedirect();
  const record = useRecordContext<ProductCatalogItem & { id?: string }>();
  if (!record?.slug) return null;
  const productRecord = record;

  async function duplicateProduct() {
    const slug = window.prompt("Neuer Produkt-Slug", `${productRecord.slug}-kopie`);
    if (!slug) return;
    const name = window.prompt("Neuer Produktname", `${productRecord.name} Kopie`) || `${productRecord.name} Kopie`;
    const payload = {
      ...productRecord,
      id: undefined,
      slug,
      name,
      productStatus: "draft",
      visible: false,
      published: false
    };
    try {
      const res = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body?.message === "string" ? body.message : "Duplizieren fehlgeschlagen.");
      notify("Produkt als Entwurf dupliziert.", { type: "success" });
      redirect(`/products/${slug}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Duplizieren fehlgeschlagen.", { type: "error" });
    }
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Button variant="outlined" onClick={() => void duplicateProduct()}>Produkt duplizieren</Button>
    </Box>
  );
}

function ProductPricingManager() {
  const { setValue, getValues } = useFormContext();
  const pricingType = (useWatch({ name: "pricingType" }) as ProductCatalogItem["pricingType"] | undefined) ?? "tiered";
  const productStatus = (useWatch({ name: "productStatus" }) as ProductCatalogItem["productStatus"] | undefined) ?? "draft";
  const basePrice = Number(useWatch({ name: "basePrice" }) ?? 0);
  const priceTiers = (useWatch({ name: "priceTiers" }) as ProductPriceTier[] | undefined) ?? [];
  const pricingProperties = (useWatch({ name: "pricingProperties" }) as ProductPricingProperty[] | undefined) ?? [];
  const priceHistory = (useWatch({ name: "priceHistory" }) as ProductCatalogItem["priceHistory"] | undefined) ?? [];
  const [previewQuantity, setPreviewQuantity] = useState<number>(() => Number(priceTiers[0]?.quantity ?? 1));
  const [previewConfig, setPreviewConfig] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const { data: globalPropertiesRaw = [] } = useGetList("properties", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "sortOrder", order: "ASC" }
  });
  const { data: productsForCopyRaw = [] } = useGetList("products", {
    pagination: { page: 1, perPage: 250 },
    sort: { field: "name", order: "ASC" }
  });
  const globalProperties = globalPropertiesRaw as unknown as GlobalProperty[];
  const productsForCopy = productsForCopyRaw as unknown as ProductCatalogItem[];
  const tierRows = priceTiers.length ? priceTiers : [{ quantity: 1, price: basePrice || 0 }];
  const attachedPropertyIds = new Set(pricingProperties.map((property) => property.propertyId || property.name.toLowerCase()));
  const propertyResults = globalProperties
    .filter((property) => property.active !== false)
    .filter((property) => !propertySearch || property.name.toLowerCase().includes(propertySearch.toLowerCase()))
    .slice(0, 12);

  function updateTiers(next: ProductPriceTier[]) {
    const normalized = next.map((tier) => {
      const fromQuantity = Number(tier.fromQuantity ?? tier.quantity);
      const toQuantity = tier.toQuantity === undefined || tier.toQuantity === null ? undefined : Number(tier.toQuantity);
      const unitPrice = tier.unitPrice === undefined ? undefined : Number(tier.unitPrice);
      const price = unitPrice !== undefined ? Math.round(unitPrice * fromQuantity * 100) / 100 : Number(tier.price) || 0;
      return { ...tier, quantity: fromQuantity, fromQuantity, toQuantity, unitPrice, price };
    });
    setValue("priceTiers", normalized, { shouldDirty: true });
    setValue("quantitySteps", normalized.map((tier) => Number(tier.fromQuantity)).filter(Boolean), { shouldDirty: true });
    setValue("pricingProperties", syncTierSurcharges(pricingProperties, normalized), { shouldDirty: true });
  }

  function updateProperties(next: ProductPricingProperty[]) {
    setValue("pricingProperties", syncTierSurcharges(next, tierRows), { shouldDirty: true });
  }

  useEffect(() => {
    if (!globalProperties.length || !pricingProperties.length) return;
    let changed = false;
    const next = structuredClone(pricingProperties);
    for (const property of next) {
      const global = globalProperties.find((item) => item.slug === property.propertyId || item.name.toLowerCase() === property.name.toLowerCase());
      if (!global) continue;
      property.propertyId = global.slug;
      property.name = global.name;
      for (const globalValue of (global.values ?? []).filter((value) => value.active !== false)) {
        const exists = property.values.some((value) => value.propertyValueId === globalValue.id || value.value.toLowerCase() === globalValue.value.toLowerCase());
        if (exists) continue;
        property.values.push({
          propertyValueId: globalValue.id,
          value: globalValue.value,
          label: globalValue.label,
          enabled: false,
          defaultSelected: false,
          sortOrder: property.values.length,
          pricingMode: "included",
          tierPrices: tierRows.map((tier) => {
            const quantity = Number(tier.fromQuantity ?? tier.quantity);
            return { quantity, fromQuantity: quantity, toQuantity: tier.toQuantity, price: 0 };
          })
        });
        changed = true;
      }
    }
    if (changed) updateProperties(next);
  }, [globalProperties, pricingProperties, tierRows]);

  function currentProduct(): ProductCatalogItem {
    const values = getValues() as ProductCatalogItem;
    return {
      ...values,
      basePrice,
      pricingType,
      productStatus,
      priceTiers: tierRows,
      pricingProperties
    };
  }

  const preview = calculateConfiguredProductPrice(currentProduct(), previewQuantity || Number(tierRows[0]?.quantity ?? 1), previewConfig);
  const previewTier = pricingType === "tiered"
    ? (() => {
      try {
        return calculateTierPrice(previewQuantity || Number(tierRows[0]?.quantity ?? 1), tierRows);
      } catch {
        return null;
      }
    })()
    : null;
  const validationErrors = validateProductPricing(currentProduct());

  function exportCsv() {
    setCsvText(["from_quantity,to_quantity,unit_price", ...tierRows.map((tier) => `${tier.fromQuantity ?? tier.quantity},${tier.toQuantity ?? ""},${tier.unitPrice ?? tier.price}`)].join("\n"));
  }

  function importCsv() {
    const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rows = lines.slice(lines[0]?.toLowerCase().includes("quantity") ? 1 : 0).map((line) => {
      const [fromQuantity, toQuantity, unitPrice] = line.split(",").map((cell) => Number(cell.trim()));
      return { quantity: fromQuantity, fromQuantity, toQuantity: Number.isFinite(toQuantity) && toQuantity > 0 ? toQuantity : undefined, unitPrice, price: Math.round(fromQuantity * unitPrice * 100) / 100 };
    }).filter((row) => Number.isFinite(row.fromQuantity) && row.fromQuantity > 0 && Number.isFinite(row.unitPrice) && row.unitPrice >= 0);
    if (rows.length) updateTiers(rows);
  }

  function countTierDependencies(quantity: number) {
    return pricingProperties.reduce((sum, property) => sum + (property.values ?? []).filter((value) => value.pricingMode === "tiered" && (value.tierPrices ?? []).some((tier) => Number(tier.quantity) === quantity)).length, 0);
  }

  function deleteTier(index: number) {
    const quantity = Number(tierRows[index]?.quantity);
    const dependencies = countTierDependencies(quantity);
    if (dependencies > 0 && !window.confirm(`Die Staffel ${quantity} wird auch bei ${dependencies} Eigenschaftswerten verwendet.\n\nMöchten Sie diese Staffel wirklich entfernen?`)) return;
    updateTiers(tierRows.filter((_, rowIndex) => rowIndex !== index));
  }

  function duplicateTiers() {
    updateTiers([...tierRows, ...tierRows.map((tier) => ({ ...tier, quantity: Number(tier.fromQuantity ?? tier.quantity) + 1, fromQuantity: Number(tier.fromQuantity ?? tier.quantity) + 1 }))]);
  }

  function clearTiers() {
    const dependencies = tierRows.reduce((sum, tier) => sum + countTierDependencies(Number(tier.fromQuantity ?? tier.quantity)), 0);
    if (dependencies > 0 && !window.confirm(`Diese Staffeln werden auch bei ${dependencies} Eigenschaftswerten verwendet.\n\nMöchten Sie alle Staffeln wirklich löschen?`)) return;
    updateTiers([{ quantity: 1, price: 0 }]);
  }

  function copyTiersFromProduct(slug: string) {
    const source = productsForCopy.find((product) => product.slug === slug);
    if (!source?.priceTiers?.length) return;
    updateTiers(source.priceTiers.map((tier) => ({ ...tier, quantity: Number(tier.fromQuantity ?? tier.quantity), fromQuantity: Number(tier.fromQuantity ?? tier.quantity), price: Number(tier.price) || 0, unitPrice: tier.unitPrice })));
  }

  function roundPrice(value: number, step: number) {
    if (!step) return Math.round(value * 100) / 100;
    return Math.round(value / step) * step;
  }

  function adjustedPrice(value: number, percent: number, amount: number, rounding: number) {
    return Math.max(0, Math.round(roundPrice((value + value * percent / 100) + amount, rounding) * 100) / 100);
  }

  function adjustBaseTiers(percent: number, amount: number, rounding: number) {
    updateTiers(tierRows.map((tier) => {
      const currentUnit = Number(tier.unitPrice ?? tier.price) || 0;
      const unitPrice = adjustedPrice(currentUnit, percent, amount, rounding);
      return { ...tier, unitPrice, price: Math.round(unitPrice * Number(tier.fromQuantity ?? tier.quantity) * 100) / 100 };
    }));
  }

  function adjustPropertyTierPrices(propertyIndex: number, percent: number, amount: number, rounding: number) {
    const next = structuredClone(pricingProperties);
    next[propertyIndex].values = next[propertyIndex].values.map((value) => value.pricingMode === "tiered"
      ? { ...value, tierPrices: (value.tierPrices ?? []).map((tier) => ({ ...tier, price: adjustedPrice(Number(tier.price) || 0, percent, amount, rounding) })) }
      : value);
    updateProperties(next);
  }

  function copyTierPricesFromPreviousValue(propertyIndex: number, valueIndex: number) {
    if (valueIndex <= 0) return;
    const next = structuredClone(pricingProperties);
    next[propertyIndex].values[valueIndex].tierPrices = structuredClone(next[propertyIndex].values[valueIndex - 1].tierPrices ?? []);
    next[propertyIndex].values[valueIndex].fixedPrice = next[propertyIndex].values[valueIndex - 1].fixedPrice;
    updateProperties(next);
  }

  return (
    <Card variant="outlined" sx={{
      my: 2,
      width: "100%",
      maxWidth: "none",
      borderRadius: 2,
      borderColor: "#cbd5e1",
      bgcolor: "#fff",
      color: "#0f172a",
      "& .MuiInputLabel-root": { color: "#334155", fontWeight: 700 },
      "& .MuiInputBase-root": { bgcolor: "#fff", color: "#0f172a" },
      "& .MuiFormHelperText-root": { minHeight: 0, m: 0 }
    }}>
      <CardContent sx={{ display: "grid", gap: 2.25, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc", p: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a" }}>Preisstruktur</Typography>
            <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>Preisart, Mengen, Eigenschaften und Vorschau einfach verwalten.</Typography>
          </Box>
          <Typography variant="caption" sx={{ border: "1px solid #bbf7d0", borderRadius: 999, px: 1.5, py: 0.75, bgcolor: "#f0fdf4", color: "#166534", fontWeight: 900 }}>
            {productStatus === "active" ? "Aktiv" : productStatus === "inactive" ? "Inaktiv" : "Entwurf"}
          </Typography>
        </Box>
        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "#fff", borderColor: "#e2e8f0", color: "#0f172a" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 900, color: "#0f172a" }}>Basis</Typography>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SelectInput source="productStatus" label="Produktstatus" defaultValue="draft" choices={[
              { id: "draft", name: "Entwurf" },
              { id: "active", name: "Aktiv" },
              { id: "inactive", name: "Inaktiv" }
            ]} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <SelectInput source="pricingType" label="Preisart" defaultValue="tiered" choices={[
              { id: "tiered", name: "Staffelpreis" },
              { id: "fixed", name: "Fixpreis" },
              { id: "area", name: "m² Preis (Breite x Höhe)" },
              { id: "hourly", name: "Stundenpreis" }
            ]} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <NumberInput source="basePrice" label={pricingType === "area" ? "Preis pro m² (€)" : pricingType === "hourly" ? "Stundensatz (€)" : pricingType === "fixed" ? "Fixpreis (€)" : "Grundpreis / Ab-Preis (€)"} min={0} step={0.01} fullWidth />
          </Grid>
        </Grid>

        {pricingType === "area" ? (
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <NumberInput source="areaPricing.defaultWidthCm" label="Standard Breite (cm)" min={1} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <NumberInput source="areaPricing.defaultHeightCm" label="Standard Höhe (cm)" min={1} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <NumberInput source="areaPricing.minAreaM2" label="Mindestfläche (m²)" min={0} step={0.01} fullWidth />
            </Grid>
          </Grid>
        ) : null}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "white" }}>
          <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Mengen / Staffelpreise</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button size="small" variant="contained" onClick={() => {
                const lastTo = Number(tierRows.at(-1)?.toQuantity ?? tierRows.at(-1)?.fromQuantity ?? tierRows.at(-1)?.quantity ?? 0);
                updateTiers([...tierRows, { quantity: lastTo + 1, fromQuantity: lastTo + 1, toQuantity: lastTo + 100, unitPrice: 0, price: 0 }]);
              }}>Staffel hinzufügen</Button>
              <Button size="small" variant="outlined" onClick={duplicateTiers}>Staffeln duplizieren</Button>
              <Button size="small" color="error" variant="outlined" onClick={clearTiers}>Staffeln löschen</Button>
              <Button size="small" variant="outlined" onClick={() => updateTiers(sortNumericTiers(tierRows))}>Sortieren</Button>
            </Box>
          </Box>
          <Box sx={{ mb: 1.5, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <MuiTextField select size="small" label="Staffelpreise von Produkt übernehmen" defaultValue="" sx={{ minWidth: 280 }} onChange={(event) => copyTiersFromProduct(event.target.value)}>
              <MenuItem value="">Produkt auswählen</MenuItem>
              {productsForCopy.map((product) => (
                <MenuItem key={product.slug} value={product.slug}>{product.name}</MenuItem>
              ))}
            </MuiTextField>
            <Button size="small" variant="outlined" onClick={() => adjustBaseTiers(5, 0, 0)}>+5%</Button>
            <Button size="small" variant="outlined" onClick={() => adjustBaseTiers(10, 0, 0.1)}>+10% / 0,10</Button>
            <Button size="small" variant="outlined" onClick={() => adjustBaseTiers(0, 5, 0)}>+5 €</Button>
            <Button size="small" variant="outlined" onClick={() => adjustBaseTiers(0, -5, 0)}>-5 €</Button>
          </Box>
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "120px 120px 160px 160px 1fr", gap: 1, px: 1, py: 0.75, borderRadius: 1, bgcolor: "#f1f5f9" }}>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>Von</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>Bis</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>Preis / Stück</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>Summe ab Von</Typography>
              <Typography variant="caption" sx={{ fontWeight: 900 }}>Aktionen</Typography>
            </Box>
            {tierRows.map((tier, index) => (
              <Box key={`${tier.quantity}-${index}`} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "120px 120px 160px 160px 1fr" }, gap: 1, alignItems: "center", p: 1, border: "1px solid #e2e8f0", borderRadius: 1.5, bgcolor: "white" }}>
                <MuiTextField size="small" label="Von" type="number" value={tier.fromQuantity ?? tier.quantity} onChange={(event) => {
                  const next = [...tierRows];
                  const fromQuantity = Number(event.target.value);
                  next[index] = { ...tier, quantity: fromQuantity, fromQuantity, price: Math.round((Number(tier.unitPrice ?? tier.price) || 0) * fromQuantity * 100) / 100 };
                  updateTiers(next);
                }} />
                <MuiTextField size="small" label="Bis" type="number" value={tier.toQuantity ?? ""} onChange={(event) => {
                  const next = [...tierRows];
                  next[index] = { ...tier, toQuantity: event.target.value ? Number(event.target.value) : undefined };
                  updateTiers(next);
                }} />
                <MuiTextField size="small" label="Preis / Stück (€)" type="number" value={tier.unitPrice ?? tier.price} onChange={(event) => {
                  const next = [...tierRows];
                  const unitPrice = Number(event.target.value);
                  const fromQuantity = Number(tier.fromQuantity ?? tier.quantity);
                  next[index] = { ...tier, unitPrice, price: Math.round(unitPrice * fromQuantity * 100) / 100 };
                  updateTiers(next);
                }} />
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatCurrency(Number(tier.price) || 0)}</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  <Button size="small" variant="outlined" onClick={() => updateTiers([...tierRows.slice(0, index + 1), { ...tier }, ...tierRows.slice(index + 1)])}>Duplizieren</Button>
                  <Button size="small" variant="outlined" disabled={index === 0} onClick={() => {
                    const next = [...tierRows];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    updateTiers(next);
                  }}>Hoch</Button>
                  <Button size="small" variant="outlined" disabled={index === tierRows.length - 1} onClick={() => {
                    const next = [...tierRows];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    updateTiers(next);
                  }}>Runter</Button>
                  <Button size="small" color="error" variant="outlined" onClick={() => deleteTier(index)}>Löschen</Button>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 1.5, display: "grid", gap: 1 }}>
            <MuiTextField multiline minRows={3} label="CSV Import / Export Staffelpreise" value={csvText} onChange={(event) => setCsvText(event.target.value)} placeholder={"from_quantity,to_quantity,unit_price\n1,99,0.45\n100,199,0.39\n200,299,0.35"} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={exportCsv}>CSV Export</Button>
              <Button variant="outlined" onClick={importCsv}>CSV Import</Button>
            </Box>
          </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "white" }}>
          <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Eigenschaften</Typography>
              <Typography variant="caption" color="text.secondary">Globale Eigenschaften auswählen, Werte aktivieren und produktbezogene Preise setzen.</Typography>
            </Box>
            <MuiTextField size="small" label="Eigenschaft suchen" value={propertySearch} onChange={(event) => setPropertySearch(event.target.value)} sx={{ width: { xs: "100%", sm: 360 } }} />
          </Box>
          <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {propertyResults.map((property) => {
              const attached = attachedPropertyIds.has(property.slug) || attachedPropertyIds.has(property.name.toLowerCase());
              return (
                <Button
                  key={property.slug}
                  size="small"
                  variant={attached ? "outlined" : "contained"}
                  disabled={attached}
                  onClick={() => updateProperties([...pricingProperties, productPropertyFromGlobal(property, tierRows)])}
                >
                  {attached ? `${property.name} hinzugefügt` : `+ ${property.name}`}
                </Button>
              );
            })}
            {!globalProperties.length ? <Typography variant="body2" color="text.secondary">Noch keine globalen Eigenschaften angelegt.</Typography> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {pricingProperties.map((property, propertyIndex) => (
              <Card key={`${property.name}-${propertyIndex}`} variant="outlined" sx={{ borderRadius: 2, borderColor: "#cbd5e1" }}>
                <CardContent sx={{ display: "grid", gap: 1.2, py: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1fr) 150px 180px auto" }, gap: 1, alignItems: "center", pb: 1, borderBottom: "1px solid #e2e8f0" }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{property.name}</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>{property.propertyId ? `Stammdaten: ${property.propertyId}` : "Legacy-Eigenschaft"}</Typography>
                    </Box>
                    <MuiTextField select size="small" label="Pflichtfeld" value={property.required === false ? "no" : "yes"} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].required = event.target.value === "yes";
                      updateProperties(next);
                    }}>
                      <MenuItem value="yes">Ja</MenuItem>
                      <MenuItem value="no">Nein</MenuItem>
                    </MuiTextField>
                    <MuiTextField size="small" label="Stückpreis Eigenschaft (€)" type="number" value={property.stepPrice ?? 0} onChange={(event) => {
                      const next = [...pricingProperties];
                      next[propertyIndex] = { ...property, stepPrice: Number(event.target.value) };
                      updateProperties(next);
                    }} />
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Button size="small" variant="outlined" onClick={() => updateProperties([...pricingProperties.slice(0, propertyIndex + 1), JSON.parse(JSON.stringify(property)) as ProductPricingProperty, ...pricingProperties.slice(propertyIndex + 1)])}>Eigenschaft duplizieren</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => updateProperties(pricingProperties.filter((_, index) => index !== propertyIndex))}>Löschen</Button>
                    </Box>
                  </Box>

                  <Box sx={{ display: "grid", gap: 0.9 }}>
                    {(property.values ?? []).map((value, valueIndex) => (
                      <Box key={`${value.value}-${valueIndex}`} sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, p: 1, display: "grid", gap: 1, bgcolor: value.enabled === false ? "#f8fafc" : "white", color: "#0f172a" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "86px minmax(160px,1fr) minmax(160px,1fr) 190px 140px auto" }, gap: 1, alignItems: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                            <input
                              type="checkbox"
                              checked={value.enabled !== false}
                              onChange={(event) => {
                                const next = structuredClone(pricingProperties);
                                next[propertyIndex].values[valueIndex].enabled = event.target.checked;
                                updateProperties(next);
                              }}
                            />
                            Aktiv
                          </label>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: "#0f172a" }}>{value.label || value.value}</Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>{value.propertyValueId ?? value.value}</Typography>
                          </Box>
                          <MuiTextField size="small" label="Produkt-Label" value={value.labelOverride ?? ""} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].labelOverride = event.target.value;
                            updateProperties(next);
                          }} />
                          <MuiTextField select size="small" label="Preisart" value={value.pricingMode} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            const nextValue = next[propertyIndex].values[valueIndex];
                            nextValue.pricingMode = event.target.value as ProductPropertyValue["pricingMode"];
                            if (nextValue.pricingMode === "tiered") {
                              nextValue.tierPrices = tierRows.map((tier) => {
                                const quantity = Number(tier.fromQuantity ?? tier.quantity);
                                const existing = nextValue.tierPrices?.find((row) => Number(row.quantity) === quantity || Number(row.fromQuantity) === quantity);
                                const unitPrice = Number(existing?.unitPrice ?? existing?.price ?? 0);
                                return { quantity, fromQuantity: quantity, toQuantity: tier.toQuantity, price: unitPrice, unitPrice };
                              });
                            }
                            updateProperties(next);
                          }}>
                            <MenuItem value="included">Im Grundpreis enthalten</MenuItem>
                            <MenuItem value="fixed">Fixer Aufpreis</MenuItem>
                            <MenuItem value="tiered">Staffel-Aufpreis</MenuItem>
                          </MuiTextField>
                          <MuiTextField size="small" label="Aufpreis (€)" type="number" disabled={value.pricingMode !== "fixed"} value={value.fixedPrice ?? 0} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].fixedPrice = Number(event.target.value);
                            updateProperties(next);
                          }} />
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            <Button size="small" variant="outlined" onClick={() => {
                              const next = structuredClone(pricingProperties);
                              next[propertyIndex].values = next[propertyIndex].values.map((item, index) => ({ ...item, defaultSelected: index === valueIndex }));
                              updateProperties(next);
                            }}>Standard</Button>
                            <Button size="small" variant="outlined" disabled={valueIndex === 0} onClick={() => copyTierPricesFromPreviousValue(propertyIndex, valueIndex)}>Preise von oben</Button>
                            <Button size="small" color="error" variant="outlined" onClick={() => {
                              const next = structuredClone(pricingProperties);
                              next[propertyIndex].values[valueIndex].enabled = false;
                              updateProperties(next);
                            }}>Deaktivieren</Button>
                          </Box>
                        </Box>
                        {value.pricingMode === "tiered" ? (
                          <Box sx={{ overflowX: "auto", borderTop: "1px solid #e2e8f0", pt: 1 }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${tierRows.length}, minmax(92px, 1fr))`, gap: 0.75, minWidth: Math.max(360, tierRows.length * 96) }}>
                              {tierRows.map((tier) => {
                                const quantity = Number(tier.fromQuantity ?? tier.quantity);
                                const rowIndex = (value.tierPrices ?? []).findIndex((row) => Number(row.quantity) === quantity || Number(row.fromQuantity) === quantity);
                                const row = rowIndex >= 0 ? value.tierPrices?.[rowIndex] : { quantity, price: 0 };
                                return (
                                  <MuiTextField key={quantity} size="small" label={`${quantity} / Stück`} type="number" value={row?.unitPrice ?? row?.price ?? 0} onChange={(event) => {
                                    const next = structuredClone(pricingProperties);
                                    const nextValue = next[propertyIndex].values[valueIndex];
                                    const prices = nextValue.tierPrices ?? [];
                                    const foundIndex = prices.findIndex((entry) => Number(entry.quantity) === quantity);
                                    const unitPrice = Number(event.target.value);
                                    if (foundIndex >= 0) {
                                      prices[foundIndex].price = unitPrice;
                                      prices[foundIndex].unitPrice = unitPrice;
                                      prices[foundIndex].fromQuantity = quantity;
                                      prices[foundIndex].toQuantity = tier.toQuantity;
                                    } else prices.push({ quantity, fromQuantity: quantity, toQuantity: tier.toQuantity, price: unitPrice, unitPrice });
                                    nextValue.tierPrices = prices;
                                    updateProperties(next);
                                  }} />
                                );
                              })}
                            </Box>
                          </Box>
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                  {(property.values ?? []).filter((value) => value.enabled !== false && value.pricingMode === "tiered").length ? (
                    <Box sx={{ mt: 1, display: "grid", gap: 1, borderTop: "1px solid #e2e8f0", pt: 1.25 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Bulk Staffel-Aufpreise</Typography>
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                          <Button size="small" variant="outlined" onClick={() => adjustPropertyTierPrices(propertyIndex, 5, 0, 0)}>+5%</Button>
                          <Button size="small" variant="outlined" onClick={() => adjustPropertyTierPrices(propertyIndex, 10, 0, 0.1)}>+10% / 0,10</Button>
                          <Button size="small" variant="outlined" onClick={() => adjustPropertyTierPrices(propertyIndex, 0, 5, 0)}>+5 €</Button>
                          <Button size="small" variant="outlined" onClick={() => adjustPropertyTierPrices(propertyIndex, 0, -5, 0)}>-5 €</Button>
                        </Box>
                      </Box>
                      <Box sx={{ overflowX: "auto" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: `110px repeat(${(property.values ?? []).filter((value) => value.enabled !== false && value.pricingMode === "tiered").length}, minmax(120px, 1fr))`, gap: 0.75, minWidth: 520 }}>
                          <Typography variant="caption" sx={{ fontWeight: 900, p: 1, bgcolor: "#f1f5f9", borderRadius: 1 }}>Menge</Typography>
                          {(property.values ?? []).filter((value) => value.enabled !== false && value.pricingMode === "tiered").map((value) => (
                            <Typography key={`head-${value.value}`} variant="caption" sx={{ fontWeight: 900, p: 1, bgcolor: "#f1f5f9", borderRadius: 1 }}>{value.labelOverride || value.label || value.value}</Typography>
                          ))}
                          {tierRows.map((tier) => {
                            const quantity = Number(tier.fromQuantity ?? tier.quantity);
                            const tieredValues = (property.values ?? []).filter((value) => value.enabled !== false && value.pricingMode === "tiered");
                            return (
                              <Box key={`bulk-row-${property.name}-${quantity}`} sx={{ display: "contents" }}>
                                <Typography variant="body2" sx={{ p: 1, fontWeight: 800 }}>{quantity}</Typography>
                                {tieredValues.map((value) => {
                                  const valueIndex = property.values.findIndex((entry) => entry.value === value.value);
                                  const row = value.tierPrices?.find((entry) => Number(entry.quantity) === quantity || Number(entry.fromQuantity) === quantity);
                                  return (
                                    <MuiTextField key={`${value.value}-${quantity}`} size="small" type="number" value={row?.unitPrice ?? row?.price ?? 0} onChange={(event) => {
                                      const next = structuredClone(pricingProperties);
                                      const nextValue = next[propertyIndex].values[valueIndex];
                                      const prices = nextValue.tierPrices ?? [];
                                      const foundIndex = prices.findIndex((entry) => Number(entry.quantity) === quantity);
                                      const unitPrice = Number(event.target.value);
                                      if (foundIndex >= 0) {
                                        prices[foundIndex].price = unitPrice;
                                        prices[foundIndex].unitPrice = unitPrice;
                                        prices[foundIndex].fromQuantity = quantity;
                                        prices[foundIndex].toQuantity = tier.toQuantity;
                                      } else prices.push({ quantity, fromQuantity: quantity, toQuantity: tier.toQuantity, price: unitPrice, unitPrice });
                                      nextValue.tierPrices = prices;
                                      updateProperties(next);
                                    }} />
                                  );
                                })}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{
          bgcolor: "#fff",
          color: "#0f172a",
          borderRadius: 2,
          borderColor: "#cbd5e1",
          "& .MuiInputLabel-root": { color: "#334155", fontWeight: 700 },
          "& .MuiInputBase-root": { bgcolor: "#fff", color: "#0f172a" },
          "& .MuiSelect-icon": { color: "#475569" }
        }}>
          <CardContent sx={{ display: "grid", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a" }}>Preisvorschau</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "160px 1fr" }, gap: 1 }}>
              <MuiTextField select size="small" label="Menge" value={previewQuantity || tierRows[0]?.quantity || 1} onChange={(event) => setPreviewQuantity(Number(event.target.value))}>
                {tierRows.map((tier) => <MenuItem key={tier.quantity} value={tier.quantity}>{tier.quantity}</MenuItem>)}
              </MuiTextField>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {pricingType === "area" ? (
                  <>
                    <MuiTextField size="small" label="Breite (cm)" type="number" value={previewConfig.areaWidthCm ?? "100"} onChange={(event) => setPreviewConfig((current) => ({ ...current, areaWidthCm: event.target.value }))} sx={{ width: 140 }} />
                    <MuiTextField size="small" label="Höhe (cm)" type="number" value={previewConfig.areaHeightCm ?? "100"} onChange={(event) => setPreviewConfig((current) => ({ ...current, areaHeightCm: event.target.value }))} sx={{ width: 140 }} />
                  </>
                ) : null}
                {pricingProperties.map((property) => {
                  const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
                  return (
                    <MuiTextField key={property.name} select size="small" label={property.name} value={previewConfig[`eigenschaft:${property.name}`] ?? enabledValues.find((value) => value.defaultSelected)?.value ?? enabledValues[0]?.value ?? ""} onChange={(event) => setPreviewConfig((current) => ({ ...current, [`eigenschaft:${property.name}`]: event.target.value }))} sx={{ minWidth: 180 }}>
                      {enabledValues.map((value) => <MenuItem key={value.value} value={value.value}>{value.labelOverride || value.label || value.value}</MenuItem>)}
                    </MuiTextField>
                  );
                })}
              </Box>
            </Box>
            <Box sx={{ mt: 0.5, border: "1px solid #e2e8f0", borderRadius: 1.5, bgcolor: "#f8fafc", p: 1.5 }}>
            {previewTier ? (
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>
                {previewTier.quantity} Stück × {formatCurrency(previewTier.unitPrice)} / Stück = {formatCurrency(previewTier.totalPrice)}
              </Typography>
            ) : null}
            <Typography variant="body2" sx={{ color: "#334155", fontWeight: 700 }}>Grundpreis: {formatCurrency(preview.basePrice)}</Typography>
            {preview.lines.map((line) => (
              <Typography key={`${line.label}-${line.value}`} variant="body2" sx={{ color: "#475569" }}>{line.label}: {line.value} +{formatCurrency(line.price)}</Typography>
            ))}
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 900, color: "#0f172a" }}>Gesamt: {formatCurrency(preview.total)}</Typography>
            </Box>
          </CardContent>
        </Card>

        {validationErrors.length ? (
          <Alert severity="warning">{validationErrors[0]}</Alert>
        ) : null}
        {priceHistory.length ? (
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a" }}>Preisverlauf</Typography>
              <Box sx={{ mt: 1, display: "grid", gap: 0.75 }}>
                {priceHistory.slice(-5).reverse().map((entry) => (
                  <Typography key={`${entry.changedAt}-${entry.summary}`} variant="body2" sx={{ color: "#475569" }}>
                    {new Date(entry.changedAt).toLocaleString("de-DE")} - {entry.summary} ({entry.user ?? "Admin"})
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProductHomepagePlacementFields() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#f8fafc" }}>
      <CardContent sx={{ display: "grid", gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Startseite & Shop-Sammlungen</Typography>
        <SelectInput source="purchaseMode" label="Kaufmodus" defaultValue="online" choices={[
          { id: "online", name: "Online bestellbar" },
          { id: "request", name: "Nur Angebot anfragen" },
          { id: "both", name: "Online + Anfrage" },
          { id: "disabled", name: "Kein CTA" }
        ]} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 180px" }, gap: 1.5 }}>
          <BooleanInput source="isBestseller" label="Als Bestseller anzeigen" />
          <NumberInput source="bestsellerSortOrder" label="Reihenfolge" defaultValue={10} />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 180px" }, gap: 1.5 }}>
          <BooleanInput source="isStudentShop" label="Im Studenten Shop anzeigen" />
          <NumberInput source="studentShopSortOrder" label="Reihenfolge Studenten Shop" defaultValue={10} />
        </Box>
      </CardContent>
    </Card>
  );
}

function ProductEdit() {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", color: "#0f172a", bgcolor: "#fff", "& .RaSimpleForm-main": { maxWidth: "none" }, "& .MuiTypography-root": { color: "inherit" }, "& .MuiInputBase-root": { color: "#0f172a", bgcolor: "#fff" }, "& .MuiInputLabel-root": { color: "#334155" } }}>
        <ProductDuplicateButton />
        <ProductImageUploadControls />
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <ProductCategorySelect />
        <TextInput source="short" multiline />
        <TextInput source="description" multiline />
        <TextInput source="seo" multiline />
        <TextInput source="heroImage" />
        <TextInput source="deliveryText" />
        <ProductHomepagePlacementFields />
        <ProductIndustryCheckboxes />
        <ProductPricingManager />
      </SimpleForm>
    </Edit>
  );
}

function ProductCreate() {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", color: "#0f172a", bgcolor: "#fff", "& .RaSimpleForm-main": { maxWidth: "none" }, "& .MuiTypography-root": { color: "inherit" }, "& .MuiInputBase-root": { color: "#0f172a", bgcolor: "#fff" }, "& .MuiInputLabel-root": { color: "#334155" } }} defaultValues={{ visible: false, published: false, productStatus: "draft", purchaseMode: "online", isBestseller: false, bestsellerSortOrder: 10, isStudentShop: false, studentShopSortOrder: 10, pricingType: "tiered", basePrice: 0, priceTiers: [{ quantity: 1, price: 0 }], areaPricing: { defaultWidthCm: 100, defaultHeightCm: 100, minAreaM2: 0 }, pricingProperties: [], rating: 4.8, tags: [], gallery: [], variants: [], industrySlugs: [], enabledCategoryProperties: [], production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" } }}>
        <ProductImageUploadControls />
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <ProductCategorySelect />
        <TextInput source="short" multiline />
        <TextInput source="description" multiline />
        <TextInput source="seo" multiline />
        <TextInput source="heroImage" />
        <TextInput source="deliveryText" />
        <ProductHomepagePlacementFields />
        <ProductIndustryCheckboxes />
        <ProductPricingManager />
      </SimpleForm>
    </Create>
  );
}

function IndustryList() {
  return (
    <List sort={{ field: "sortOrder", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="slug" label="Slug" />
        <TextField source="name" label="Branche" />
        <NumberField source="sortOrder" label="Reihenfolge" />
        <BooleanField source="featured" label="Startseite" />
        <BooleanField source="visible" label="Sichtbar" />
        <BooleanField source="published" label="Veröffentlicht" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" confirmTitle="Branche löschen?" confirmContent="Produktzuordnungen werden entfernt, Produkte bleiben bestehen." />
      </Datagrid>
    </List>
  );
}

function IndustryProductCheckboxes() {
  const { setValue } = useFormContext();
  const selected = (useWatch({ name: "productSlugs" }) as string[] | undefined) ?? [];
  const { data = [], isPending } = useGetList("products", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "name", order: "ASC" }
  });

  if (isPending) return <Typography variant="body2" color="text.secondary">Produkte werden geladen...</Typography>;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#f8fafc" }}>
      <CardContent sx={{ display: "grid", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Zugeordnete Produkte</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 0.75, maxHeight: 360, overflow: "auto" }}>
          {data.map((product) => {
            const slug = String(product.slug ?? product.id);
            const checked = selected.includes(slug);
            return (
              <label key={slug} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? Array.from(new Set([...selected, slug]))
                      : selected.filter((item) => item !== slug);
                    setValue("productSlugs", next, { shouldDirty: true });
                  }}
                />
                <span>{String(product.name ?? slug)}</span>
              </label>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function IndustryImageUploadControls() {
  const notify = useNotify();
  const { setValue } = useFormContext();
  const record = useRecordContext<AdminRecord & ProductIndustry>();
  const slug = useWatch({ name: "slug" }) as string | undefined;
  const heroImage = useWatch({ name: "heroImage" }) as string | undefined;
  const showroomImages = (useWatch({ name: "showroomImages" }) as ProductIndustry["showroomImages"] | undefined) ?? [];
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingShowroom, setUploadingShowroom] = useState(false);
  const currentHero = heroImage ?? record?.heroImage;
  const currentShowroom = showroomImages.length ? showroomImages : (record?.showroomImages ?? []);

  async function uploadFile(file: File, imageRole: string) {
    const industrySlug = String(slug || record?.slug || "").trim();
    if (!industrySlug) throw new Error("Bitte zuerst den Branchen-Slug eintragen.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("industrySlug", industrySlug);
    formData.append("imageRole", imageRole);
    const response = await fetch("/api/uploads/industry-image", { method: "POST", body: formData });
    const payload = await response.json().catch(() => ({})) as { url?: string; message?: string };
    if (!response.ok || !payload.url) throw new Error(payload.message ?? "Upload failed");
    return payload.url;
  }

  async function deleteImage(imageRole: string, url?: string) {
    const industrySlug = String(slug || record?.slug || "").trim();
    if (!industrySlug) throw new Error("Bitte zuerst den Branchen-Slug eintragen.");
    const response = await fetch("/api/uploads/industry-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industrySlug, imageRole, url })
    });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) throw new Error(payload.message ?? "Löschen fehlgeschlagen.");
  }

  async function onHeroImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadFile(file, "hero");
      setValue("heroImage", url, { shouldDirty: true });
      notify("Hero-Bild aktualisiert.", { type: "success" });
    } catch {
      notify("Bild-Upload fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingHero(false);
      event.target.value = "";
    }
  }

  async function onShowroomReplace(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingShowroom(true);
    try {
      const url = await uploadFile(file, `showroom-${index + 1}`);
      const nextShowroom = [...currentShowroom];
      const current = nextShowroom[index] ?? { title: "", description: "" };
      nextShowroom[index] = {
        ...current,
        image: url,
        title: current.title || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
      };
      setValue("showroomImages", nextShowroom, { shouldDirty: true });
      notify(`Showroom-Bild ${index + 1} aktualisiert.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Bild-Upload fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingShowroom(false);
      event.target.value = "";
    }
  }

  async function onShowroomImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploadingShowroom(true);
    try {
      const uploaded = await Promise.all(files.map(async (file, index) => ({
        image: await uploadFile(file, `showroom-${currentShowroom.length + index + 1}`),
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        description: ""
      })));
      setValue("showroomImages", [...currentShowroom, ...uploaded], { shouldDirty: true });
      notify(`${uploaded.length} Showroom-Bild(er) hinzugefügt.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Bild-Upload fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingShowroom(false);
      event.target.value = "";
    }
  }

  async function onHeroImageDelete() {
    setUploadingHero(true);
    try {
      await deleteImage("hero", currentHero);
      setValue("heroImage", "", { shouldDirty: true });
      notify("Hero-Bild gelöscht.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Löschen fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingHero(false);
    }
  }

  async function onShowroomDelete(index: number) {
    setUploadingShowroom(true);
    try {
      const item = currentShowroom[index];
      await deleteImage(`showroom-${index + 1}`, item?.image);
      setValue("showroomImages", currentShowroom.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true });
      notify(`Showroom-Bild ${index + 1} gelöscht.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Löschen fehlgeschlagen.", { type: "error" });
    } finally {
      setUploadingShowroom(false);
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5, mb: 1 }}>
      <Typography variant="subtitle2">Branchenbilder</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Button variant="outlined" component="label" disabled={uploadingHero}>
          {uploadingHero ? "Lädt hoch..." : "Hero-Bild hochladen"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={onHeroImageChange} />
        </Button>
        <Button variant="outlined" component="label" disabled={uploadingShowroom}>
          {uploadingShowroom ? "Fügt hinzu..." : "Showroom-Bilder hochladen"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple hidden onChange={onShowroomImageChange} />
        </Button>
      </Box>
      {currentHero ? (
        <Box sx={{ display: "grid", gap: 0.75, width: 180 }}>
          <AdminImagePreview src={currentHero} alt="Branche" sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", height: 100 }} />
          <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlineIcon />} disabled={uploadingHero} onClick={() => void onHeroImageDelete()}>
            Hero löschen
          </Button>
        </Box>
      ) : null}
      {currentShowroom.length > 0 ? (
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Showroom Bilder ersetzen</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {currentShowroom.map((item, index) => (
              <Box key={`${item.image}-${index}`} sx={{ display: "grid", gap: 0.75, width: 160 }}>
                <AdminImagePreview src={item.image} alt={item.title || `Showroom ${index + 1}`} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", height: 92 }} />
                <Typography variant="caption" sx={{ fontWeight: 800 }} noWrap>
                  {item.title || `Showroom ${index + 1}`}
                </Typography>
                <Button variant="outlined" size="small" component="label" disabled={uploadingShowroom}>
                  {uploadingShowroom ? "Upload..." : `Bild ${index + 1} ersetzen`}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(event) => void onShowroomReplace(index, event)} />
                </Button>
                <Button variant="outlined" color="error" size="small" startIcon={<DeleteOutlineIcon />} disabled={uploadingShowroom} onClick={() => void onShowroomDelete(index)}>
                  Löschen
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function IndustryFields() {
  return (
    <>
      <IndustryImageUploadControls />
      <TextInput source="slug" validate={[required()]} />
      <TextInput source="name" validate={[required()]} />
      <TextInput source="description" multiline validate={[required()]} />
      <TextInput source="heroImage" label="Hero Bild URL" />
      <TextInput source="seoTitle" label="SEO Titel" />
      <TextInput source="metaDescription" label="Meta Description" multiline />
      <NumberInput source="sortOrder" label="Reihenfolge" defaultValue={0} />
      <BooleanInput source="featured" label="Auf Startseite anzeigen" />
      <BooleanInput source="visible" label="Sichtbar" defaultValue />
      <BooleanInput source="published" label="Veröffentlicht" defaultValue />
      <IndustryProductCheckboxes />
      <ArrayInput source="solutionGroups" label="Bedarf / Lösungsgruppen">
        <SimpleFormIterator disableClear>
          <TextInput source="title" label="Titel" />
          <ArrayInput source="items" label="Punkte">
            <SimpleFormIterator inline disableClear>
              <TextInput source="" label="Punkt" helperText={false} />
            </SimpleFormIterator>
          </ArrayInput>
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="showroomImages" label="Showroom Bilder">
        <SimpleFormIterator disableClear>
          <TextInput source="image" label="Bild URL" />
          <TextInput source="title" label="Titel" />
          <TextInput source="description" label="Beschreibung" multiline />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="serviceLinks" label="Service Links">
        <SimpleFormIterator inline disableClear>
          <TextInput source="label" label="Label" />
          <TextInput source="href" label="Route" helperText="Nur bestehende Routen verwenden, z.B. /kontakt" />
        </SimpleFormIterator>
      </ArrayInput>
    </>
  );
}

function IndustryEdit() {
  return <Edit><SimpleForm warnWhenUnsavedChanges><IndustryFields /></SimpleForm></Edit>;
}

function IndustryCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ visible: true, published: true, featured: false, sortOrder: 0, productSlugs: [], solutionGroups: [], showroomImages: [], serviceLinks: [] }}>
        <IndustryFields />
      </SimpleForm>
    </Create>
  );
}

function PropertyList() {
  return (
    <List sort={{ field: "sortOrder", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="slug" label="Slug" />
        <TextField source="name" label="Eigenschaft" />
        <NumberField source="values.length" label="Werte" />
        <NumberField source="usageCount" label="Verwendet in Produkten" />
        <BooleanField source="active" label="Aktiv" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" confirmTitle="Eigenschaft löschen?" confirmContent="Wenn die Eigenschaft bereits verwendet wird, wird sie deaktiviert statt hart gelöscht." />
      </Datagrid>
    </List>
  );
}

function PropertyValuesInput() {
  return (
    <ArrayInput source="values" label="Werte">
      <SimpleFormIterator inline disableClear>
        <TextInput source="value" label="Wert" validate={[required()]} helperText={false} />
        <TextInput source="label" label="Label" helperText={false} />
        <BooleanInput source="active" label="Aktiv" defaultValue />
      </SimpleFormIterator>
    </ArrayInput>
  );
}

function PropertyEdit() {
  return (
    <Edit>
      <SimpleForm>
        <TextInput source="slug" label="Slug" validate={[required()]} />
        <TextInput source="name" label="Name" validate={[required()]} />
        <NumberInput source="sortOrder" label="Reihenfolge" />
        <BooleanInput source="active" label="Aktiv" defaultValue />
        <PropertyValuesInput />
      </SimpleForm>
    </Edit>
  );
}

function PropertyCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ active: true, sortOrder: 0, values: [] }}>
        <TextInput source="slug" label="Slug" helperText="Optional. Wird aus dem Namen erzeugt, wenn leer." />
        <TextInput source="name" label="Name" validate={[required()]} />
        <NumberInput source="sortOrder" label="Reihenfolge" />
        <BooleanInput source="active" label="Aktiv" defaultValue />
        <PropertyValuesInput />
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

function ProductIndustryCheckboxes() {
  const { setValue } = useFormContext();
  const selected = (useWatch({ name: "industrySlugs" }) as string[] | undefined) ?? [];
  const { data = [], isPending } = useGetList("industries", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "sortOrder", order: "ASC" }
  });

  if (isPending) return <Typography variant="body2" color="text.secondary">Branchen werden geladen...</Typography>;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#f8fafc" }}>
      <CardContent sx={{ display: "grid", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Branchen</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 0.75 }}>
          {data.map((industry) => {
            const slug = String(industry.slug ?? industry.id);
            const checked = selected.includes(slug);
            return (
              <label key={slug} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? Array.from(new Set([...selected, slug]))
                      : selected.filter((item) => item !== slug);
                    setValue("industrySlugs", next, { shouldDirty: true });
                  }}
                />
                <span>{String(industry.name ?? slug)}</span>
              </label>
            );
          })}
        </Box>
      </CardContent>
    </Card>
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
      <SimpleFormIterator disableReordering disableClear>
        <TextInput source="name" label="Eigenschaft" placeholder="z.B. Papier" helperText={false} />
        <NumberInput source="stepPrice" label="Stückpreis Eigenschaft (€)" min={0} step={0.01} helperText="Optionaler Preis pro Stück für diese Eigenschaft." />
        <ArrayInput source="values" label="Werte">
          <SimpleFormIterator inline disableReordering disableClear>
            <TextInput source="value" label="Wert" placeholder="z.B. 170g Bilderdruck" helperText={false} />
            <NumberInput source="basePrice" label="Preis (€)" min={0} step={0.01} helperText={false} />
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
        <ArrayInput source="showroomImages" label="Showroom Bilder">
          <SimpleFormIterator disableClear>
            <TextInput source="image" label="Bild URL" />
            <TextInput source="title" label="Titel" />
            <TextInput source="description" label="Beschreibung" multiline />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  );
}

function CategoryCreate() {
  return (
    <Create>
      <SimpleForm defaultValues={{ visible: true, published: true, defaultPropertyTemplate: "print-basic", quantitySteps: [1, 10, 100, 1000], showroomImages: [] }}>
        <TextInput source="slug" validate={[required()]} />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="description" multiline />
        <BooleanInput source="visible" label="Sichtbar im Shop" />
        <BooleanInput source="published" label="Veröffentlicht" />
        <CategoryImageUploadControls />
        <TextInput source="logo" label="Bild URL" />
        <ArrayInput source="showroomImages" label="Showroom Bilder">
          <SimpleFormIterator disableClear>
            <TextInput source="image" label="Bild URL" />
            <TextInput source="title" label="Titel" />
            <TextInput source="description" label="Beschreibung" multiline />
          </SimpleFormIterator>
        </ArrayInput>
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
    if (record?.slug) {
      formData.append("targetType", "category");
      formData.append("targetSlug", record.slug);
      formData.append("imageRole", "logo");
    }
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
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={onLogoChange} />
        </Button>
        {currentLogo ? (
          <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={removeLogo}>
            Remove Image
          </Button>
        ) : null}
      </Box>
      {currentLogo ? <AdminImagePreview src={currentLogo} alt="Category" sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", width: 180, height: 100 }} /> : null}
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

function HomepageContentToolPage() {
  const notify = useNotify();
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/homepage");
        if (!res.ok) throw new Error("Homepage-Einstellungen konnten nicht geladen werden.");
        setSettings(await res.json() as HomepageSettings);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Laden fehlgeschlagen.", { type: "error" });
      }
    })();
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(typeof payload?.message === "string" ? payload.message : "Speichern fehlgeschlagen.");
      }
      setSettings(await res.json() as HomepageSettings);
      notify("Homepage-Einstellungen gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Speichern fehlgeschlagen.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const update = <K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  return (
    <AdminToolShell title="Inhalte - Homepage" description="Bestseller, Studenten Shop und Google Bewertungen auf der Startseite steuern.">
      {!settings ? (
        <Typography variant="body2" color="text.secondary">Einstellungen werden geladen...</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: "grid", gap: 1.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Bestseller</Typography>
              <Button variant={settings.bestsellerEnabled ? "contained" : "outlined"} onClick={() => update("bestsellerEnabled", !settings.bestsellerEnabled)}>
                {settings.bestsellerEnabled ? "Bestseller ist AN" : "Bestseller ist AUS"}
              </Button>
              <MuiTextField size="small" label="Untertitel" value={settings.bestsellerSubtitle} onChange={(event) => update("bestsellerSubtitle", event.target.value)} />
              <MuiTextField size="small" label="Titel" value={settings.bestsellerTitle} onChange={(event) => update("bestsellerTitle", event.target.value)} />
              <MuiTextField size="small" type="number" label="Reihenfolge" value={settings.bestsellerSortOrder} onChange={(event) => update("bestsellerSortOrder", Number(event.target.value))} />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ display: "grid", gap: 1.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Studenten Shop</Typography>
              <Button variant={settings.studentShopEnabled ? "contained" : "outlined"} onClick={() => update("studentShopEnabled", !settings.studentShopEnabled)}>
                {settings.studentShopEnabled ? "Studenten Shop ist AN" : "Studenten Shop ist AUS"}
              </Button>
              <MuiTextField size="small" label="Titel" value={settings.studentShopTitle} onChange={(event) => update("studentShopTitle", event.target.value)} />
              <MuiTextField size="small" label="Beschreibung" multiline minRows={3} value={settings.studentShopDescription} onChange={(event) => update("studentShopDescription", event.target.value)} />
              <MuiTextField size="small" label="Bildpfad" value={settings.studentShopImage} onChange={(event) => update("studentShopImage", event.target.value)} />
              <MuiTextField size="small" label="Link" value={settings.studentShopLink} onChange={(event) => update("studentShopLink", event.target.value)} />
              <MuiTextField size="small" type="number" label="Reihenfolge" value={settings.studentShopSortOrder} onChange={(event) => update("studentShopSortOrder", Number(event.target.value))} />
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ display: "grid", gap: 1.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Google Bewertungen</Typography>
              <Button variant={settings.googleReviewsEnabled ? "contained" : "outlined"} onClick={() => update("googleReviewsEnabled", !settings.googleReviewsEnabled)}>
                {settings.googleReviewsEnabled ? "Google Bewertungen sind AN" : "Google Bewertungen sind AUS"}
              </Button>
              <MuiTextField size="small" label="Untertitel" value={settings.googleReviewsSubtitle} onChange={(event) => update("googleReviewsSubtitle", event.target.value)} />
              <MuiTextField size="small" label="Titel" value={settings.googleReviewsTitle} onChange={(event) => update("googleReviewsTitle", event.target.value)} />
              <MuiTextField size="small" type="number" label="Reihenfolge" value={settings.googleReviewsSortOrder} onChange={(event) => update("googleReviewsSortOrder", Number(event.target.value))} />
            </CardContent>
          </Card>

          <Box>
            <Button variant="contained" onClick={() => void save()} disabled={saving}>
              {saving ? "Speichert..." : "Homepage speichern"}
            </Button>
          </Box>
        </Box>
      )}
    </AdminToolShell>
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
                        <AdminImagePreview src={file.url} alt={file.name} sx={{ width: 40, height: 40, borderRadius: 1, border: "1px solid #e2e8f0" }} />
                      ) : (
                        <Box sx={{ width: 40, height: 40, borderRadius: 1, border: `1px solid ${adminColors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: adminColors.muted }}>
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
        const res = await fetch("/api/admin/tools?action=image-targets");
        if (!res.ok) throw new Error("Bild-Ziele konnten nicht geladen werden.");
        const payload = await res.json() as { products: Array<{ slug: string; name: string }>; categories: Array<{ slug: string; name: string }> };
        setProducts(payload.products);
        setCategories(payload.categories);
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
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" multiple hidden onChange={uploadImage} />
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
                  <AdminImagePreview src={uploadedUrl} alt="Hochgeladenes Bild" sx={{ width: 120, height: 80, borderRadius: "6px", border: "1px solid #e2e8f0" }} />
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

const csvExamples = {
  properties: `slug,name,active,sortOrder,values
papier,Papier,true,10,80g|100g|120g|160g|200g|250g|300g|350g
format,Format,true,20,A7|A6|A5|A4|A3|SRA3
druckseiten,Druckseiten,true,30,Einseitig|Beidseitig`,
  categories: `slug,name,description,visible,published,logo
druck,Druck,Druckprodukte online konfigurieren,true,true,/uploads/categories/druck.webp
werbetechnik,Werbetechnik,Beschriftung Schilder Folien und Montage,true,true,/uploads/categories/werbetechnik.webp`,
  products: `slug,name,category,basePrice,pricingType,productStatus,short,description,seo,heroImage,deliveryText,priceTiers,defaultWidthCm,defaultHeightCm,minAreaM2,tags
a4-farbkopien,A4 Farbkopien,druck,0.45,tiered,draft,Farbkopien in A4,A4 Farbkopien mit Staffelpreisen,Farbkopien Wels,/uploads/products/a4-farbkopien.webp,2-5 Werktage,1-99:0.45|100-199:0.39|200-299:0.35,,,,kopien|druck
banner-m2,Banner nach Maß,werbetechnik,29.90,area,draft,Banner pro m²,Banner mit Wunschmaß,Banner Wels,/uploads/products/banner.webp,3-5 Werktage,1-999:29.90,100,100,0.25,banner|werbetechnik`
};

type CatalogCsvTarget = "properties" | "categories" | "products";

function detectCatalogCsvTarget(rows: Record<string, string>[], fallback: CatalogCsvTarget): CatalogCsvTarget {
  const keys = new Set(rows.flatMap((row) => Object.keys(row).map(normalizeCsvKey)));
  if (["category", "kategorie", "baseprice", "preis", "pricingtype", "preisart", "productstatus", "heroimage", "short", "kurztext"].some((key) => keys.has(key))) {
    return "products";
  }
  if (["logo", "description", "beschreibung", "defaultpropertytemplate", "quantitysteps", "showroomimages"].some((key) => keys.has(key))) {
    return "categories";
  }
  if (["values", "werte", "eigenschaft"].some((key) => keys.has(key))) {
    return "properties";
  }
  return fallback;
}

function CatalogCsvImportToolPage() {
  const notify = useNotify();
  const [target, setTarget] = useState<CatalogCsvTarget>("properties");
  const [csvText, setCsvText] = useState(csvExamples.properties);
  const [result, setResult] = useState("");
  const [importing, setImporting] = useState(false);

  function changeTarget(nextTarget: CatalogCsvTarget) {
    setTarget(nextTarget);
    setCsvText(csvExamples[nextTarget]);
    setResult("");
  }

  function readCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function mapRow(row: Record<string, string>, importTarget: CatalogCsvTarget) {
    if (importTarget === "properties") {
      const name = csvCell(row, "name", "Name", "Eigenschaft", "label", "Label") || csvCell(row, "slug");
      const slug = row.slug || csvSlug(name);
      return {
        slug,
        name,
        active: csvBool(csvCell(row, "active", "aktiv"), true),
        sortOrder: csvNumber(csvCell(row, "sortOrder", "reihenfolge"), 0),
        values: csvList(csvCell(row, "values", "werte")).map((value, index) => ({
          id: csvSlug(`${slug}-${value}`),
          value,
          sortOrder: index,
          active: true
        }))
      };
    }
    if (importTarget === "categories") {
      const name = csvCell(row, "name", "Name", "Kategorie", "category", "label", "Label") || csvCell(row, "slug");
      return {
        slug: csvCell(row, "slug") || csvSlug(name),
        name,
        description: csvCell(row, "description", "beschreibung"),
        visible: csvBool(csvCell(row, "visible", "sichtbar"), true),
        published: csvBool(csvCell(row, "published", "veroeffentlicht", "veröffentlicht"), true),
        logo: csvCell(row, "logo", "image", "bild", "imagePath", "image_path")
      };
    }
    const name = csvCell(row, "name", "Name", "Produkt", "product", "label", "Label") || csvCell(row, "slug");
    const basePrice = csvNumber(csvCell(row, "basePrice", "preis"), 0);
    const defaultWidthCm = csvCell(row, "defaultWidthCm", "breiteCm");
    const defaultHeightCm = csvCell(row, "defaultHeightCm", "hoeheCm", "höheCm");
    const pricingType = (csvCell(row, "pricingType", "preisart") || (defaultWidthCm || defaultHeightCm ? "area" : "")).toLowerCase();
    const priceTiers = csvPriceTiers(csvCell(row, "priceTiers", "staffelpreise"), basePrice);
    return {
      slug: csvCell(row, "slug") || csvSlug(name),
      name,
      category: csvCell(row, "category", "kategorie"),
      basePrice,
      productStatus: csvCell(row, "productStatus", "status") || "draft",
      visible: (csvCell(row, "productStatus", "status") || "draft") === "active",
      published: (csvCell(row, "productStatus", "status") || "draft") === "active",
      short: csvCell(row, "short", "kurztext"),
      description: csvCell(row, "description", "beschreibung"),
      seo: csvCell(row, "seo"),
      heroImage: csvCell(row, "heroImage", "hero_image", "image", "bild", "imagePath", "image_path"),
      gallery: csvList(csvCell(row, "gallery", "galerie")),
      rating: csvNumber(csvCell(row, "rating", "bewertung"), 4.8),
      pricingType: pricingType === "area" ? "area" : priceTiers.length > 1 ? "tiered" : "fixed",
      areaPricing: pricingType === "area" ? {
        defaultWidthCm: csvNumber(defaultWidthCm, 100),
        defaultHeightCm: csvNumber(defaultHeightCm, 100),
        minAreaM2: csvNumber(csvCell(row, "minAreaM2", "mindestflaeche", "mindestfläche"), 0)
      } : undefined,
      priceTiers,
      deliveryText: csvCell(row, "deliveryText", "lieferzeit") || "2-5 Werktage",
      tags: csvList(csvCell(row, "tags")),
      variants: [],
      pricingProperties: [],
      quantitySteps: priceTiers.map((tier) => tier.fromQuantity ?? tier.quantity),
      production: {
        baseProductionDays: csvNumber(csvCell(row, "baseProductionDays", "produktionstage"), 3),
        expressAvailable: false,
        preflightProfile: "standard-print",
        renderPipeline: "pdf-x4"
      }
    };
  }

  async function importCsv() {
    setImporting(true);
    setResult("");
    try {
      const rows = parseCsvRows(csvText);
      if (!rows.length) throw new Error("CSV enthält keine Datenzeilen.");
      const importTarget = detectCatalogCsvTarget(rows, target);
      let imported = 0;
      const skipped: string[] = [];
      for (const [index, row] of rows.entries()) {
        const payload = mapRow(row, importTarget) as { slug?: string; name?: string };
        if (!payload.name?.trim()) {
          skipped.push(`Zeile ${index + 2}: Name fehlt`);
          continue;
        }
        if (!payload.slug?.trim()) {
          skipped.push(`Zeile ${index + 2}: Slug fehlt`);
          continue;
        }
        const response = await fetch(`/api/catalog/${importTarget}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({} as { message?: string }));
          throw new Error(error.message || `Import fehlgeschlagen bei Zeile ${imported + 2}.`);
        }
        imported += 1;
      }
      const summary = `${imported} Datensätze importiert${importTarget !== target ? ` (${importTarget} automatisch erkannt)` : ""}.${skipped.length ? ` Übersprungen: ${skipped.join("; ")}` : ""}`;
      setResult(summary);
      notify(summary, { type: skipped.length ? "warning" : "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV Import fehlgeschlagen.";
      setResult(message);
      notify(message, { type: "error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <AdminToolShell title="CSV Katalog Import" description="Eigenschaften, Produkte und Kategorien per CSV anlegen oder aktualisieren. Bestehende Slugs werden überschrieben.">
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant={target === "properties" ? "contained" : "outlined"} onClick={() => changeTarget("properties")}>Eigenschaften</Button>
          <Button variant={target === "products" ? "contained" : "outlined"} onClick={() => changeTarget("products")}>Produkte</Button>
          <Button variant={target === "categories" ? "contained" : "outlined"} onClick={() => changeTarget("categories")}>Kategorien</Button>
        </Box>
        <Button variant="outlined" component="label" sx={{ width: "fit-content" }}>
          CSV Datei auswählen
          <input hidden type="file" accept=".csv,text/csv" onChange={readCsvFile} />
        </Button>
        <MuiTextField
          multiline
          minRows={12}
          label="CSV Inhalt"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          helperText="Trennzeichen: Komma oder Semikolon. Mehrere Werte mit | trennen. Staffeln in priceTiers als Von-Bis:Einzelpreis, z.B. 1-99:0.45."
        />
        <Alert severity="info">
          Beispiel für {target === "properties" ? "Eigenschaften" : target === "products" ? "Produkte" : "Kategorien"} ist im Feld bereits eingefügt und kann direkt ersetzt werden.
        </Alert>
        <Box>
          <Button variant="contained" onClick={() => void importCsv()} disabled={importing}>
            {importing ? "Import läuft..." : "CSV importieren"}
          </Button>
        </Box>
        {result ? <Typography variant="body2" sx={{ fontWeight: 700 }}>{result}</Typography> : null}
      </Box>
    </AdminToolShell>
  );
}

function SiteImagesToolPage() {
  const notify = useNotify();
  const [slots, setSlots] = useState<Array<{ key: string; label: string; defaultUrl: string; group?: string; pageHref?: string; usage?: string }>>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [savedImages, setSavedImages] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState("Alle");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/tools?action=site-images");
      const payload = await res.json() as { slots: Array<{ key: string; label: string; defaultUrl: string; group?: string; pageHref?: string; usage?: string }>; images: Record<string, string> };
      if (!res.ok) throw new Error("Bilder konnten nicht geladen werden.");
      setSlots(payload.slots);
      setImages(payload.images);
      setSavedImages(payload.images);
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
      setImages(payload.images);
      setSavedImages(payload.images);
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
      formData.append("slotKey", slotKey);
      const res = await fetch("/api/uploads/site-image", { method: "POST", body: formData });
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

  function resetSlot(slotKey: string, defaultUrl: string) {
    setImages((current) => ({ ...current, [slotKey]: defaultUrl }));
  }

  async function copyUrl(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify("Bild-URL kopiert.", { type: "success" });
    } catch {
      notify("Kopieren nicht möglich.", { type: "warning" });
    }
  }

  const groups = useMemo(() => ["Alle", ...Array.from(new Set(slots.map((slot) => slot.group || "Allgemein")))], [slots]);
  const visibleSlots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return slots.filter((slot) => {
      const group = slot.group || "Allgemein";
      const matchesGroup = activeGroup === "Alle" || group === activeGroup;
      const searchable = `${slot.label} ${slot.key} ${slot.usage ?? ""} ${group}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, query, slots]);
  const customizedCount = slots.filter((slot) => (images[slot.key] || slot.defaultUrl) !== slot.defaultUrl).length;
  const dirtyCount = slots.filter((slot) => (images[slot.key] || "") !== (savedImages[slot.key] || "")).length;

  return (
    <AdminToolShell
      title="Website Bilder"
      description="Zentrale Bilder für Logo, Startseite und Service-Seiten prüfen, ersetzen und speichern."
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Alert severity="info">
          Produktbilder und Kategoriebilder bleiben direkt bei Produkte/Kategorien editierbar. Diese Liste steuert Logo, Startseite und Service-Seiten.
        </Alert>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          {[
            { label: "Slots", value: slots.length },
            { label: "Angepasst", value: customizedCount },
            { label: "Ungespeichert", value: dirtyCount },
            { label: "Gruppen", value: groups.length - 1 }
          ].map((item) => (
            <Card key={item.label} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 900, textTransform: "uppercase" }}>{item.label}</Typography>
                <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 950, color: adminColors.ink }}>{item.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card variant="outlined" sx={{ position: "sticky", top: 16, zIndex: 3, borderRadius: 2, bgcolor: "#ffffffee", backdropFilter: "blur(12px)" }}>
          <CardContent sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, alignItems: "center", p: 2 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <MuiTextField
                size="small"
                label="Suchen"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                sx={{ minWidth: { xs: "100%", sm: 260 } }}
              />
              {groups.map((group) => (
                <Button key={group} size="small" variant={activeGroup === group ? "contained" : "outlined"} onClick={() => setActiveGroup(group)}>
                  {group}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-start", lg: "flex-end" }, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={() => void load()} disabled={saving || uploadingKey !== null}>Neu laden</Button>
              <Button variant="contained" onClick={() => void save()} disabled={saving || dirtyCount === 0}>
                {saving ? "Speichert..." : `Alle speichern${dirtyCount ? ` (${dirtyCount})` : ""}`}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" } }}>
          {visibleSlots.map((slot) => {
            const value = images[slot.key] || slot.defaultUrl;
            const isDefault = value === slot.defaultUrl;
            const isDirty = value !== (savedImages[slot.key] || "");
            return (
              <Card key={slot.key} variant="outlined" sx={{ overflow: "hidden", borderRadius: 2, borderColor: isDirty ? adminColors.blue : adminColors.border }}>
                <CardContent sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, p: 0 }}>
                  <AdminImagePreview src={value} alt={slot.label} sx={{ minHeight: 150, borderRight: { md: "1px solid #e2e8f0" } }}>
                    <Box sx={{ position: "absolute", left: 10, top: 10, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      <Box sx={{ borderRadius: 999, bgcolor: isDefault ? "#f1f5f9" : "#dbeafe", color: isDefault ? "#475569" : adminColors.blue, px: 1, py: 0.25, fontSize: 11, fontWeight: 900 }}>
                        {isDefault ? "Default" : "Custom"}
                      </Box>
                      {isDirty ? (
                        <Box sx={{ borderRadius: 999, bgcolor: "#fff7ed", color: "#c2410c", px: 1, py: 0.25, fontSize: 11, fontWeight: 900 }}>
                          Ungespeichert
                        </Box>
                      ) : null}
                    </Box>
                  </AdminImagePreview>
                  <Box sx={{ display: "grid", gap: 1, p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: adminColors.blue, fontWeight: 900, textTransform: "uppercase" }}>{slot.group || "Allgemein"}</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>{slot.label}</Typography>
                        {slot.usage ? <Typography variant="body2" sx={{ color: adminColors.muted }}>{slot.usage}</Typography> : null}
                      </Box>
                      {slot.pageHref ? (
                        <Button size="small" variant="outlined" component="a" href={slot.pageHref} target="_blank" rel="noreferrer">
                          Seite öffnen
                        </Button>
                      ) : null}
                    </Box>
                    <MuiTextField
                      size="small"
                      label={slot.key}
                      value={value}
                      onChange={(event) => setImages((current) => ({ ...current, [slot.key]: event.target.value }))}
                      helperText={value}
                    />
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button variant="contained" component="label" disabled={uploadingKey === slot.key || saving}>
                        {uploadingKey === slot.key ? "Upload..." : "Upload"}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(event) => void uploadForSlot(slot.key, event)} />
                      </Button>
                      <Button variant="outlined" disabled={saving || !isDirty} onClick={() => void save()}>
                        Änderungen speichern
                      </Button>
                      <Button variant="outlined" onClick={() => resetSlot(slot.key, slot.defaultUrl)} disabled={isDefault}>
                        Default
                      </Button>
                      <Button variant="outlined" onClick={() => void copyUrl(value)}>
                        URL kopieren
                      </Button>
                      <Button variant="outlined" component="a" href={value} target="_blank" rel="noreferrer">
                        Bild öffnen
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
          {!visibleSlots.length ? (
            <Alert severity="warning">Keine Bild-Slots für diese Suche gefunden.</Alert>
          ) : null}
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
    NEXT_PUBLIC_CLARITY_PROJECT_ID: "",
    NEXT_PUBLIC_META_PIXEL_ID: "",
    GOOGLE_SITE_VERIFICATION: ""
  });

  useEffect(() => {
    void (async () => {
      try {
        const [configRes, statsRes] = await Promise.all([
          fetch("/api/admin/tools?action=marketing-config"),
          fetch(`/api/admin/stats?period=${period}`)
        ]);
        if (configRes.ok) {
          const payload = await configRes.json() as { marketing: Record<string, string> };
          setForm((current) => ({ ...current, ...payload.marketing }));
        }
        if (statsRes.ok) {
          const payload = await statsRes.json() as DashboardStats;
          setStats(payload);
        }
      } catch {
        notify("Werbung-Konfiguration konnte nicht geladen werden.", { type: "error" });
      }
    })();
  }, [period]);

  const statusItems = [
    { label: "Google Analytics 4", key: "NEXT_PUBLIC_GA_MEASUREMENT_ID" },
    { label: "Microsoft Clarity", key: "NEXT_PUBLIC_CLARITY_PROJECT_ID" },
    { label: "Google Search Console", key: "GOOGLE_SITE_VERIFICATION" },
    { label: "Meta Pixel", key: "NEXT_PUBLIC_META_PIXEL_ID" }
  ];


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
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Umsatz" value={formatCurrency(stats?.grossRevenue ?? 0)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Bestellungen" value={String(stats?.revenueOrderCount ?? 0)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Ø Warenkorb" value={formatCurrency(stats?.averageOrder ?? 0)} /></Grid>
            </Grid>
            <Box sx={{ mt: 1.5, height: 170, display: "flex", alignItems: "flex-end", gap: 0.7 }}>
                    {(stats?.chartBuckets ?? []).map((bucket) => (
                <Box key={bucket.label} sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: "100%",
                      height: `${bucket.height}%`,
                      borderRadius: 1,
                      bgcolor: adminColors.teal,
                      transition: "height 450ms ease"
                    }}
                    title={`${bucket.label}: ${formatCurrency(bucket.value)}`}
                  />
                  <Typography variant="caption" sx={{ display: "block", mt: 0.4, textAlign: "center", color: adminColors.muted }}>
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
              <Box component="pre" sx={{ m: 0, p: 1.5, borderRadius: 1, border: "1px solid #cbd5e1", bgcolor: "#f8fafc", color: "#0f172a", overflowX: "auto", fontSize: 12, lineHeight: 1.6 }}>
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
    <div className="mx-auto w-full max-w-[1600px] bg-[#f3f6fb] text-[#0a1020]">
    <Admin dataProvider={dataProvider} dashboard={AdminDashboardHome} title="DUD Studio Admin" theme={adminTheme}>
      <CustomRoutes>
        <Route path="/tools/maintenance" element={<MaintenanceToolPage />} />
        <Route path="/tools/online-shop" element={<OnlineShopToolPage />} />
        <Route path="/tools/checkout-lock" element={<CheckoutLockToolPage />} />
        <Route path="/tools/vacation" element={<VacationToolPage />} />
        <Route path="/tools/email" element={<EmailConfigToolPage />} />
        <Route path="/tools/uploads" element={<UploadFoldersToolPage />} />
        <Route path="/tools/image-import" element={<CatalogImageImportToolPage />} />
        <Route path="/tools/catalog-csv" element={<CatalogCsvImportToolPage />} />
        <Route path="/tools/homepage" element={<HomepageContentToolPage />} />
        <Route path="/tools/site-images" element={<SiteImagesToolPage />} />
        <Route path="/tools/backup" element={<BackupToolPage />} />
        <Route path="/tools/werbung" element={<WerbungToolPage />} />
        <Route path="/tools/crm" element={<CRMToolPage />} />
        <Route path="/tools/shutdown" element={<ShutdownToolPage />} />
        <Route path="/tools/layouts" element={<LayoutStudioPage />} />
      </CustomRoutes>
      <Resource name="products" list={ProductList} edit={ProductEdit} create={ProductCreate} icon={Inventory2Icon} />
      <Resource name="properties" options={{ label: "Eigenschaften" }} list={PropertyList} edit={PropertyEdit} create={PropertyCreate} icon={LocalOfferIcon} />
      <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} icon={LocalOfferIcon} />
      <Resource name="industries" options={{ label: "Branchen" }} list={IndustryList} edit={IndustryEdit} create={IndustryCreate} icon={LocalOfferIcon} />
      <Resource name="studentArticles" options={{ label: "Studenten Ratgeber" }} list={StudentArticleList} edit={StudentArticleEdit} create={StudentArticleCreate} icon={LocalOfferIcon} />
      <Resource name="studentVerifications" options={{ label: "Studentenprüfung" }} list={StudentVerificationList} edit={StudentVerificationEdit} icon={LocalOfferIcon} />
      <Resource name="orders" options={{ label: "Bestellungen" }} list={OrdersList} edit={OrderEdit} />
      <Resource name="quotes" options={{ label: "Angebote" }} list={QuotesList} edit={QuoteEdit} create={QuoteCreate} />
      <Resource name="invoices" options={{ label: "Rechnungen" }} list={InvoicesList} edit={InvoiceEdit} create={InvoiceCreate} />
      <Resource name="fileUploads" options={{ label: "Datei-Uploads" }} list={FileUploadsList} edit={FileUploadEdit} />
      <Resource name="coupons" options={{ label: "Gutscheine" }} list={CouponsList} edit={CouponEdit} create={CouponCreate} />
      <Resource name="reviews" options={{ label: "Bewertungen" }} list={ReviewsList} edit={ReviewEdit} />
      <Resource name="newsletter" options={{ label: "Newsletter Kontakte" }} list={NewsletterList} edit={NewsletterEdit} create={NewsletterCreate} />
      <Resource name="newsletterCampaigns" options={{ label: "Newsletter" }} list={NewsletterCampaignList} edit={NewsletterCampaignEdit} create={NewsletterCampaignCreate} />
      <Resource name="shipping" options={{ label: "Versandarten" }} list={ShippingList} edit={ShippingEdit} create={ShippingCreate} />
    </Admin>
    </div>
  );
}
