"use client";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import ArticleIcon from "@mui/icons-material/Article";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import MailIcon from "@mui/icons-material/Mail";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TuneIcon from "@mui/icons-material/Tune";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Divider, Grid, IconButton, List as MuiList, ListItemButton, ListItemIcon, MenuItem, Skeleton, TextField as MuiTextField, Typography } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Admin,
  AppBar as RaAppBar,
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
  Layout,
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
  useListContext,
  useNotify,
  useRefresh,
  useResourceContext,
  useRecordContext
} from "react-admin";
import { Route } from "react-router-dom";
import { useFormContext, useWatch } from "react-hook-form";
import { calculateConfiguredProductPrice, calculateTierPrice, validateProductPricing } from "@/lib/print-workflow";
import { calculateProductPricingResult } from "@/lib/universal-pricing";
import { productPropertyFromGlobal, resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import { configuratorProfileLabels, experienceProfileLabels, pdfPreviewModeLabels, resolveConfiguratorProfile } from "@/lib/product-configurator-profile";
import { applyPropertyDisplayCsvRows, hasFullProductCsvColumns, mergeProductConfigFromCsv, productConfigFromCsvRow, productSlugFromConfigCsvRow } from "@/lib/catalog-csv-config";
import { deriveProductDocumentProduction, pricingQuantitiesForProductDocument } from "@/lib/document-production";
import type { BindingSystem } from "@/lib/binding-resolution";
import type { GlobalProperty, HomepageSettings, PricingProfileKey, ProductCatalogItem, ProductIndustry, ProductPriceTier, ProductPricingComponent, ProductPricingProperty, ProductPropertyValue } from "@/types/print-platform";

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
  sidebar: {
    width: 292,
    closedWidth: 64
  },
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

const pricingQuantitySourceLabels = {
  copies: "Pro Stück",
  printed_pages: "Pro Druckseite",
  sheets: "Pro Blatt",
  black_white_pages: "Pro S/W-Seite",
  color_pages: "Pro Farbseite",
  front_covers: "Pro vorderem Umschlag",
  back_covers: "Pro hinterem Umschlag",
  printed_cover_sides: "Pro bedruckter Umschlagseite",
  embossing_lines: "Pro Prägezeile",
  per_order: "Einmal pro Auftrag",
  area_m2: "Pro m²",
  perimeter_m: "Pro Laufmeter Umfang",
  running_meter: "Pro Laufmeter",
  machine_sheets: "Pro Maschinenbogen",
  finished_units: "Pro fertiger Einheit",
  cuts: "Pro Schnitt",
  folds: "Pro Falz",
  holes: "Pro Loch",
  finishing_passes: "Pro Veredelungsdurchlauf",
  machine_minutes: "Pro Maschinenminute",
  labor_minutes: "Pro Arbeitsminute",
  design_hours: "Pro Designstunde"
} as const;

const pricingProfileLabels: Record<PricingProfileKey, string> = {
  "digital-document": "Digitales Dokument",
  "digital-sheet": "Digitalbogen",
  "sheet-print": "Bogendruck",
  "business-card": "Visitenkarte",
  brochure: "Broschüre",
  booklet: "Booklet",
  thesis: "Abschlussarbeit",
  "document-binding": "Dokumentbindung",
  "large-format": "Großformat",
  "plan-print": "Plan / CAD",
  "area-print": "Flächendruck",
  "area-finishing": "Flächenveredelung",
  sticker: "Sticker",
  "textile-print": "Textildruck",
  signage: "Beschilderung",
  "design-service": "Designleistung",
  "custom-formula": "Individuelle Formel"
};

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
const searchFilters = [<TextInput key="q" source="q" label="Suche" alwaysOn />];

function AdminStatusBadge({ label, tone = "neutral", onClick }: { label: string; tone?: "blue" | "green" | "amber" | "red" | "gray" | "neutral"; onClick?: () => void }) {
  const colors = {
    blue: { bg: "#eff6ff", fg: "#1155cc", border: "#bfdbfe" },
    green: { bg: "#ecfdf3", fg: "#027a48", border: "#bbf7d0" },
    amber: { bg: "#fffbeb", fg: "#b54708", border: "#fde68a" },
    red: { bg: "#fef2f2", fg: "#b42318", border: "#fecaca" },
    gray: { bg: "#f8fafc", fg: "#64748b", border: "#e2e8f0" },
    neutral: { bg: "#f8fafc", fg: adminColors.ink, border: adminColors.border }
  }[tone];

  return (
    <Chip
      size="small"
      label={label}
      onClick={onClick}
      sx={{
        height: 24,
        borderRadius: 999,
        bgcolor: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        fontWeight: 900,
        fontSize: 11,
        cursor: onClick ? "pointer" : "default",
        "& .MuiChip-label": { px: 1 }
      }}
    />
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ border: `1px dashed ${adminColors.border}`, borderRadius: 2, bgcolor: "#f8fafc", p: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 900, color: adminColors.ink }}>{title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.35, color: adminColors.muted }}>{text}</Typography>
    </Box>
  );
}

function CatalogBulkActionsToolbar({ label, confirmContent }: { label: string; confirmContent: string }) {
  const resource = useResourceContext();
  const { selectedIds = [], onUnselectItems } = useListContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [deleting, setDeleting] = useState(false);

  async function deleteSelected() {
    if (!resource || !selectedIds.length) return;
    if (!window.confirm(`${selectedIds.length} ${label} wirklich löschen?\n\n${confirmContent}`)) return;
    setDeleting(true);
    try {
      await dataProvider.deleteMany(resource, { ids: selectedIds.map(String) });
      notify(`${selectedIds.length} ${label} gelöscht.`, { type: "success" });
      onUnselectItems();
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : `${label} konnten nicht gelöscht werden.`, { type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (!selectedIds.length) return null;

  return (
    <Box
      sx={{
        mb: 1,
        p: 1.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        flexWrap: "wrap",
        border: `1px solid ${adminColors.border}`,
        borderRadius: 2,
        bgcolor: "#fff7ed"
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 900, color: adminColors.ink }}>
        {selectedIds.length} ausgewählt
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" disabled={deleting} onClick={() => onUnselectItems()}>
          Auswahl aufheben
        </Button>
        <Button
          size="small"
          color="error"
          variant="contained"
          startIcon={<DeleteOutlineIcon />}
          disabled={deleting}
          onClick={() => void deleteSelected()}
        >
          {deleting ? "Löscht..." : `${label} löschen`}
        </Button>
      </Box>
    </Box>
  );
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({} as { message?: string }));
    const message = typeof errorBody?.message === "string" && errorBody.message
      ? errorBody.message
      : `Anfrage fehlgeschlagen: ${response.status}`;
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
        ? mapped.filter((item) => `${item.name ?? ""} ${item.slug ?? ""} ${item.id ?? ""} ${item.category ?? ""} ${item.productStatus ?? ""}`.toLowerCase().includes(q))
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
    const modulePayload = resource === "usersRoles"
      ? (() => {
        const { role: _role, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = rest;
        return data;
      })()
      : rest;
    const payload = resource === "categories"
      ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
      : resource === "products"
        ? { ...rest, slug: params.id }
        : resource === "industries"
          ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
        : resource === "properties"
          ? { ...rest, slug: typeof rest.slug === "string" && rest.slug ? rest.slug : params.id, originalSlug: params.id }
          : { id: params.id, data: modulePayload };
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
  return Number(value || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

type ProductHealthCheck = { key: string; label: string; state: "ok" | "warning" | "missing"; detail?: string };
type ProductHealth = { status: "healthy" | "warning" | "incomplete"; label: string; tone: "green" | "amber" | "red"; items: ProductHealthCheck[] };

function calculateProductHealth(product: Partial<ProductCatalogItem>): ProductHealth {
  const pricingErrors = product.slug ? validateProductPricing(product as ProductCatalogItem) : ["Produktdaten fehlen."];
  const enabledRequiredProperties = (product.pricingProperties ?? []).filter((property) => property.required && (property.values ?? []).some((value) => value.enabled !== false));
  const requiredWithoutDefault = enabledRequiredProperties.filter((property) => !(property.values ?? []).some((value) => value.enabled !== false && value.defaultSelected));
  const publishedLive = product.productStatus === "active" ? product.visible !== false && product.published !== false : true;
  const items: ProductHealthCheck[] = [
    { key: "pricing", label: "Preise konfiguriert", state: pricingErrors.length ? "missing" : "ok", detail: pricingErrors[0] },
    { key: "requiredProperties", label: "Pflichteigenschaften konfiguriert", state: requiredWithoutDefault.length ? "warning" : "ok", detail: requiredWithoutDefault.map((property) => property.name).join(", ") },
    { key: "image", label: "Produktbild vorhanden", state: product.heroImage ? "ok" : "missing" },
    { key: "category", label: "Kategorie vorhanden", state: product.category ? "ok" : "missing" },
    { key: "production", label: "Produktionseinstellungen konfiguriert", state: (product as any).production || product.productBindingConfig?.enabledSystems?.length || product.deliveryText ? "ok" : "warning" },
    { key: "seo", label: "SEO konfiguriert", state: product.seo?.trim() ? "ok" : "warning", detail: "SEO-Beschreibung fehlt" },
    { key: "published", label: "Produkt korrekt veröffentlicht", state: publishedLive ? "ok" : "missing", detail: "Live-Produkt ist versteckt oder nicht veröffentlicht" },
    { key: "pricingErrors", label: "Preislogik ohne offensichtliche Fehler", state: pricingErrors.length ? "warning" : "ok", detail: pricingErrors[0] }
  ];
  const missing = items.some((item) => item.state === "missing");
  const warning = items.some((item) => item.state === "warning");
  return missing
    ? { status: "incomplete", label: "Unvollständig", tone: "red", items }
    : warning
      ? { status: "warning", label: "Warnung", tone: "amber", items }
      : { status: "healthy", label: "Gesund", tone: "green", items };
}

function ProductHealthBadge({ product }: { product: ProductCatalogItem }) {
  const health = calculateProductHealth(product);
  function showDetails() {
    window.alert([
      "Produktgesundheit",
      "",
      ...health.items.map((item) => `${item.state === "ok" ? "✓" : "⚠"} ${item.label}${item.detail ? `\n  ${item.detail}` : ""}`)
    ].join("\n"));
  }
  return <AdminStatusBadge label={health.label} tone={health.tone} onClick={showDetails} />;
}

function publicationLabel(product: Partial<ProductCatalogItem>) {
  if (product.productStatus === "draft") return { label: "Entwurf", tone: "gray" as const };
  if (product.productStatus === "inactive" || product.purchaseMode === "disabled") return { label: "Inaktiv", tone: "gray" as const };
  if (product.visible === false || product.published === false) return { label: "Versteckt", tone: "amber" as const };
  return { label: "Live", tone: "green" as const };
}

function displayOrderStatus(status: string) {
  const labels: Record<string, string> = {
    "File Check": "Dateiprüfung",
    "Ready for Print": "Druckbereit",
    Printing: "Im Druck",
    Finishing: "Weiterverarbeitung",
    Ready: "Bereit",
    Completed: "Abgeschlossen",
    Paid: "Bezahlt",
    New: "Neu",
    Processing: "In Bearbeitung"
  };
  return labels[status] ?? status;
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

function csvOptionalNumber(value: string | undefined) {
  if (!value) return undefined;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : undefined;
}

function csvPropertyPayloads(rows: Record<string, string>[]) {
  const grouped = new Map<string, GlobalProperty>();
  rows.forEach((row, rowIndex) => {
    const name = csvCell(row, "name", "Name", "Eigenschaft", "property") || csvCell(row, "slug");
    const slug = csvCell(row, "slug") || csvSlug(name);
    const property = grouped.get(slug) ?? { slug, name: name || `Eigenschaft ${rowIndex + 1}`, active: csvBool(csvCell(row, "active", "aktiv"), true), sortOrder: csvNumber(csvCell(row, "sortOrder", "reihenfolge"), 0), values: [] };
    const explicitValue = csvCell(row, "value", "wert", "propertyValue", "property_value");
    const values = explicitValue ? [explicitValue] : csvList(csvCell(row, "values", "werte"));
    for (const value of values) {
      const valueId = csvSlug(`${slug}-${value}`);
      let entry = property.values.find((item) => item.id === valueId || item.value.toLowerCase() === value.toLowerCase());
      if (!entry) {
        entry = {
          id: valueId,
          value,
          label: csvCell(row, "label", "Label") || undefined,
          image: csvCell(row, "image", "bild", "imageUrl", "bildUrl") || undefined,
          description: csvCell(row, "description", "beschreibung") || undefined,
          sortOrder: property.values.length,
          active: csvBool(csvCell(row, "valueActive", "active", "aktiv"), true),
          pricingMode: (csvCell(row, "pricingMode", "preisart") || "included") as GlobalProperty["values"][number]["pricingMode"],
          fixedPrice: csvNumber(csvCell(row, "fixedPrice", "aufpreis", "festpreis"), 0),
          costPrice: csvOptionalNumber(csvCell(row, "costPrice", "kostenpreis", "cost_price")),
          multiplier: csvNumber(csvCell(row, "multiplier", "multiplikator"), 1),
          tierPrices: []
        };
        property.values.push(entry);
      }
      const image = csvCell(row, "image", "bild", "imageUrl", "bildUrl");
      const description = csvCell(row, "description", "beschreibung");
      if (image) entry.image = image;
      if (description) entry.description = description;
      const fromQuantity = csvOptionalNumber(csvCell(row, "from_quantity", "fromQuantity", "von"));
      const unitPrice = csvOptionalNumber(csvCell(row, "unit_price", "unitPrice", "stkpreis"));
      if (fromQuantity && unitPrice !== undefined) {
        entry.pricingMode = "tiered";
        entry.tierPrices = [
          ...(entry.tierPrices ?? []),
          {
            quantity: fromQuantity,
            fromQuantity,
            toQuantity: csvOptionalNumber(csvCell(row, "to_quantity", "toQuantity", "bis")),
            price: unitPrice,
            unitPrice
          }
        ];
      }
    }
    grouped.set(slug, property);
  });
  return Array.from(grouped.values());
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function globalPropertiesToCsv(properties: GlobalProperty[]) {
  const header = ["slug", "name", "value", "label", "image", "description", "pricingMode", "fixedPrice", "costPrice", "multiplier", "from_quantity", "to_quantity", "unit_price", "active", "sortOrder"];
  const rows = properties.flatMap((property) => (property.values ?? []).flatMap((value) => {
    if (value.pricingMode === "tiered" && value.tierPrices?.length) {
      return value.tierPrices.map((tier) => [
        property.slug,
        property.name,
        value.value,
        value.label ?? "",
        value.image ?? "",
        value.description ?? "",
        "tiered",
        "",
        value.costPrice ?? "",
        "",
        tier.fromQuantity ?? tier.quantity,
        tier.toQuantity ?? "",
        tier.unitPrice ?? tier.price,
        value.active,
        property.sortOrder
      ]);
    }
    return [[
      property.slug,
      property.name,
      value.value,
      value.label ?? "",
      value.image ?? "",
      value.description ?? "",
      value.pricingMode ?? "included",
      value.fixedPrice ?? "",
      value.costPrice ?? "",
      value.multiplier ?? "",
      "",
      "",
      "",
      value.active,
      property.sortOrder
    ]];
  }));
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function AdminDashboardHome() {
  const redirect = useRedirect();
  const notify = useNotify();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Array<AdminOrderItem & { customer?: string; items?: Array<Record<string, any>> }>>([]);
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [crmSummary, setCrmSummary] = useState<{ crmPending: number; crmSynced: number } | null>(null);

  useEffect(() => {
    void (async () => {
      setLoadingStats(true);
      try {
        const [statsRes, ordersRes, productsRes, crmRes] = await Promise.all([
          fetch(`/api/admin/stats?period=${period}`),
          fetch("/api/admin/modules/orders?page=1&pageSize=6"),
          fetch("/api/catalog/products?scope=admin"),
          fetch("/api/admin/tools?action=crm-status")
        ]);
        if (!statsRes.ok) throw new Error();
        const payload = await statsRes.json() as DashboardStats;
        setStats(payload);
        if (ordersRes.ok) {
          const orders = await ordersRes.json() as { items: Array<AdminOrderItem & { customer?: string; items?: Array<Record<string, any>> }> };
          setRecentOrders(orders.items ?? []);
        }
        if (productsRes.ok) {
          setProducts(await productsRes.json() as ProductCatalogItem[]);
        }
        if (crmRes.ok) {
          const crm = await crmRes.json() as { summary?: { crmPending: number; crmSynced: number } };
          setCrmSummary(crm.summary ?? null);
        }
      } catch {
        notify("Dashboard-Daten konnten nicht geladen werden.", { type: "error" });
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [period]);

  const productHealth = products.map(calculateProductHealth);
  const incompleteProducts = productHealth.filter((item) => item.status !== "healthy").length;
  const lowMarginProducts = productHealth.filter((item) => item.items.some((check) => check.key === "pricingErrors" && check.state !== "ok")).length;
  const ordersWaitingForPdf = recentOrders.filter((order) => order.items?.some((item) => {
    const config = item.config ?? {};
    return config.pdfAnalysisStatus === "required" || config.PrintDatei === "-" || config.printCheckRequested === true;
  })).length;
  const attention = [
    incompleteProducts ? { text: `${incompleteProducts} Produkte unvollständig`, path: "/products", tone: "amber" as const } : null,
    crmSummary?.crmPending ? { text: `${crmSummary.crmPending} CRM Rechnungen ausstehend`, path: "/tools/crm", tone: "red" as const } : null,
    ordersWaitingForPdf ? { text: `${ordersWaitingForPdf} Bestellung wartet auf PDF/Dateiprüfung`, path: "/orders", tone: "amber" as const } : null,
    lowMarginProducts ? { text: `${lowMarginProducts} Preis-Konfiguration prüfen`, path: "/products", tone: "amber" as const } : null
  ].filter(Boolean) as Array<{ text: string; path: string; tone: "amber" | "red" }>;

  const quickLinks = [
    { label: "Produkte", path: "/products" },
    { label: "CRM / Rechnungen", path: "/tools/crm" },
    { label: "Dateien", path: "/fileUploads" },
    { label: "E-Mail", path: "/tools/email" }
  ];

  return (
    <Grid container spacing={2.25}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: 0 }}>Übersicht</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, fontWeight: 650 }}>Bestellungen, Preisgesundheit und CRM-Übertragungsstatus.</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Umsatz" value={formatCurrency(stats?.grossRevenue ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Bestellungen" value={String(stats?.revenueOrderCount ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Offene Anfragen" value={String(stats?.openRequestCount ?? 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <DashboardCard label="Produkte" value={String(stats?.productsTotal ?? 0)} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "grid", gap: 1.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Benötigt Aufmerksamkeit</Typography>
            {loadingStats ? <Skeleton height={44} /> : attention.length ? attention.map((item) => (
              <Box key={item.text} onClick={() => redirect(item.path)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, py: 0.75, borderTop: `1px solid ${adminColors.border}`, cursor: "pointer", "&:hover": { color: adminColors.blue } }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.text}</Typography>
                <AdminStatusBadge label={item.tone === "red" ? "Problem" : "Prüfen"} tone={item.tone} />
              </Box>
            )) : <EmptyState title="Keine offenen Punkte." text="Aktuell ist alles verarbeitet." />}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "grid", gap: 1.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Letzte Bestellungen</Typography>
            {loadingStats ? <Skeleton height={96} /> : recentOrders.length ? (
              <Box sx={{ display: "grid" }}>
                {recentOrders.map((order) => {
                  const firstItem = order.items?.[0];
                  const label = firstItem?.name ?? firstItem?.description ?? order.customer ?? "Bestellung";
                  const status = String(order.status ?? "Neu");
                  const tone = /bezahlt|paid|ready|fertig/i.test(status) ? "green" : /prüfung|produktion|processing/i.test(status) ? "amber" : /storniert|cancel/i.test(status) ? "red" : "blue";
                  return (
                    <Box key={order.id} onClick={() => redirect("edit", "orders", order.id)} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "160px minmax(0,1fr) 120px 120px" }, gap: 1, alignItems: "center", py: 1, borderTop: `1px solid ${adminColors.border}`, cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{order.id}</Typography>
                      <Typography variant="body2" sx={{ color: adminColors.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(label)}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{formatCurrency(Number(order.total || 0))}</Typography>
                      <AdminStatusBadge label={displayOrderStatus(status)} tone={tone} />
                    </Box>
                  );
                })}
              </Box>
            ) : <EmptyState title="Keine neuen Bestellungen." text="Neue Webshop-Bestellungen erscheinen hier." />}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent sx={{ display: "grid", gap: 1.5 }}>
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
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 2 }}>
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
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent sx={{ display: "grid", gap: 1.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Schnellzugriff</Typography>
            {quickLinks.map((item) => (
              <Button key={item.path} variant="outlined" onClick={() => redirect(item.path)} sx={{ justifyContent: "flex-start", py: 1 }}>
                {item.label}
              </Button>
            ))}
            <Divider />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 900 }}>Netto-Umsatz</Typography>
                <Typography variant="body2" sx={{ fontWeight: 950 }}>{formatCurrency(stats?.netRevenue ?? 0)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 900 }}>Ø Bestellung</Typography>
                <Typography variant="body2" sx={{ fontWeight: 950 }}>{formatCurrency(stats?.averageOrder ?? 0)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function ProductList() {
  return (
    <List
      filters={searchFilters}
      sort={{ field: "category", order: "ASC" }}
      perPage={200}
      sx={{ "& .RaList-content": { bgcolor: "transparent", boxShadow: "none" } }}
    >
      <ProductGroupedList />
    </List>
  );
}

type ProductAdminRecord = AdminRecord & ProductCatalogItem;
type CategoryAdminRecord = AdminRecord & { sortOrder?: number };

function productSortValue(product: ProductAdminRecord) {
  return product.studentShopSortOrder ?? product.bestsellerSortOrder ?? 999;
}

function ProductGroupedList() {
  const { data = [], isPending } = useListContext<ProductAdminRecord>();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { data: categories = [] } = useGetList<CategoryAdminRecord>("categories", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "sortOrder", order: "ASC" }
  });
  const allProductIds = useMemo(() => data.map((product) => String(product.id ?? product.slug)), [data]);
  const selectedProductIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
  const selectedVisibleCount = allProductIds.filter((id) => selectedProductIdSet.has(id)).length;
  const allVisibleSelected = allProductIds.length > 0 && selectedVisibleCount === allProductIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const groups = useMemo(() => {
    const categoryMap = new Map(
      categories.map((category) => [
        String(category.slug ?? category.id),
        {
          name: String(category.name ?? category.slug ?? category.id),
          sortOrder: Number(category.sortOrder ?? 999)
        }
      ])
    );
    const grouped = new Map<string, { slug: string; name: string; sortOrder: number; products: ProductAdminRecord[] }>();

    for (const product of data) {
      const slug = String(product.category ?? "ohne-kategorie");
      const category = categoryMap.get(slug);
      const group = grouped.get(slug) ?? {
        slug,
        name: category?.name ?? "Ohne Kategorie",
        sortOrder: category?.sortOrder ?? 999,
        products: []
      };
      group.products.push(product);
      grouped.set(slug, group);
    }

    return [...grouped.values()]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "de"))
      .map((group) => ({
        ...group,
        products: [...group.products].sort((left, right) => productSortValue(left) - productSortValue(right) || left.name.localeCompare(right.name, "de"))
      }));
  }, [categories, data]);

  function toggleProduct(productId: string, checked: boolean) {
    setSelectedProductIds((current) => checked
      ? Array.from(new Set([...current, productId]))
      : current.filter((id) => id !== productId)
    );
  }

  function toggleVisibleProducts(checked: boolean) {
    setSelectedProductIds((current) => {
      if (checked) return Array.from(new Set([...current, ...allProductIds]));
      const visibleIds = new Set(allProductIds);
      return current.filter((id) => !visibleIds.has(id));
    });
  }

  async function deleteSelectedProducts() {
    if (!selectedProductIds.length) return;
    if (!window.confirm(`${selectedProductIds.length} Produkte wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedProductIds.map((id) => fetchJson(`${catalogApiUrl}/products/${encodeURIComponent(id)}`, { method: "DELETE" })));
      notify(`${selectedProductIds.length} Produkte gelöscht.`, { type: "success" });
      setSelectedProductIds([]);
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Produkte konnten nicht gelöscht werden.", { type: "error" });
    } finally {
      setBulkDeleting(false);
    }
  }

  if (isPending) {
    return <Typography variant="body2" color="text.secondary">Produkte werden geladen...</Typography>;
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ px: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, color: adminColors.ink, letterSpacing: 0 }}>
          Produkte
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: adminColors.muted, fontWeight: 650, maxWidth: 820 }}>
          Nach Kategorien gruppiert, damit Produkte schneller gefunden werden. Die Suche oben filtert weiterhin ueber Name, Slug und ID.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ borderRadius: 2, borderColor: adminColors.border }}>
        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", py: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              size="small"
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected}
              disabled={!allProductIds.length || bulkDeleting}
              onChange={(event) => toggleVisibleProducts(event.target.checked)}
              slotProps={{ input: { "aria-label": "Alle sichtbaren Produkte auswählen" } }}
            />
            <Typography variant="body2" sx={{ fontWeight: 850, color: adminColors.ink }}>
              {selectedProductIds.length ? `${selectedProductIds.length} ausgewählt` : "Sichtbare Produkte auswählen"}
            </Typography>
          </Box>
          <Button
            size="small"
            color="error"
            variant="contained"
            startIcon={<DeleteOutlineIcon />}
            disabled={!selectedProductIds.length || bulkDeleting}
            onClick={() => void deleteSelectedProducts()}
          >
            {bulkDeleting ? "Löscht..." : "Ausgewählte löschen"}
          </Button>
        </CardContent>
      </Card>

      {groups.length ? groups.map((group) => (
        <Card key={group.slug} variant="outlined" sx={{ borderRadius: 2, borderColor: adminColors.border, overflow: "hidden" }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2, py: 1.5, bgcolor: adminColors.tableHead, borderBottom: `1px solid ${adminColors.border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                <Box sx={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 1.5, bgcolor: "#fff", color: adminColors.blue, border: `1px solid ${adminColors.border}` }}>
                  <CategoryIcon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 950, color: adminColors.ink, lineHeight: 1.15 }}>
                    {group.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: adminColors.muted, fontWeight: 700 }}>
                    {group.slug}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ flexShrink: 0, fontWeight: 900, color: adminColors.ink, bgcolor: "#fff", border: `1px solid ${adminColors.border}`, borderRadius: 999, px: 1.2, py: 0.4 }}>
                {group.products.length} Produkte
              </Typography>
            </Box>

            <Box sx={{ display: "grid" }}>
              {group.products.map((product) => {
                const productId = String(product.id ?? product.slug);
                const selected = selectedProductIdSet.has(productId);
                return (
                <Box
                  key={productId}
                  role="button"
                  tabIndex={0}
                  onClick={() => redirect("edit", "products", productId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      redirect("edit", "products", productId);
                    }
                  }}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "auto 1fr", md: "42px minmax(260px, 1.6fr) 110px 120px 130px 110px auto" },
                    gap: { xs: 1, md: 1.5 },
                    alignItems: "center",
                    px: 2,
                    py: 1.35,
                    borderTop: `1px solid ${adminColors.border}`,
                    bgcolor: product.productStatus === "inactive" || product.visible === false || product.published === false ? "#f8fafc" : "#fff",
                    cursor: "pointer",
                    transition: "background-color 140ms ease, box-shadow 140ms ease",
                    "&:hover": { bgcolor: "#f9fbff" },
                    "&:focus-visible": { outline: `2px solid ${adminColors.blue}`, outlineOffset: -2, boxShadow: "inset 0 0 0 2px #fff" }
                  }}
                >
                  <Box onClick={(event) => event.stopPropagation()} sx={{ display: "flex", alignItems: "center" }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      disabled={bulkDeleting}
                      onChange={(event) => toggleProduct(productId, event.target.checked)}
                      slotProps={{ input: { "aria-label": `${product.name} auswählen` } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: adminColors.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 650 }}>
                      {product.slug}
                    </Typography>
                  </Box>
                  <AdminStatusBadge label={publicationLabel(product).label} tone={publicationLabel(product).tone} />
                  <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 750 }}>
                    {product.purchaseMode === "request" ? "Anfrage" : product.purchaseMode === "both" ? "Online + Anfrage" : product.purchaseMode === "disabled" ? "Deaktiviert" : "Online"}
                  </Typography>
                  <ProductHealthBadge product={product} />
                  <Typography variant="caption" sx={{ color: adminColors.ink, fontWeight: 900 }}>
                    {formatCurrency(Number(product.basePrice ?? 0))}
                  </Typography>
                  <Box onClick={(event) => event.stopPropagation()} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 0.75, flexWrap: "wrap" }}>
                    <Button size="small" variant="outlined" href={`#/products/${product.id ?? product.slug}`}>
                      Bearbeiten
                    </Button>
                    <DeleteButton record={product} resource="products" mutationMode="pessimistic" confirmTitle="Produkt löschen?" confirmContent="Diese Aktion kann nicht rückgängig gemacht werden." />
                  </Box>
                </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )) : (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Keine Produkte gefunden.</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function OrdersList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
        <OrderEmbossingDetails />
        <OrderCommunicationHistory />
        <OrderFileStatus />
        <TextInput source="id" disabled />
        <TextInput source="customer" label="Kunde" validate={[required()]} />
        <TextInput source="email" label="E-Mail" />
        <NumberInput source="total" label="Summe" disabled />
        <SelectInput source="status" choices={[
          { id: "Anfrage", name: "Anfrage" },
          { id: "Neu", name: "Neu" },
          { id: "Bezahlt", name: "Bezahlt" },
          { id: "File Check", name: "Dateiprüfung" },
          { id: "Ready for Print", name: "Druckbereit" },
          { id: "Printing", name: "Im Druck" },
          { id: "Finishing", name: "Weiterverarbeitung" },
          { id: "Ready", name: "Bereit" },
          { id: "Completed", name: "Abgeschlossen" },
          { id: "Versendet", name: "Versendet" },
          { id: "Storniert", name: "Storniert" }
        ]} />
        <TextInput source="billingAddress" label="Rechnungsadresse" multiline />
        <TextInput source="shippingAddress" label="Lieferadresse" multiline />
      </SimpleForm>
    </Edit>
  );
}

function OrderCommunicationHistory() {
  const record = useRecordContext<AdminRecord & { status?: string; createdAt?: string; updatedAt?: string; invoiceNumber?: string }>();
  if (!record) return null;
  const created = record.createdAt ? new Date(record.createdAt).toLocaleString("de-DE") : "-";
  const paid = /bezahlt|paid/i.test(String(record.status ?? ""));
  const entries = [
    { label: "Bestellbestätigung", sent: true, date: created },
    { label: "Zahlungsbestätigung", sent: paid, date: paid ? created : "Nicht gesendet" },
    { label: "Rechnung", sent: Boolean((record as any).invoiceNumber), date: (record as any).invoiceNumber ? created : "Nicht gesendet" },
    { label: "Abholbereitschaft E-Mail", sent: /ready|completed|abhol/i.test(String(record.status ?? "")), date: /ready|completed|abhol/i.test(String(record.status ?? "")) ? new Date(record.updatedAt ?? record.createdAt ?? Date.now()).toLocaleString("de-DE") : "Nicht gesendet" }
  ];
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent sx={{ display: "grid", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Kundenkommunikation</Typography>
        {entries.map((entry) => (
          <Box key={entry.label} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr" }, gap: 1, py: 0.6, borderTop: `1px solid ${adminColors.border}` }}>
            <Typography variant="body2" sx={{ fontWeight: 850 }}>{entry.sent ? "✓" : "○"} {entry.label}</Typography>
            <Typography variant="body2" sx={{ color: adminColors.muted }}>{entry.date}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

function OrderFileStatus() {
  const record = useRecordContext<AdminRecord & { items?: Array<Record<string, any>> }>();
  const items = record?.items ?? [];
  const fileRows = items.map((item, index) => {
    const config = item.config ?? {};
    const fileUrl = item.printCheckFileUrl || config.PrintDatei || config.pdfAnalysisFileUrl;
    const fileName = item.printCheckFileName || config.Dateiname || config.pdfAnalysisFileName;
    const pages = config.pdfAnalysisPageCount || config["PDF-Seiten"] || config.seitenanzahl;
    const bw = config.pdfAnalysisBwPageCount || config["SW-Seiten"];
    const color = config.pdfAnalysisColorPageCount || config.Farbseiten;
    const uploaded = Boolean(fileUrl && fileUrl !== "-");
    const status = !uploaded ? "Fehlt" : config.pdfAnalysisStatus === "success" ? "Hochgeladen" : config.pdfAnalysisStatus === "invalid" ? "Ungültiges Format" : "Prüfung erforderlich";
    return { index, fileUrl, fileName, pages, bw, color, status };
  }).filter((row) => row.fileUrl || row.pages || row.status !== "Fehlt");
  if (!fileRows.length) return null;
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent sx={{ display: "grid", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>PDF- / Dateistatus</Typography>
        {fileRows.map((row) => (
          <Box key={`${row.index}-${row.fileName ?? ""}`} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 160px 120px 120px 120px" }, gap: 1, alignItems: "center", py: 0.75, borderTop: `1px solid ${adminColors.border}` }}>
            <Typography variant="body2" sx={{ fontWeight: 850, overflowWrap: "anywhere" }}>{row.fileName || row.fileUrl || "PDF"}</Typography>
            <AdminStatusBadge label={row.status} tone={row.status === "Hochgeladen" ? "green" : row.status === "Fehlt" || row.status === "Ungültiges Format" ? "red" : "amber"} />
            <Typography variant="body2" sx={{ color: adminColors.muted }}>{row.pages ? `${row.pages} Seiten` : "-"}</Typography>
            <Typography variant="body2" sx={{ color: adminColors.muted }}>{row.bw ? `${row.bw} BW` : "-"}</Typography>
            <Typography variant="body2" sx={{ color: adminColors.muted }}>{row.color ? `${row.color} Farbe` : "-"}</Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

function OrderEmbossingDetails() {
  const record = useRecordContext<AdminRecord & { items?: Array<Record<string, any>> }>();
  const embossingItems = (record?.items ?? []).filter((item) => item.embossingDesign || item.config?.PraegungDesignId || item.config?.PraegungDesignID);
  if (!embossingItems.length) return null;
  return (
    <Box sx={{ display: "grid", gap: 1.5, mb: 2 }}>
      {embossingItems.map((item, index) => {
        const design = item.embossingDesign ?? {};
        const config = item.config ?? {};
        const resolvedText = config.PraegungText && config.PraegungText !== "-" ? config.PraegungText : [
          config["Hochschule / Schule"],
          config["Art der Arbeit"],
          config.Titel,
          config.Untertitel,
          config.Name,
          config.Jahr
        ].filter(Boolean).join("\n\n");
        return (
          <Box key={`${item.id ?? index}-embossing`} sx={{ border: `1px solid ${adminColors.border}`, borderRadius: 2, p: 2, bgcolor: adminColors.canvas }}>
            <Typography variant="caption" sx={{ display: "block", color: adminColors.muted, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>
              PRÄGUNG
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 900, color: adminColors.ink }}>
              {design.color === "silber" ? "Silberprägung" : design.color === "blind" ? "Blindprägung" : "Goldprägung"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>Vorlage: {design.template ?? config.Vorlage ?? "-"}</Typography>
            <Typography variant="body2">Prägezeilen: {design.lineCount ?? config["Prägezeilen"] ?? "-"}</Typography>
            <Typography variant="body2">Cover: Schwarz</Typography>
            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {(design.previewUrl || config.PraegungVorschau) ? <Button size="small" variant="outlined" href={design.previewUrl || config.PraegungVorschau} target="_blank">Vorschau öffnen</Button> : null}
              {(design.productionPdfUrl || config.ProduktionsPDF) ? <Button size="small" variant="contained" href={design.productionPdfUrl || config.ProduktionsPDF} target="_blank">Produktions-PDF öffnen</Button> : null}
            </Box>
            {resolvedText ? (
              <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap", fontFamily: "monospace", color: adminColors.ink }}>
                {resolvedText}
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

function InvoicesList() {
  return (
    <List filters={searchFilters} sort={{ field: "issuedAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="id" label="Rechnung" />
        <TextField source="customer" label="Kunde" />
        <NumberField source="amount" label="Betrag" options={{ style: "currency", currency: "EUR" }} />
        <TextField source="status" label="Status" />
        <DateField source="issuedAt" label="Ausgestellt" />
        <InvoiceRowActions />
      </Datagrid>
    </List>
  );
}

function InvoiceRowActions() {
  const record = useRecordContext<AdminRecord & { source?: string }>();
  const source = String(record?.source ?? "local").toLowerCase();
  if (source && source !== "local") {
    return (
      <Button size="small" variant="outlined" disabled>
        Extern
      </Button>
    );
  }
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Box>
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
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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

function UsersRolesList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit">
        <TextField source="email" label="E-Mail" />
        <TextField source="name" label="Name" />
        <TextField source="role.name" label="Rolle" />
        <BooleanField source="active" label="Aktiv" />
        <DateField source="createdAt" label="Erstellt" />
        <EditButton />
        <DeleteButton mutationMode="pessimistic" />
      </Datagrid>
    </List>
  );
}

function RoleSelectInput() {
  const notify = useNotify();
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/roles");
        if (!response.ok) throw new Error();
        const payload = await response.json() as Array<{ id: string; name: string }>;
        setRoles(payload);
      } catch {
        notify("Rollen konnten nicht geladen werden.", { type: "error" });
      }
    })();
  }, [notify]);
  return <SelectInput source="roleId" label="Rolle" choices={roles.map((role) => ({ id: role.id, name: role.name }))} validate={[required()]} />;
}

function UsersRolesForm() {
  return (
    <>
      <TextInput source="email" label="E-Mail" type="email" validate={[required()]} />
      <TextInput source="name" label="Name" />
      <RoleSelectInput />
      <BooleanInput source="active" label="Aktiv" defaultValue />
    </>
  );
}

function UsersRolesEdit() {
  return <Edit><SimpleForm><UsersRolesForm /></SimpleForm></Edit>;
}

function UsersRolesCreate() {
  return <Create><SimpleForm><UsersRolesForm /></SimpleForm></Create>;
}

function FileUploadsList() {
  return (
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
    <List filters={searchFilters} sort={{ field: "createdAt", order: "DESC" }}>
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
    <List filters={searchFilters} sort={{ field: "sortOrder", order: "ASC" }}>
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
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 800 }}>SEO & Funnel</Typography>
        <Typography variant="body2">
          Verwende Tags wie intent:commercial, intent:transactional, intent:local oder intent:informational. Der erste Eintrag unter "Verknüpfte Produkte" wird als Haupt-CTA im Ratgeber verwendet.
        </Typography>
      </Alert>
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
      <TextInput source="body" label="Artikeltext" multiline validate={[required()]} fullWidth helperText="Unterüberschriften mit ## schreiben, Listen mit - beginnen. Beispiel: ## Was kostet es? / - Seitenanzahl / - Bindung" />
      <ArrayInput source="tags" label="Tags">
        <SimpleFormIterator inline disableClear>
          <TextInput source="" label="Tag" helperText="z.B. intent:commercial oder cluster:Abschlussarbeiten" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="relatedProducts" label="Verknüpfte Produkte">
        <SimpleFormIterator inline disableClear>
          <TextInput source="" label="Produkt-Slug" helperText="Erster Produkt-Slug = Haupt-CTA" />
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
    <List filters={searchFilters} sort={{ field: "submittedAt", order: "DESC" }}>
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
          { id: "pending", name: "Ausstehend" },
          { id: "approved", name: "Freigegeben" },
          { id: "rejected", name: "Abgelehnt" },
          { id: "expired", name: "Abgelaufen" }
        ]} />
        <TextInput source="validUntil" label="Gültig bis" helperText="Optional, z.B. 2027-09-30" />
        <TextInput source="reviewNote" label="Notiz" multiline fullWidth />
      </SimpleForm>
    </Edit>
  );
}

function ShippingList() {
  return (
    <List filters={searchFilters} sort={{ field: "price", order: "ASC" }}>
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
  const notify = useNotify();
  const pricingType = (useWatch({ name: "pricingType" }) as ProductCatalogItem["pricingType"] | undefined) ?? "tiered";
  const productStatus = (useWatch({ name: "productStatus" }) as ProductCatalogItem["productStatus"] | undefined) ?? "draft";
  const basePrice = Number(useWatch({ name: "basePrice" }) ?? 0);
  const priceTiers = (useWatch({ name: "priceTiers" }) as ProductPriceTier[] | undefined) ?? [];
  const pricingProperties = (useWatch({ name: "pricingProperties" }) as ProductPricingProperty[] | undefined) ?? [];
  const pricingProfile = useWatch({ name: "pricingProfile" }) as ProductCatalogItem["pricingProfile"] | undefined;
  const pricingComponents = (useWatch({ name: "pricingComponents" }) as ProductPricingComponent[] | undefined) ?? [];
  const pricingGuards = useWatch({ name: "pricingGuards" }) as ProductCatalogItem["pricingGuards"] | undefined;
  const priceHistory = (useWatch({ name: "priceHistory" }) as ProductCatalogItem["priceHistory"] | undefined) ?? [];
  const productBindingConfig = (useWatch({ name: "productBindingConfig" }) as ProductCatalogItem["productBindingConfig"] | undefined) ?? {};
  const usesBindingProductionLogic = (productBindingConfig.enabledSystems ?? []).length > 0;
  const [previewQuantity, setPreviewQuantity] = useState<number>(() => Number(priceTiers[0]?.quantity ?? 1));
  const [previewConfig, setPreviewConfig] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState("");
  const [componentJson, setComponentJson] = useState("");
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
          pricingMode: "global",
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
      pricingProfile,
      pricingComponents,
      pricingGuards,
      priceTiers: tierRows,
      pricingProperties: resolveGlobalPropertyPricing({ ...values, pricingProperties } as ProductCatalogItem, globalProperties).pricingProperties ?? pricingProperties
    };
  }

  function inheritedValuePrice(property: ProductPricingProperty, value: ProductPropertyValue) {
    const global = globalProperties.find((item) => item.slug === property.propertyId);
    const globalValue = global?.values.find((item) => item.id === value.propertyValueId);
    if (!globalValue) return "Kein globaler Preis";
    if ((globalValue.pricingMode ?? "included") === "fixed") return `Global: +${Number(globalValue.fixedPrice ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} / Stk.`;
    if (globalValue.pricingMode === "flat") return `Global: ${Number(globalValue.fixedPrice ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} fix`;
    if (globalValue.pricingMode === "multiplier") return `Global: x ${Number(globalValue.multiplier ?? 1)}`;
    if (globalValue.pricingMode === "tiered") return "Global: Staffelpreis";
    return "Global: inklusive";
  }

  const previewProduct = currentProduct();
  const previewQty = previewQuantity || Number(tierRows[0]?.quantity ?? 1);
  const previewProfile = resolveConfiguratorProfile(previewProduct);
  const previewProductionConfig = previewProfile === "brochure"
    ? {
      ...previewConfig,
      brochureConfig: "true",
      brochureSeparateCover: previewConfig.brochureSeparateCover ?? "yes",
      "PDF-Seiten": previewConfig["PDF-Seiten"] ?? "12",
      brochureBinding: previewConfig.brochureBinding ?? "Rückstichheftung"
    }
    : previewConfig;
  const previewProduction = deriveProductDocumentProduction(previewProduct, [], previewProductionConfig, previewQty);
  const previewQuantities = pricingQuantitiesForProductDocument(previewProduct, [], previewProductionConfig, previewQty);
  const preview = calculateConfiguredProductPrice(previewProduct, previewQty, previewConfig, previewQuantities);
  const universalPreview = calculateProductPricingResult({
    product: previewProduct,
    quantity: previewQty,
    configuration: previewConfig,
    productionContext: previewQuantities,
    globalProperties
  });
  const previewTier = pricingType === "tiered"
    ? (() => {
      try {
        return calculateTierPrice(previewQty, tierRows);
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

  function exportComponentsJson() {
    setComponentJson(JSON.stringify(pricingComponents, null, 2));
  }

  function importComponentsJson() {
    const parsed = JSON.parse(componentJson || "[]") as ProductPricingComponent[];
    if (Array.isArray(parsed)) {
      setValue("pricingComponents", parsed, { shouldDirty: true });
    }
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

  function updateValueProduction(
    propertyIndex: number,
    valueIndex: number,
    key: keyof NonNullable<ProductPropertyValue["production"]>,
    value: string | number | undefined
  ) {
    const next = structuredClone(pricingProperties);
    const nextValue = next[propertyIndex].values[valueIndex];
    nextValue.production = { ...(nextValue.production ?? {}), [key]: value };
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
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="areaPricing.minWidthCm" label="Min. Breite (cm)" min={0} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="areaPricing.maxWidthCm" label="Max. Breite (cm)" min={0} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="areaPricing.minHeightCm" label="Min. Höhe (cm)" min={0} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="areaPricing.maxHeightCm" label="Max. Höhe (cm)" min={0} step={0.1} fullWidth />
            </Grid>
          </Grid>
        ) : null}
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0f172a" }}>Advanced pricing</summary>
          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SelectInput source="pricingProfile" label="Pricing profile" choices={Object.entries(pricingProfileLabels).map(([id, name]) => ({ id, name }))} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SelectInput source="experienceProfile" label="Experience profile" choices={Object.entries(experienceProfileLabels).map(([id, name]) => ({ id, name }))} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SelectInput source="pricingGuards.roundingRule" label="Rundung" choices={[
                { id: "none", name: "Keine" },
                { id: "cent", name: "Cent" },
                { id: "ten_cent", name: "0,10 € aufrunden" },
                { id: "fifty_cent", name: "0,50 € aufrunden" },
                { id: "whole", name: "Ganze Euro" },
                { id: "psychological", name: "x,90 €" }
              ]} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="pricingGuards.minimumOrderPrice" label="Mindestbestellwert (€)" min={0} step={0.01} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="pricingGuards.minimumMarginPercent" label="Mindestmarge (%)" min={0} max={99} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="pricingGuards.targetMarginPercent" label="Zielmarge (%)" min={0} max={99} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <NumberInput source="pricingGuards.maximumDiscountPercent" label="Max. Rabatt (%)" min={0} max={100} step={0.1} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MuiTextField
                multiline
                minRows={4}
                label="Pricing components JSON"
                value={componentJson}
                onChange={(event) => setComponentJson(event.target.value)}
                placeholder={'[{"id":"print-bw","label":"SW Druck","kind":"print","quantitySource":"black_white_pages","sellingPrice":0.08,"costPrice":0.03}]'}
                fullWidth
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                <Button size="small" variant="outlined" onClick={exportComponentsJson}>Komponenten exportieren</Button>
                <Button size="small" variant="outlined" onClick={importComponentsJson}>Komponenten importieren</Button>
              </Box>
            </Grid>
          </Grid>
        </details>
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
                  {attached ? `${property.name} hinzugefügt` : `+ Eigenschaft hinzufügen: ${property.name}`}
                </Button>
              );
            })}
            {!globalProperties.length ? <Typography variant="body2" color="text.secondary">Noch keine globalen Eigenschaften angelegt.</Typography> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {pricingProperties.map((property, propertyIndex) => (
              <Card key={`${property.name}-${propertyIndex}`} variant="outlined" sx={{ borderRadius: 2, borderColor: "#cbd5e1" }}>
                <CardContent sx={{ display: "grid", gap: 1.2, py: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1fr) 120px 150px 180px 180px auto" }, gap: 1, alignItems: "center", pb: 1, borderBottom: "1px solid #e2e8f0" }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{property.name}</Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>{property.propertyId ? `Stammdaten: ${property.propertyId}` : "Legacy-Eigenschaft"}</Typography>
                    </Box>
                    <MuiTextField size="small" label="Reihenfolge" type="number" value={property.sortOrder ?? propertyIndex} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].sortOrder = Number(event.target.value);
                      updateProperties(next);
                    }} />
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
                    <MuiTextField select size="small" label="Standardwert" value={(property.values ?? []).find((value) => value.defaultSelected)?.value ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].values = next[propertyIndex].values.map((item) => ({ ...item, defaultSelected: item.value === event.target.value }));
                      updateProperties(next);
                    }}>
                      <MenuItem value="">Automatisch</MenuItem>
                      {(property.values ?? []).filter((value) => value.enabled !== false).map((value) => (
                        <MenuItem key={value.value} value={value.value}>{value.labelOverride || value.label || value.value}</MenuItem>
                      ))}
                    </MuiTextField>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Button size="small" variant="outlined" onClick={() => updateProperties([...pricingProperties.slice(0, propertyIndex + 1), JSON.parse(JSON.stringify(property)) as ProductPricingProperty, ...pricingProperties.slice(propertyIndex + 1)])}>Eigenschaft duplizieren</Button>
                      <Button size="small" variant="outlined" disabled={propertyIndex === 0} onClick={() => {
                        const next = structuredClone(pricingProperties);
                        [next[propertyIndex - 1], next[propertyIndex]] = [next[propertyIndex], next[propertyIndex - 1]];
                        updateProperties(next.map((item, index) => ({ ...item, sortOrder: index })));
                      }}>Hoch</Button>
                      <Button size="small" variant="outlined" disabled={propertyIndex === pricingProperties.length - 1} onClick={() => {
                        const next = structuredClone(pricingProperties);
                        [next[propertyIndex + 1], next[propertyIndex]] = [next[propertyIndex], next[propertyIndex + 1]];
                        updateProperties(next.map((item, index) => ({ ...item, sortOrder: index })));
                      }}>Runter</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => updateProperties(pricingProperties.filter((_, index) => index !== propertyIndex))}>Löschen</Button>
                    </Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "160px 160px 150px 1fr" }, gap: 1, alignItems: "center" }}>
                    <MuiTextField select size="small" label="Darstellung" value={property.display?.control ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      const control = event.target.value as NonNullable<ProductPricingProperty["display"]>["control"] | "";
                      next[propertyIndex].display = { ...(next[propertyIndex].display ?? {}), control: control || undefined };
                      updateProperties(next);
                    }}>
                      <MenuItem value="">Standard</MenuItem>
                      <MenuItem value="select">Dropdown</MenuItem>
                      <MenuItem value="buttons">Buttons</MenuItem>
                      <MenuItem value="cards">Karten</MenuItem>
                      <MenuItem value="radio">Radio</MenuItem>
                      <MenuItem value="swatches">Farbfelder</MenuItem>
                    </MuiTextField>
                    <MuiTextField select size="small" label="Bereich" value={property.display?.section ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      const section = event.target.value as NonNullable<ProductPricingProperty["display"]>["section"] | "";
                      next[propertyIndex].display = { ...(next[propertyIndex].display ?? {}), section: section || undefined };
                      updateProperties(next);
                    }}>
                      <MenuItem value="">Standard</MenuItem>
                      <MenuItem value="general">Allgemein</MenuItem>
                      <MenuItem value="format">Format</MenuItem>
                      <MenuItem value="print">Druck</MenuItem>
                      <MenuItem value="material">Material</MenuItem>
                      <MenuItem value="cover">Umschlag</MenuItem>
                      <MenuItem value="finishing">Veredelung</MenuItem>
                      <MenuItem value="binding">Bindung</MenuItem>
                    </MuiTextField>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 800 }}>
                      <input type="checkbox" checked={Boolean(property.display?.advanced)} onChange={(event) => {
                        const next = structuredClone(pricingProperties);
                        next[propertyIndex].display = { ...(next[propertyIndex].display ?? {}), advanced: event.target.checked };
                        updateProperties(next);
                      }} />
                      Erweiterte Option
                    </label>
                    <MuiTextField size="small" label="Hilfetext" value={property.display?.helpText ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].display = { ...(next[propertyIndex].display ?? {}), helpText: event.target.value || undefined };
                      updateProperties(next);
                    }} />
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 150px 1fr" }, gap: 1, alignItems: "center" }}>
                    <MuiTextField size="small" label="Sichtbar wenn Eigenschaft" value={property.visibility?.propertyId ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      const value = event.target.value;
                      next[propertyIndex].visibility = value ? { ...(next[propertyIndex].visibility ?? { operator: "equals", value: "" }), propertyId: value } : undefined;
                      updateProperties(next);
                    }} />
                    <MuiTextField select size="small" label="Bedingung" value={property.visibility?.operator ?? "equals"} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].visibility = { ...(next[propertyIndex].visibility ?? { propertyId: "", value: "" }), operator: event.target.value as "equals" | "not_equals" };
                      updateProperties(next);
                    }}>
                      <MenuItem value="equals">ist</MenuItem>
                      <MenuItem value="not_equals">ist nicht</MenuItem>
                    </MuiTextField>
                    <MuiTextField size="small" label="Wert" value={property.visibility?.value ?? ""} onChange={(event) => {
                      const next = structuredClone(pricingProperties);
                      next[propertyIndex].visibility = { ...(next[propertyIndex].visibility ?? { propertyId: "", operator: "equals" }), value: event.target.value };
                      updateProperties(next);
                    }} />
                  </Box>

                  <Box sx={{ display: "grid", gap: 0.9 }}>
                    {(property.values ?? []).map((value, valueIndex) => (
                      <Box key={`${value.value}-${valueIndex}`} sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, p: 1, display: "grid", gap: 1, bgcolor: value.enabled === false ? "#f8fafc" : "white", color: "#0f172a" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "86px minmax(150px,1fr) minmax(150px,1fr) 170px 190px 140px 140px 140px auto" }, gap: 1, alignItems: "center" }}>
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
                            <MenuItem value="global">Globaler Preis</MenuItem>
                            <MenuItem value="included">Im Grundpreis enthalten</MenuItem>
                            <MenuItem value="fixed">Aufpreis / Stk.</MenuItem>
                            <MenuItem value="tiered">Staffelpreis / Stk.</MenuItem>
                            <MenuItem value="flat">Festpreis</MenuItem>
                            <MenuItem value="multiplier">Multiplikator</MenuItem>
                          </MuiTextField>
                          <MuiTextField select size="small" label="Berechnung" value={value.production?.pricingQuantitySource ?? "copies"} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            const nextValue = next[propertyIndex].values[valueIndex];
                            nextValue.production = {
                              ...(nextValue.production ?? {}),
                              pricingQuantitySource: event.target.value as NonNullable<ProductPropertyValue["production"]>["pricingQuantitySource"]
                            };
                            updateProperties(next);
                          }}>
                            {Object.entries(pricingQuantitySourceLabels).map(([source, label]) => (
                              <MenuItem key={source} value={source}>{label}</MenuItem>
                            ))}
                          </MuiTextField>
                          <MuiTextField size="small" label={value.pricingMode === "global" ? inheritedValuePrice(property, value) : value.pricingMode === "flat" ? "Festpreis (€)" : "Aufpreis / Stk. (€)"} type="number" disabled={value.pricingMode !== "fixed" && value.pricingMode !== "flat"} value={value.fixedPrice ?? 0} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].fixedPrice = Number(event.target.value);
                            updateProperties(next);
                          }} />
                          <MuiTextField size="small" label="VK Override (€)" type="number" value={value.priceOverride ?? ""} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].priceOverride = event.target.value === "" ? undefined : Number(event.target.value);
                            updateProperties(next);
                          }} />
                          <MuiTextField size="small" label="Kosten (€)" type="number" value={value.costOverride ?? value.costPrice ?? ""} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].costOverride = event.target.value === "" ? undefined : Number(event.target.value);
                            updateProperties(next);
                          }} />
                          {value.pricingMode === "multiplier" ? (
                            <MuiTextField size="small" label="Multiplikator" type="number" value={value.multiplier ?? 1} onChange={(event) => {
                              const next = structuredClone(pricingProperties);
                              next[propertyIndex].values[valueIndex].multiplier = Number(event.target.value);
                              updateProperties(next);
                            }} />
                          ) : null}
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
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, gap: 1, borderTop: "1px dashed #cbd5e1", pt: 1 }}>
                          <MuiTextField size="small" label="Bild URL" value={value.image ?? ""} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].image = event.target.value || undefined;
                            updateProperties(next);
                          }} />
                          <MuiTextField size="small" label="Beschreibung" value={value.description ?? ""} onChange={(event) => {
                            const next = structuredClone(pricingProperties);
                            next[propertyIndex].values[valueIndex].description = event.target.value || undefined;
                            updateProperties(next);
                          }} />
                        </Box>
                        {usesBindingProductionLogic ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(140px, 1fr))" }, gap: 1, borderTop: "1px dashed #cbd5e1", pt: 1 }}>
                          <MuiTextField
                            size="small"
                            label="Papierstärke mm"
                            type="number"
                            value={value.production?.caliperMm ?? value.production?.thicknessMm ?? ""}
                            helperText="z.B. 0.10 für 80 g"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "caliperMm", event.target.value === "" ? undefined : Number(event.target.value))}
                          />
                          <MuiTextField
                            size="small"
                            label="Grammatur g/m²"
                            type="number"
                            value={value.production?.grammageGsm ?? ""}
                            helperText="Nur Info/Fallback"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "grammageGsm", event.target.value === "" ? undefined : Number(event.target.value))}
                          />
                          <MuiTextField
                            select
                            size="small"
                            label="Caliper Quelle"
                            value={value.production?.caliperSource ?? ""}
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "caliperSource", event.target.value || undefined)}
                          >
                            <MenuItem value="">Keine</MenuItem>
                            <MenuItem value="manufacturer">Hersteller</MenuItem>
                            <MenuItem value="supplier">Lieferant</MenuItem>
                            <MenuItem value="measured">Gemessen</MenuItem>
                            <MenuItem value="estimated">Geschätzt</MenuItem>
                          </MuiTextField>
                          <MuiTextField
                            size="small"
                            label="Coverstärke mm"
                            type="number"
                            value={value.production?.coverThicknessMm ?? ""}
                            helperText="Deckblatt/Rückkarton"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "coverThicknessMm", event.target.value === "" ? undefined : Number(event.target.value))}
                          />
                          <MuiTextField
                            size="small"
                            label="Bindungssystem ID"
                            value={value.production?.bindingSystemId ?? ""}
                            helperText="z.B. wire-3-1"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "bindingSystemId", event.target.value || undefined)}
                          />
                          <MuiTextField
                            size="small"
                            label="Bindungsserie"
                            value={value.production?.bindingSeries ?? ""}
                            helperText="z.B. classic"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "bindingSeries", event.target.value || undefined)}
                          />
                          <MuiTextField
                            size="small"
                            label="Bindungsfarbe"
                            value={value.production?.bindingColor ?? ""}
                            helperText="schwarz, weiss, silber"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "bindingColor", event.target.value || undefined)}
                          />
                          <MuiTextField
                            size="small"
                            label="Format"
                            value={value.production?.format ?? ""}
                            helperText="A4, A5 ..."
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "format", event.target.value || undefined)}
                          />
                          <MuiTextField
                            select
                            size="small"
                            label="Druckart-Wert"
                            value={value.production?.printColorMode ?? ""}
                            helperText="Nur für Druckart-Eigenschaften"
                            onChange={(event) => updateValueProduction(propertyIndex, valueIndex, "printColorMode", event.target.value || undefined)}
                          >
                            <MenuItem value="">Keine</MenuItem>
                            <MenuItem value="black_white">Alles Schwarz-Weiß</MenuItem>
                            <MenuItem value="full_color">Alles Farbe</MenuItem>
                            <MenuItem value="auto">Farbe/SW laut PDF</MenuItem>
                          </MuiTextField>
                        </Box>
                        ) : null}
                        {value.pricingMode === "tiered" ? (
                          <Box sx={{ overflowX: "auto", borderTop: "1px solid #e2e8f0", pt: 1 }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${tierRows.length}, minmax(92px, 1fr))`, gap: 0.75, minWidth: Math.max(360, tierRows.length * 96) }}>
                              {tierRows.map((tier) => {
                                const quantity = Number(tier.fromQuantity ?? tier.quantity);
                                const rowIndex = (value.tierPrices ?? []).findIndex((row) => Number(row.quantity) === quantity || Number(row.fromQuantity) === quantity);
                                const row = rowIndex >= 0 ? value.tierPrices?.[rowIndex] : { quantity, price: 0 };
                                return (
                                  <MuiTextField key={quantity} size="small" label={`${quantity} / Stk.`} type="number" value={row?.unitPrice ?? row?.price ?? 0} onChange={(event) => {
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 950, textTransform: "uppercase", letterSpacing: ".08em" }}>Preis-Test</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a" }}>Live Preisberechnung</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" onClick={() => notify("Preis wurde mit der aktuellen Konfiguration neu berechnet.", { type: "info" })}>Neu berechnen</Button>
                <Button size="small" variant="outlined" disabled={!previewProduct.slug} onClick={() => previewProduct.slug && window.open(`/produkt/${previewProduct.slug}`, "_blank", "noopener,noreferrer")}>Kundenseite öffnen</Button>
              </Box>
            </Box>
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
                {previewProduct.pdfAnalysisMode !== "disabled" || ["brochure", "document", "thesis", "simple-print"].includes(previewProfile) ? (
                  <>
                    <MuiTextField size="small" label="Seiten" type="number" value={previewConfig["PDF-Seiten"] ?? ""} onChange={(event) => setPreviewConfig((current) => ({ ...current, "PDF-Seiten": event.target.value, seitenanzahl: event.target.value }))} sx={{ width: 120 }} />
                    <MuiTextField size="small" label="SW-Seiten" type="number" value={previewConfig.pdfAnalysisBwPageCount ?? ""} onChange={(event) => setPreviewConfig((current) => ({ ...current, pdfAnalysisBwPageCount: event.target.value, "SW-Seiten": event.target.value }))} sx={{ width: 120 }} />
                    <MuiTextField size="small" label="Farbseiten" type="number" value={previewConfig.pdfAnalysisColorPageCount ?? ""} onChange={(event) => setPreviewConfig((current) => ({ ...current, pdfAnalysisColorPageCount: event.target.value, Farbseiten: event.target.value }))} sx={{ width: 120 }} />
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
            {previewQuantities ? (
              <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "#334155" }}>Auflage: {previewQuantities.copies}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "#334155" }}>Druckseiten: {previewQuantities.printedPages}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "#334155" }}>Blätter: {previewQuantities.sheets}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "#334155" }}>Umschlagseiten: {previewQuantities.printedCoverSides}</Typography>
              </Box>
            ) : null}
            {previewProfile === "brochure" ? (
              <Box sx={{ mt: 1, borderTop: "1px solid #e2e8f0", pt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a" }}>Produktionsvorschau Broschüre</Typography>
                <Typography variant="body2" sx={{ color: "#475569" }}>PDF Seiten: {"pdfPagesPerCopy" in previewProduction ? previewProduction.pdfPagesPerCopy : previewProduction.pagesPerCopy}</Typography>
                <Typography variant="body2" sx={{ color: "#475569" }}>Innenseiten: {previewProduction.pagesPerCopy}</Typography>
                <Typography variant="body2" sx={{ color: "#475569" }}>Produktionsseiten: {"producedPageCount" in previewProduction ? previewProduction.producedPageCount : previewProduction.pagesPerCopy}</Typography>
                {"blankProductionPages" in previewProduction ? <Typography variant="body2" sx={{ color: "#475569" }}>Zusätzliche Leerseiten: {previewProduction.blankProductionPages}</Typography> : null}
                {"coverMapping" in previewProduction ? (
                  <Typography variant="body2" sx={{ color: "#475569" }}>
                    U1: {previewProduction.coverMapping.U1} · U2: {previewProduction.coverMapping.U2} · U3: {previewProduction.coverMapping.U3} · U4: {previewProduction.coverMapping.U4}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            <Box sx={{ mt: 1.25, borderTop: "1px solid #e2e8f0", pt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0f172a" }}>Preisaufschlüsselung</Typography>
              <Typography variant="body2" sx={{ color: "#334155", fontWeight: 800 }}>Verkaufspreis: {formatCurrency(universalPreview.customerPrice)}</Typography>
              {universalPreview.productionCost !== undefined ? (
                <>
                  <Typography variant="body2" sx={{ color: "#475569" }}>Geschätzte Kosten: {formatCurrency(universalPreview.productionCost)}</Typography>
                  <Typography variant="body2" sx={{ color: "#475569" }}>Deckungsbeitrag: {formatCurrency(universalPreview.contribution ?? 0)}</Typography>
                  <Typography variant="body2" sx={{ color: "#475569" }}>Marge: {(universalPreview.marginPercent ?? 0).toLocaleString("de-DE")} %</Typography>
                </>
              ) : <Typography variant="body2" sx={{ color: "#64748b" }}>Kostendaten unvollständig</Typography>}
              {universalPreview.minimumPriceApplied || universalPreview.marginGuardApplied ? (
                <Typography variant="body2" sx={{ color: "#b45309", fontWeight: 800 }}>Profitability guard angewendet</Typography>
              ) : null}
              {universalPreview.components.filter((component) => component.id !== "legacy").map((component) => (
                <Typography key={component.id} variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 700 }}>
                  {component.label}: {component.quantity.toLocaleString("de-DE")} × {formatCurrency(component.unitSellingPrice)} = {formatCurrency(component.sellingTotal)}
                </Typography>
              ))}
              {universalPreview.warnings?.map((warning) => (
                <Typography key={`${warning.code}-${warning.componentId ?? warning.message}`} variant="caption" sx={{ display: "block", color: "#b45309", fontWeight: 800 }}>{warning.message}</Typography>
              ))}
            </Box>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 900, color: "#0f172a" }}>Berechneter Preis: {formatCurrency(preview.total)}</Typography>
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
        <BooleanInput source="studentDiscountEligible" label="Studentenrabatt erlauben" defaultValue />
      </CardContent>
    </Card>
  );
}

function ProductPdfAnalysisFields() {
  const { setValue } = useFormContext();
  const profile = (useWatch({ name: "configuratorProfile" }) as ProductCatalogItem["configuratorProfile"] | undefined) ?? "standard";
  const pdfConfig = (useWatch({ name: "pdfConfig" }) as ProductCatalogItem["pdfConfig"] | undefined) ?? {};
  const slug = (useWatch({ name: "slug" }) as string | undefined) ?? "";

  function updatePdfConfig(key: keyof NonNullable<ProductCatalogItem["pdfConfig"]>, value: unknown) {
    setValue("pdfConfig", { ...pdfConfig, [key]: value }, { shouldDirty: true });
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#fff" }}>
      <CardContent sx={{ display: "grid", gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Konfigurator-Vorlage</Typography>
        <SelectInput
          source="configuratorProfile"
          label="Konfigurator-Vorlage"
          defaultValue="standard"
          choices={Object.entries(configuratorProfileLabels).map(([id, name]) => ({ id, name }))}
          fullWidth
        />
        <Button size="small" variant="outlined" href={slug ? `/produkt/${slug}` : undefined} onClick={(event) => {
          if (!slug) return;
          event.preventDefault();
          window.open(`/produkt/${slug}`, "_blank", "noopener,noreferrer");
        }}>Produkt im Shop öffnen</Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>PDF / Dateiprüfung</Typography>
        <SelectInput
          source="pdfAnalysisMode"
          label="PDF-Datei"
          defaultValue="disabled"
          choices={[
            { id: "disabled", name: "Deaktiviert" },
            { id: "optional", name: "Optional" },
            { id: "required", name: "Erforderlich" }
          ]}
          helperText="Steuert, ob der bestehende PDF-Analyzer Seitenanzahl, Format und Ausrichtung automatisch in die Konfiguration übernimmt."
          fullWidth
        />
        <MuiTextField
          select
          size="small"
          label="Vorschau"
          value={pdfConfig.previewMode ?? ""}
          onChange={(event) => updatePdfConfig("previewMode", event.target.value || undefined)}
        >
          <MenuItem value="">Profil-Standard</MenuItem>
          {Object.entries(pdfPreviewModeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </MuiTextField>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 0.75 }}>
          {[
            ["formatCheck", "Format prüfen"],
            ["allowFormatOverride", "Produktionsformat darf abweichen"],
            ["showColorAnalysis", "Farbanalyse anzeigen"],
            ["allowPageMapping", "Seitenzuordnung"],
            ["bindingCheck", "Bindungsprüfung"]
          ].map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 800 }}>
              <input type="checkbox" checked={Boolean(pdfConfig[key as keyof typeof pdfConfig])} onChange={(event) => updatePdfConfig(key as keyof NonNullable<ProductCatalogItem["pdfConfig"]>, event.target.checked)} />
              {label}
            </label>
          ))}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 180px)" }, gap: 1 }}>
          <MuiTextField size="small" label="Mindestseiten" type="number" value={pdfConfig.minPages ?? ""} onChange={(event) => updatePdfConfig("minPages", event.target.value === "" ? undefined : Number(event.target.value))} />
          <MuiTextField size="small" label="Seitenvielfaches" type="number" value={pdfConfig.pageMultiple ?? ""} onChange={(event) => updatePdfConfig("pageMultiple", event.target.value === "" ? undefined : Number(event.target.value))} />
        </Box>
        {profile === "brochure" ? <Alert severity="info">Broschüren verwenden weiterhin die bestehende Umschlag-, U1-U4-, Bindungs- und Produktionslogik.</Alert> : null}
        <Box sx={{ display: "grid", gap: 0.75, color: "#475569" }}>
          <Typography variant="body2"><strong>Deaktiviert:</strong> Keine automatische PDF-Analyse für dieses Produkt.</Typography>
          <Typography variant="body2"><strong>Optional:</strong> PDF kann hochgeladen werden; erkannte Dokumentdaten werden übernommen.</Typography>
          <Typography variant="body2"><strong>Erforderlich:</strong> Eine gültig analysierte PDF ist nötig, bevor der Warenkorb möglich ist.</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ProductProductionConfigFields() {
  const { setValue } = useFormContext();
  const config = (useWatch({ name: "productBindingConfig" }) as ProductCatalogItem["productBindingConfig"] | undefined) ?? {};
  const [systems, setSystems] = useState<BindingSystem[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/production/bindings");
        if (!res.ok) return;
        const payload = await res.json() as { bindingSystems?: BindingSystem[] };
        setSystems(payload.bindingSystems ?? []);
      } catch {
        setSystems([]);
      }
    })();
  }, []);
  const enabled = config.enabledSystems ?? [];
  function updateEnabled(systemId: string, checked: boolean) {
    const next = checked ? Array.from(new Set([...enabled, systemId])) : enabled.filter((id) => id !== systemId);
    setValue("productBindingConfig", { ...config, enabledSystems: next }, { shouldDirty: true });
  }
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#fff" }}>
      <CardContent sx={{ display: "grid", gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Produktionslogik</Typography>
        <MuiTextField
          select
          size="small"
          label="Bindungsgröße"
          value={config.bindingSizeSelectionMode ?? "automatic"}
          onChange={(event) => setValue("productBindingConfig", { ...config, bindingSizeSelectionMode: event.target.value }, { shouldDirty: true })}
          helperText="Automatisch berechnet die passende Größe aus PDF-Seiten, Druckseiten, Papierstärke und Bindungssystem."
        >
          <MenuItem value="automatic">Automatisch</MenuItem>
          <MenuItem value="manual">Manuell</MenuItem>
          <MenuItem value="automatic-with-override">Automatisch mit Override</MenuItem>
        </MuiTextField>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em" }}>Erlaubte Bindungssysteme</Typography>
          {systems.length ? systems.map((system) => (
            <label key={system.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 800 }}>
              <input type="checkbox" checked={enabled.includes(system.id)} onChange={(event) => updateEnabled(system.id, event.target.checked)} />
              <span>{system.label}</span>
              <span style={{ color: "#64748b", fontWeight: 700 }}>{system.id}</span>
            </label>
          )) : (
            <Typography variant="body2" sx={{ color: "#64748b" }}>Keine Produktionsdaten geladen. Bitte zuerst unter Tools / Produktionsdaten Bindungen prüfen.</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function AdminFormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#d8e0ea", bgcolor: "#fff" }}>
      <CardContent sx={{ display: "grid", gap: 1.5, p: 2.25 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.35, color: "#64748b", fontWeight: 600 }}>{description}</Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function AdminFormCanvas({ children }: { children: ReactNode }) {
  return (
    <Box sx={{
      width: "100%",
      display: "grid",
      gap: 2,
      color: "#0f172a",
      "& .RaSimpleForm-main": { maxWidth: "none" },
      "& .MuiFormControl-root": { minWidth: 0 },
      "& .MuiInputBase-root": { bgcolor: "#fff", color: "#0f172a" },
      "& .MuiInputLabel-root": { color: "#334155", fontWeight: 750 },
      "& .MuiFormHelperText-root": { color: "#64748b" }
    }}>
      {children}
    </Box>
  );
}

function AdminFormHeader({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{ px: 0.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.2 }}>{title}</Typography>
      <Typography variant="body2" sx={{ mt: 0.35, color: "#64748b", fontWeight: 600 }}>{description}</Typography>
    </Box>
  );
}

function ProductFormFields({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <AdminFormCanvas>
      {duplicate ? <ProductDuplicateButton /> : null}
      <AdminFormSection title="Produktbasis" description="Name, Kategorie und kurze Verkaufstexte für die Produktseite.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr 1fr" }, gap: 1.5 }}>
          <TextInput source="slug" label="Slug" validate={[required()]} fullWidth />
          <TextInput source="name" label="Produktname" validate={[required()]} fullWidth />
          <ProductCategorySelect />
        </Box>
        <TextInput source="short" label="Kurzbeschreibung" multiline fullWidth />
        <TextInput source="description" label="Beschreibung" multiline minRows={4} fullWidth />
        <TextInput source="seo" label="SEO Beschreibung" multiline minRows={3} fullWidth />
      </AdminFormSection>

      <AdminFormSection title="Medien & Lieferung" description="Produktbilder, Galerie und Lieferhinweis für die sichtbare Produktseite.">
        <ProductImageUploadControls />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 260px" }, gap: 1.5 }}>
          <TextInput source="heroImage" label="Hauptbild URL" fullWidth />
          <TextInput source="deliveryText" label="Lieferzeit" helperText="z.B. 1 Tag oder 1-3 Tage" fullWidth />
        </Box>
      </AdminFormSection>

      <AdminFormHeader title="Sichtbarkeit & Platzierung" description="Kaufmodus, Startseiten-Listen, Studentenrabatt und Branchenzuordnung." />
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <ProductHomepagePlacementFields />
        <ProductPdfAnalysisFields />
        <ProductProductionConfigFields />
        <ProductIndustryCheckboxes />
      </Box>

      <AdminFormHeader title="Preise & Konfigurator" description="Produktstaffeln, globale Eigenschaften, produktbezogene Overrides und Preisvorschau." />
      <ProductPricingManager />
    </AdminFormCanvas>
  );
}

function ProductEdit() {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }}>
        <ProductFormFields duplicate />
      </SimpleForm>
    </Edit>
  );
}

function ProductCreate() {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }} defaultValues={{ visible: false, published: false, productStatus: "draft", purchaseMode: "online", isBestseller: false, bestsellerSortOrder: 10, isStudentShop: false, studentShopSortOrder: 10, studentDiscountEligible: true, configuratorProfile: "standard", experienceProfile: "standard", pdfAnalysisMode: "disabled", pdfConfig: {}, productBindingConfig: { enabledSystems: [], bindingSizeSelectionMode: "automatic" }, pricingType: "tiered", pricingComponents: [], pricingGuards: {}, basePrice: 0, priceTiers: [{ quantity: 1, price: 0 }], areaPricing: { defaultWidthCm: 100, defaultHeightCm: 100, minWidthCm: 1, maxWidthCm: 0, minHeightCm: 1, maxHeightCm: 0, minAreaM2: 0 }, pricingProperties: [], rating: 4.8, tags: [], gallery: [], variants: [], industrySlugs: [], enabledCategoryProperties: [], production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" } }}>
        <ProductFormFields />
      </SimpleForm>
    </Create>
  );
}

function IndustryList() {
  return (
    <List filters={searchFilters} sort={{ field: "sortOrder", order: "ASC" }}>
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

function PropertyCsvPanel() {
  const notify = useNotify();
  const refresh = useRefresh();
  const [csvText, setCsvText] = useState(csvExamples.properties);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState("");

  function readCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  }

  async function exportPropertiesCsv() {
    try {
      const properties = await fetchJson<GlobalProperty[]>("/api/catalog/properties?scope=admin");
      const blob = new Blob([globalPropertiesToCsv(properties)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eigenschaften-staffelpreise.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify(error instanceof Error ? error.message : "CSV Export fehlgeschlagen.", { type: "error" });
    }
  }

  async function importPropertiesCsv() {
    setImporting(true);
    setResult("");
    try {
      const rows = parseCsvRows(csvText);
      if (!rows.length) throw new Error("CSV enthält keine Datenzeilen.");
      const payloads = csvPropertyPayloads(rows);
      let imported = 0;
      const skipped: string[] = [];

      for (const [index, payload] of payloads.entries()) {
        if (!payload.name?.trim()) {
          skipped.push(`Datensatz ${index + 1}: Name fehlt`);
          continue;
        }
        if (!payload.slug?.trim()) {
          skipped.push(`Datensatz ${index + 1}: Slug fehlt`);
          continue;
        }
        const response = await fetch("/api/catalog/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({} as { message?: string }));
          throw new Error(error.message || `Import fehlgeschlagen bei ${payload.slug}.`);
        }
        imported += 1;
      }

      const summary = `${imported} Eigenschaften importiert.${skipped.length ? ` Übersprungen: ${skipped.join("; ")}` : ""}`;
      setResult(summary);
      notify(summary, { type: skipped.length ? "warning" : "success" });
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV Import fehlgeschlagen.";
      setResult(message);
      notify(message, { type: "error" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ display: "grid", gap: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>CSV Import fuer Eigenschaften</Typography>
            <Typography variant="body2" color="text.secondary">
              Importiert komplette Eigenschaftswerte inklusive globaler Staffelpreise. Bestehende Slugs werden aktualisiert.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" component="label">
              CSV Datei
              <input hidden type="file" accept=".csv,text/csv" onChange={readCsvFile} />
            </Button>
            <Button variant="outlined" onClick={() => void exportPropertiesCsv()}>Export</Button>
            <Button variant="contained" onClick={() => void importPropertiesCsv()} disabled={importing || !csvText.trim()}>
              {importing ? "Importiert..." : "Import"}
            </Button>
          </Box>
        </Box>
        <MuiTextField
          multiline
          minRows={5}
          label="CSV Inhalt"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          helperText="Spalten: slug,name,value,label,pricingMode,fixedPrice,costPrice,from_quantity,to_quantity,unit_price,active,sortOrder"
          fullWidth
        />
        {result ? <Alert severity={result.includes("fehlgeschlagen") ? "error" : "success"}>{result}</Alert> : null}
      </CardContent>
    </Card>
  );
}

function PropertyList() {
  return (
    <List filters={searchFilters} sort={{ field: "sortOrder", order: "ASC" }} sx={{ "& .RaList-content": { bgcolor: "transparent", boxShadow: "none" } }}>
      <Box sx={{ mb: 2, px: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 950, color: adminColors.ink, letterSpacing: 0 }}>Eigenschaften</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: adminColors.muted, fontWeight: 650, maxWidth: 820 }}>
          Globale Werte wie Papier, Format, Bindung oder Veredelung werden hier einmal gepflegt und danach in Produkten wiederverwendet.
          Preise bleiben zentral, Produkt-Overrides werden nur bei Sonderfällen im Produkt gesetzt.
        </Typography>
      </Box>
      <PropertyCsvPanel />
      <Datagrid
        rowClick="edit"
        bulkActionButtons={<span />}
        bulkActionsToolbar={<CatalogBulkActionsToolbar label="Eigenschaften" confirmContent="Wenn Eigenschaften bereits verwendet werden, werden sie deaktiviert statt hart gelöscht." />}
        sx={{
        overflow: "hidden",
        border: `1px solid ${adminColors.border}`,
        borderRadius: 2,
        bgcolor: "#fff",
        "& .RaDatagrid-headerCell": { bgcolor: adminColors.tableHead, color: adminColors.ink, fontWeight: 900 },
        "& .RaDatagrid-row:hover": { bgcolor: "#f8fafc" }
      }}>
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

const propertyPricingModes = [
  { title: "Inklusive", text: "Der Wert ist im Grundpreis enthalten. Für Standardpapier oder Standardformat." },
  { title: "Aufpreis / Stk.", text: "Wird pro Exemplar beziehungsweise Stück berechnet. Ideal für Bindung, Papier oder Prägung." },
  { title: "Staffelpreis / Stk.", text: "Der Aufpreis hängt von der Auflage ab. Für Papier, Format und andere mengenabhängige Werte." },
  { title: "Festpreis", text: "Einmaliger Preis pro Warenkorbposition. Nur für echte Einmal-Kosten verwenden." },
  { title: "Multiplikator", text: "Erhöht den berechneten Produktpreis prozentual über einen Faktor." }
];

function PropertyPricingGuide() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#bfdbfe", bgcolor: "#eff6ff" }}>
      <CardContent sx={{ p: 2, display: "grid", gap: 1.3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 950, color: "#0f172a" }}>Preislogik für Eigenschaftswerte</Typography>
          <Typography variant="body2" sx={{ mt: 0.35, color: "#475569", fontWeight: 600 }}>
            Diese Preise gelten global für alle Produkte, solange ein Produkt keinen eigenen Override setzt.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" }, gap: 1 }}>
          {propertyPricingModes.map((mode) => (
            <Box key={mode.title} sx={{ border: "1px solid #dbeafe", bgcolor: "#fff", borderRadius: 1.5, p: 1.2 }}>
              <Typography variant="caption" sx={{ display: "block", fontWeight: 950, color: adminColors.blue }}>{mode.title}</Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#64748b", lineHeight: 1.45 }}>{mode.text}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

function PropertyValuesInput() {
  return (
    <AdminFormSection title="Eigenschaftswerte" description="Jeder Wert ist eine auswählbare Option im Produkt-Konfigurator, zum Beispiel 80 g, 120 g oder 250 g Papier.">
      <PropertyPricingGuide />
      <ArrayInput source="values" label={false}>
        <SimpleFormIterator
          disableClear
          getItemLabel={(index) => `Wert ${index + 1}`}
          sx={{
            "& .RaSimpleFormIterator-line": {
              mb: 1.5,
              p: 1.75,
              border: `1px solid ${adminColors.border}`,
              borderRadius: 2,
              bgcolor: "#fff",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)"
            },
            "& .RaSimpleFormIterator-form": { display: "grid", gap: 1.3 },
            "& .RaSimpleFormIterator-index": { color: adminColors.blue, fontWeight: 950 }
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "180px 1fr 150px" }, gap: 1.25, alignItems: "start" }}>
            <TextInput source="value" label="Interner Wert" validate={[required()]} helperText="Technischer Wert, z.B. 250g oder A3. Möglichst stabil halten." fullWidth />
            <TextInput source="label" label="Anzeigename" helperText="Text im Konfigurator. Leer lassen, wenn der interne Wert gut lesbar ist." fullWidth />
            <BooleanInput source="active" label="Aktiv" defaultValue helperText={false} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 1fr" }, gap: 1.25, alignItems: "start" }}>
            <TextInput source="image" label="Bild URL" helperText="Optional für Karten-Darstellung, z.B. Bindungsart." fullWidth />
            <TextInput source="description" label="Beschreibung" helperText="Optionaler Kurztext für Karten." fullWidth />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "240px 180px 180px 180px" }, gap: 1.25, alignItems: "start" }}>
            <SelectInput source="pricingMode" label="Preisart" defaultValue="included" choices={[
              { id: "included", name: "Inklusive" },
              { id: "fixed", name: "Aufpreis / Stk." },
              { id: "tiered", name: "Staffelpreis / Stk." },
              { id: "flat", name: "Festpreis" },
              { id: "multiplier", name: "Multiplikator" }
            ]} helperText="Legt fest, wie dieser Wert in der zentralen Preisberechnung wirkt." fullWidth />
            <NumberInput source="fixedPrice" label="Aufpreis/Festpreis (€)" min={0} step={0.01} defaultValue={0} helperText="Für Aufpreis / Stk. oder Festpreis." fullWidth />
            <NumberInput source="costPrice" label="Kostenpreis (€)" min={0} step={0.01} helperText="Optional intern für Marge/Kosten." fullWidth />
            <NumberInput source="multiplier" label="Multiplikator" min={0} step={0.01} defaultValue={1} helperText="1 = kein Aufschlag, 1.2 = +20%." fullWidth />
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 1.5, display: "grid", gap: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 950, color: "#0f172a" }}>Staffelpreise</Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.25, color: "#64748b", fontWeight: 650 }}>
                  Nur relevant bei Preisart "Staffelpreis / Stk.". Beispiel: 1-99 = 0,32 €, 100-499 = 0,24 €.
                </Typography>
              </Box>
              <ArrayInput source="tierPrices" label={false}>
                <SimpleFormIterator
                  inline
                  disableClear
                  getItemLabel={(index) => `Staffel ${index + 1}`}
                  sx={{
                    "& .RaSimpleFormIterator-line": { alignItems: "flex-start", border: 0, p: 0, mb: 0.75 },
                    "& .RaSimpleFormIterator-form": { gap: 1 }
                  }}
                >
                  <NumberInput source="fromQuantity" label="Von" min={1} step={1} helperText="inkl." />
                  <NumberInput source="toQuantity" label="Bis" min={1} step={1} helperText="inkl." />
                  <NumberInput source="unitPrice" label="€/Stk." min={0} step={0.01} helperText="Aufpreis pro Stück" />
                </SimpleFormIterator>
              </ArrayInput>
            </CardContent>
          </Card>
        </SimpleFormIterator>
      </ArrayInput>
    </AdminFormSection>
  );
}

function PropertySafeDeleteButton() {
  const record = useRecordContext<GlobalProperty>();
  const notify = useNotify();
  const redirect = useRedirect();
  if (!record?.slug || !record.usageCount) return null;

  async function removeAndDelete() {
    if (!record?.slug) return;
    if (!window.confirm(`Eigenschaft "${record.name}" aus ${record.usageCount ?? 0} Produkt(en) entfernen und endgültig löschen?`)) return;
    const response = await fetch(`/api/catalog/properties/${record.slug}?removeFromProducts=true`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify(typeof payload?.message === "string" ? payload.message : "Eigenschaft konnte nicht gelöscht werden.", { type: "error" });
      return;
    }
    notify("Eigenschaft wurde aus Produkten entfernt und gelöscht.", { type: "success" });
    redirect("/properties");
  }

  return (
    <Alert severity="warning" sx={{ borderRadius: 2 }}>
      Diese Eigenschaft wird in {record.usageCount} Produkt(en) verwendet. Normales Löschen deaktiviert sie nur.
      <Box sx={{ mt: 1 }}>
        <Button color="error" variant="outlined" size="small" onClick={() => void removeAndDelete()}>
          Aus Produkten entfernen und löschen
        </Button>
      </Box>
    </Alert>
  );
}

function PropertyUsageWarning() {
  const record = useRecordContext<GlobalProperty>();
  if (!record?.usageCount) return null;
  return (
    <Alert severity="warning" sx={{ borderRadius: 2 }}>
      Changing global prices for "{record.name}" can affect {record.usageCount} product(s). This is a warning, not a blocker.
    </Alert>
  );
}

function PropertyEdit() {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }}>
        <AdminFormCanvas>
          <AdminFormHeader title="Eigenschaft bearbeiten" description="Globale Option mit wiederverwendbaren Werten, Preisen und Staffelpreisen." />
          <AdminFormSection title="Basisdaten" description="Slug und Name identifizieren die Eigenschaft im Admin, im Produkt und im Konfigurator.">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr 160px 160px" }, gap: 1.5, alignItems: "start" }}>
              <TextInput source="slug" label="Slug" validate={[required()]} helperText="Technische ID, z.B. papier." fullWidth />
              <TextInput source="name" label="Name" validate={[required()]} helperText="Sichtbarer Name, z.B. Papier." fullWidth />
              <NumberInput source="sortOrder" label="Reihenfolge" helperText="Kleinere Zahl kommt früher." fullWidth />
              <BooleanInput source="active" label="Aktiv" defaultValue helperText={false} />
            </Box>
          </AdminFormSection>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Globale Preise gelten automatisch in jedem Produkt, das diese Eigenschaft verwendet. Im Produktbereich nur dann überschreiben, wenn ein Sonderpreis nötig ist.
          </Alert>
          <PropertyUsageWarning />
          <PropertySafeDeleteButton />
        <PropertyValuesInput />
        </AdminFormCanvas>
      </SimpleForm>
    </Edit>
  );
}

function PropertyCreate() {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }} defaultValues={{ active: true, sortOrder: 0, values: [] }}>
        <AdminFormCanvas>
          <AdminFormHeader title="Eigenschaft anlegen" description="Eine globale Eigenschaft wird einmal angelegt und danach in Produkten aktiviert." />
          <AdminFormSection title="Basisdaten" description="Beginne mit einem klaren Namen. Der Slug kann leer bleiben und wird beim Speichern erzeugt.">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr 160px 160px" }, gap: 1.5, alignItems: "start" }}>
              <TextInput source="slug" label="Slug" helperText="Optional, z.B. papier." fullWidth />
              <TextInput source="name" label="Name" validate={[required()]} helperText="z.B. Papier, Format, Bindung." fullWidth />
              <NumberInput source="sortOrder" label="Reihenfolge" helperText="Kleinere Zahl kommt früher." fullWidth />
              <BooleanInput source="active" label="Aktiv" defaultValue helperText={false} />
            </Box>
          </AdminFormSection>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Beispiel Papier: Werte wie 80 g, 120 g und 250 g anlegen. Standardwerte können inklusive sein, Premium-Papier kann Aufpreis oder Staffelpreise haben.
          </Alert>
          <PropertyValuesInput />
        </AdminFormCanvas>
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
  const visibleIndustrySlugs = data.map((industry) => String(industry.slug ?? industry.id));
  const selectedVisibleCount = visibleIndustrySlugs.filter((slug) => selected.includes(slug)).length;
  const allVisibleSelected = visibleIndustrySlugs.length > 0 && selectedVisibleCount === visibleIndustrySlugs.length;

  function selectAllVisibleIndustries() {
    setValue("industrySlugs", Array.from(new Set([...selected, ...visibleIndustrySlugs])), { shouldDirty: true });
  }

  function clearVisibleIndustries() {
    const visible = new Set(visibleIndustrySlugs);
    setValue("industrySlugs", selected.filter((slug) => !visible.has(slug)), { shouldDirty: true });
  }

  if (isPending) return <Typography variant="body2" color="text.secondary">Branchen werden geladen...</Typography>;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "#f8fafc" }}>
      <CardContent sx={{ display: "grid", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0f172a" }}>Branchen</Typography>
            <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 700 }}>
              {selected.length} ausgewählt
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" disabled={allVisibleSelected || !visibleIndustrySlugs.length} onClick={selectAllVisibleIndustries}>
              Alle auswählen
            </Button>
            <Button size="small" variant="outlined" disabled={!selectedVisibleCount} onClick={clearVisibleIndustries}>
              Auswahl löschen
            </Button>
          </Box>
        </Box>
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
    <List filters={searchFilters} sort={{ field: "name", order: "ASC" }}>
      <Datagrid
        rowClick="edit"
        bulkActionButtons={<span />}
        bulkActionsToolbar={<CatalogBulkActionsToolbar label="Kategorien" confirmContent="Kategorien können nur gelöscht werden, wenn keine Produkte zugeordnet sind." />}
      >
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

function CategoryFormFields() {
  return (
    <AdminFormCanvas>
      <AdminFormSection title="Kategorie" description="Name, Slug und Beschreibung für die Katalogstruktur.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, gap: 1.5 }}>
          <TextInput source="slug" label="Slug" validate={[required()]} fullWidth />
          <TextInput source="name" label="Kategoriename" validate={[required()]} fullWidth />
        </Box>
        <TextInput source="description" label="Beschreibung" multiline minRows={3} fullWidth />
      </AdminFormSection>

      <AdminFormSection title="Status & Vorlage" description="Steuert Sichtbarkeit und Standardvorlage für neue Produkte in dieser Kategorie.">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          <BooleanInput source="visible" label="Sichtbar im Shop" />
          <BooleanInput source="published" label="Veröffentlicht" />
          <SelectInput
            source="defaultPropertyTemplate"
            label="Eigenschafts-Vorlage"
            choices={[
              { id: "print-basic", name: "Print Standard" },
              { id: "large-format", name: "Werbetechnik" },
              { id: "textile", name: "Textil" },
              { id: "sticker", name: "Aufkleber" },
              { id: "marketing-service", name: "Marketing Service" }
            ]}
            fullWidth
          />
        </Box>
      </AdminFormSection>

      <AdminFormSection title="Bild" description="Kategorie-Bild für Navigation, Landingpages und Kategorieübersichten.">
        <CategoryImageUploadControls />
        <TextInput source="logo" label="Bild URL" fullWidth />
      </AdminFormSection>

      <AdminFormSection title="Kategorie-Eigenschaften" description="Optionale Eigenschaften, die Produkte dieser Kategorie im Konfigurator verwenden können.">
        <CategoryPropertiesInput />
      </AdminFormSection>

      <AdminFormSection title="Showroom" description="Zusätzliche Bilder für hochwertige Kategorie- und Branchenansichten.">
        <ArrayInput source="showroomImages" label="Showroom Bilder">
          <SimpleFormIterator disableClear>
            <TextInput source="image" label="Bild URL" fullWidth />
            <TextInput source="title" label="Titel" fullWidth />
            <TextInput source="description" label="Beschreibung" multiline fullWidth />
          </SimpleFormIterator>
        </ArrayInput>
      </AdminFormSection>
    </AdminFormCanvas>
  );
}

function CategoryEdit() {
  return (
    <Edit>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }}>
        <CategoryFormFields />
      </SimpleForm>
    </Edit>
  );
}

function CategoryCreate() {
  return (
    <Create>
      <SimpleForm warnWhenUnsavedChanges sx={{ maxWidth: "none", bgcolor: "#f8fafc" }} defaultValues={{ visible: true, published: true, defaultPropertyTemplate: "print-basic", quantitySteps: [1, 10, 100, 1000], properties: [], showroomImages: [] }}>
        <CategoryFormFields />
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
    <Card sx={{ borderRadius: 2.5, borderColor: "#d8e0ea", bgcolor: "#fff" }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: "grid", gap: 0.5, pb: 2, borderBottom: "1px solid #e2e8f0" }}>
          <Typography variant="h5" sx={{ fontWeight: 950, color: "#0f172a", letterSpacing: 0 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, maxWidth: 820 }}>{description}</Typography>
        </Box>
        {children ? <Box sx={{ mt: 2.25 }}>{children}</Box> : null}
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
    studentDiscountPercent: number;
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
      throw new Error(typeof payload?.message === "string" ? payload.message : "Aktualisierung fehlgeschlagen");
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
      notify(`Wartungsmodus ${!maintenanceOn ? "aktiviert" : "deaktiviert"}.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen", { type: "error" });
    }
  }

  async function saveAvailability() {
    try {
      await updateStoreControl({ maintenanceAvailableAt: availableAt });
      notify("Wiederverfügbarkeit gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen", { type: "error" });
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
      notify(`Urlaubsmodus ${!vacationOn ? "aktiviert" : "deaktiviert"}.`, { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen", { type: "error" });
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
  const studentDiscountPercent = Number(settings?.storeControl.studentDiscountPercent ?? 20);

  async function toggle() {
    try {
      await updateStoreControl({ disableCheckout: shopActive });
      notify(shopActive ? "Online Shop deaktiviert. Checkout und neue Transaktionen sind gesperrt." : "Online Shop aktiviert.", {
        type: shopActive ? "warning" : "success"
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen", { type: "error" });
    }
  }

  async function saveStudentDiscountPercent(value: number) {
    try {
      await updateStoreControl({ studentDiscountPercent: Math.min(100, Math.max(0, value)) });
      notify("Studentenrabatt gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen", { type: "error" });
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
      <Box sx={{ mt: 3, maxWidth: 260 }}>
        <MuiTextField
          size="small"
          type="number"
          label="Studentenrabatt (%)"
          value={studentDiscountPercent}
          onChange={(event) => void saveStudentDiscountPercent(Number(event.target.value))}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
          disabled={loading}
          fullWidth
        />
      </Box>
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
        throw new Error(typeof payload?.message === "string" ? payload.message : "Speichern fehlgeschlagen");
      }
      notify("Email configuration saved to .env.local", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Speichern fehlgeschlagen", { type: "error" });
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
  properties: `slug,name,value,label,pricingMode,fixedPrice,costPrice,from_quantity,to_quantity,unit_price,active,sortOrder
papier,Papier,250g,250 g Papier,tiered,,0.12,1,9,0.32,true,10
papier,Papier,250g,250 g Papier,tiered,,0.12,10,24,0.30,true,10
papier,Papier,250g,250 g Papier,tiered,,0.12,25,49,0.28,true,10
papier,Papier,250g,250 g Papier,tiered,,0.12,100,499,0.24,true,10
papier,Papier,250g,250 g Papier,tiered,,0.12,500,999999,0.22,true,10
format,Format,A3,A3,fixed,0.36,0.14,,,,true,20`,
  categories: `slug,name,description,visible,published,logo
druck,Druck,Druckprodukte online konfigurieren,true,true,/uploads/categories/druck.webp
werbetechnik,Werbetechnik,Beschriftung Schilder Folien und Montage,true,true,/uploads/categories/werbetechnik.webp`,
  products: `slug,name,category,basePrice,pricingType,pricingProfile,experienceProfile,productStatus,priceTiers,pricingProperties,short,description,seo,heroImage,deliveryText,defaultWidthCm,defaultHeightCm,minWidthCm,maxWidthCm,minHeightCm,maxHeightCm,minAreaM2,tags,configuratorProfile,pdfAnalysisMode,previewMode,minPages,pageMultiple,allowPageMapping,formatCheck,allowFormatOverride
flyer,Flyer,druck,0.716,tiered,sheet-print,document,draft,"25-49:0.716|50-99:0.438","format|druckart|druckseiten|papier|veredelung",Flyer in vielen Formaten und Papieren,Flyer hochwertig drucken,Flyer drucken Wels,/uploads/products/flyer.webp,3-5 Werktage,,,,,,,,kopien|druck,simple-print,required,first-page,1,1,false,true,true
banner-m2,Banner nach Maß,werbetechnik,29.90,area,area-print,large-format,draft,"1-999:29.90",,Banner pro m²,Banner mit Wunschmaß,Banner Wels,/uploads/products/banner.webp,3-5 Werktage,100,100,30,500,30,300,0.25,banner|werbetechnik,poster,optional,first-page,1,1,false,true,true`,
  "property-display": `productSlug,propertySlug,control,section,advanced,sortOrder
broschueren,broschuere-format,buttons,format,false,10
broschueren,umschlag-option,cards,cover,false,20
broschueren,umschlag-material,select,cover,false,30
broschueren,innenteil-material,select,material,false,40
broschueren,broschuere-bindung,cards,binding,false,50
broschueren,broschuere-ecken,buttons,finishing,true,60`
};

type CatalogCsvTarget = "properties" | "categories" | "products" | "property-display";

function detectCatalogCsvTarget(rows: Record<string, string>[], fallback: CatalogCsvTarget): CatalogCsvTarget {
  const keys = new Set(rows.flatMap((row) => Object.keys(row).map(normalizeCsvKey)));
  if (["category", "kategorie", "baseprice", "preis", "pricingtype", "preisart", "pricingprofile", "experienceprofile", "productstatus", "heroimage", "short", "kurztext", "configuratorprofile", "pdfanalysismode", "previewmode", "minpages", "pagemultiple", "allowpagemapping", "formatcheck", "allowformatoverride"].some((key) => keys.has(key))) {
    return "products";
  }
  if (keys.has("productslug") && keys.has("propertyslug")) {
    return "property-display";
  }
  if (["logo", "description", "beschreibung", "defaultpropertytemplate", "quantitysteps", "showroomimages"].some((key) => keys.has(key))) {
    return "categories";
  }
  if (["values", "werte", "eigenschaft", "fromquantity", "fromquantity", "unitprice", "unitprice"].some((key) => keys.has(key))) {
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

  async function exportPropertiesCsv() {
    try {
      const properties = await fetchJson<GlobalProperty[]>("/api/catalog/properties?scope=admin");
      const blob = new Blob([globalPropertiesToCsv(properties)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eigenschaften-staffelpreise.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify(error instanceof Error ? error.message : "CSV Export fehlgeschlagen.", { type: "error" });
    }
  }

  function mapRow(row: Record<string, string>, importTarget: CatalogCsvTarget, globalProperties: GlobalProperty[] = []) {
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
    const minWidthCm = csvCell(row, "minWidthCm", "minBreiteCm", "mindestbreite");
    const maxWidthCm = csvCell(row, "maxWidthCm", "maxBreiteCm", "maximalbreite");
    const minHeightCm = csvCell(row, "minHeightCm", "minHoeheCm", "minHöheCm", "mindesthoehe", "mindesthöhe");
    const maxHeightCm = csvCell(row, "maxHeightCm", "maxHoeheCm", "maxHöheCm", "maximalhoehe", "maximalhöhe");
    const pricingType = (csvCell(row, "pricingType", "preisart") || (defaultWidthCm || defaultHeightCm ? "area" : "")).toLowerCase();
    const priceTiers = csvPriceTiers(csvCell(row, "priceTiers", "staffelpreise"), basePrice);
    const rawPricingProperties = csvCell(row, "pricingProperties", "pricing_properties", "eigenschaften", "properties");
    const propertySlugs = csvList(rawPricingProperties);
    const pricingProperties: ProductPricingProperty[] = [];
    if (propertySlugs.length > 0) {
      for (const propertySlug of propertySlugs) {
        const globalProperty = globalProperties.find(
          (item) => item.slug.toLowerCase() === propertySlug.toLowerCase() || item.name.toLowerCase() === propertySlug.toLowerCase()
        );
        if (!globalProperty) {
          throw new Error(`Unbekannte globale Eigenschaft: ${propertySlug}`);
        }
        pricingProperties.push(productPropertyFromGlobal(globalProperty, priceTiers));
      }
    }
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
        minWidthCm: csvNumber(minWidthCm, 1),
        maxWidthCm: csvNumber(maxWidthCm, 0),
        minHeightCm: csvNumber(minHeightCm, 1),
        maxHeightCm: csvNumber(maxHeightCm, 0),
        minAreaM2: csvNumber(csvCell(row, "minAreaM2", "mindestflaeche", "mindestfläche"), 0)
      } : undefined,
      priceTiers,
      deliveryText: csvCell(row, "deliveryText", "lieferzeit") || "2-5 Werktage",
      tags: csvList(csvCell(row, "tags")),
      variants: [],
      pricingProperties,
      quantitySteps: priceTiers.map((tier) => tier.fromQuantity ?? tier.quantity),
      ...productConfigFromCsvRow(row),
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
      if (importTarget === "property-display") {
        const products = await fetchJson<ProductCatalogItem[]>("/api/catalog/products?scope=admin");
        const applied = applyPropertyDisplayCsvRows(products, rows);
        let imported = 0;
        for (const product of applied.products) {
          const response = await fetch("/api/catalog/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({} as { message?: string }));
            throw new Error(error.message || `Import fehlgeschlagen bei Produkt ${product.slug}.`);
          }
          imported += 1;
        }
        const summary = `${imported} Produkte mit Darstellungsdaten aktualisiert${importTarget !== target ? ` (${importTarget} automatisch erkannt)` : ""}.${applied.skipped.length ? ` Übersprungen: ${applied.skipped.join("; ")}` : ""}`;
        setResult(summary);
        notify(summary, { type: applied.skipped.length ? "warning" : "success" });
        return;
      }
      const globalProperties = importTarget === "products"
        ? await fetchJson<GlobalProperty[]>("/api/catalog/properties?scope=admin")
        : [];
      const products = importTarget === "products"
        ? await fetchJson<ProductCatalogItem[]>("/api/catalog/products?scope=admin")
        : [];
      const payloads = importTarget === "properties"
        ? csvPropertyPayloads(rows)
        : rows.map((row) => {
          if (importTarget === "products" && !hasFullProductCsvColumns(row)) {
            const slug = productSlugFromConfigCsvRow(row);
            const existing = products.find((product) => product.slug === slug);
            if (existing) return mergeProductConfigFromCsv(existing, row) as ProductCatalogItem & { slug?: string; name?: string };
          }
          return mapRow(row, importTarget, globalProperties) as { slug?: string; name?: string };
        });
      let imported = 0;
      const skipped: string[] = [];
      for (const [index, payload] of payloads.entries()) {
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
          <Button variant={target === "property-display" ? "contained" : "outlined"} onClick={() => changeTarget("property-display")}>Eigenschaft-Darstellung</Button>
          <Button variant={target === "categories" ? "contained" : "outlined"} onClick={() => changeTarget("categories")}>Kategorien</Button>
          <Button variant="outlined" onClick={() => void exportPropertiesCsv()}>Eigenschaft-Staffeln exportieren</Button>
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
          Beispiel für {target === "properties" ? "Eigenschaften" : target === "products" ? "Produkte" : target === "property-display" ? "Eigenschaft-Darstellung" : "Kategorien"} ist im Feld bereits eingefügt und kann direkt ersetzt werden.
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
        throw new Error(typeof payload?.message === "string" ? payload.message : "Shutdown-Anforderung fehlgeschlagen");
      }
      const payload = await res.json() as { shutdownRequest: { requestedAt: string; requestedBy: string; reason: string } };
      setState(payload.shutdownRequest);
      notify("Shutdown-Anforderung gespeichert. Wartungsmodus und Checkout-Sperre wurden aktiviert.", { type: "warning" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Shutdown-Anforderung fehlgeschlagen", { type: "error" });
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
      description="1 von 3 Layouts wählen und Module (Neuigkeiten, Highlights, CTA) interaktiv umschalten."
    >
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Button variant={layout === "magazine" ? "contained" : "outlined"} onClick={() => setLayout("magazine")}>Layout 1</Button>
        <Button variant={layout === "split" ? "contained" : "outlined"} onClick={() => setLayout("split")}>Layout 2</Button>
        <Button variant={layout === "grid" ? "contained" : "outlined"} onClick={() => setLayout("grid")}>Layout 3</Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        <Button size="small" variant={showNews ? "contained" : "outlined"} onClick={() => setShowNews((v) => !v)}>Neuigkeiten</Button>
        <Button size="small" variant={showHighlights ? "contained" : "outlined"} onClick={() => setShowHighlights((v) => !v)}>Highlights</Button>
        <Button size="small" variant={showCta ? "contained" : "outlined"} onClick={() => setShowCta((v) => !v)}>CTA</Button>
      </Box>

      {layout === "magazine" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>{showNews ? <DashboardCard label="Neuigkeiten" value="Hero + Liste" /> : null}</Grid>
          <Grid size={{ xs: 12, md: 4 }}>{showHighlights ? <DashboardCard label="Highlights" value="Seitenleiste" /> : null}</Grid>
          <Grid size={{ xs: 12 }}>{showCta ? <DashboardCard label="CTA" value="Unterer Banner" /> : null}</Grid>
        </Grid>
      ) : null}

      {layout === "split" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{showNews ? <DashboardCard label="Neuigkeiten-Feed" value="Linke Spalte" /> : null}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{showHighlights ? <DashboardCard label="Highlights + CTA" value={showCta ? "Rechte Modulspalte" : "Nur rechte Highlights"} /> : null}</Grid>
        </Grid>
      ) : null}

      {layout === "grid" ? (
        <Grid container spacing={2}>
          {showNews ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Neuigkeiten-Karten" value="3-Spalten-Raster" /></Grid> : null}
          {showHighlights ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="Highlights" value="KPI-Karten" /></Grid> : null}
          {showCta ? <Grid size={{ xs: 12, md: 4 }}><DashboardCard label="CTA-Block" value="Aktionsmodul" /></Grid> : null}
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

function SettingsToolPage() {
  const notify = useNotify();
  const [vatPercent, setVatPercent] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/tools?action=tax");
        if (!res.ok) throw new Error("Steuerkonfiguration konnte nicht geladen werden.");
        const payload = await res.json() as { vatPercent: number };
        setVatPercent(Number(payload.vatPercent ?? 20));
      } catch (error) {
        notify(error instanceof Error ? error.message : "Laden fehlgeschlagen.", { type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveTax() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tools?action=tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatPercent })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof payload?.message === "string" ? payload.message : "Speichern fehlgeschlagen.");
      setVatPercent(Number(payload.vatPercent ?? vatPercent));
      notify("Steuersatz gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Steuersatz konnte nicht gespeichert werden.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminToolShell title="Einstellungen" description="Globale Admin-Konfigurationen, die nicht in den täglichen Dashboard-Workflow gehören.">
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: "grid", gap: 1.5, maxWidth: 460 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>MwSt-Konfiguration</Typography>
          <MuiTextField
            size="small"
            type="number"
            label="MwSt %"
            value={vatPercent}
            disabled={loading || saving}
            onChange={(event) => setVatPercent(Number(event.target.value))}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
          <Box>
            <Button variant="contained" onClick={() => void saveTax()} disabled={loading || saving}>
              {saving ? "Speichert..." : "Änderung speichern"}
            </Button>
          </Box>
        </CardContent>
      </Card>
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

  async function handleAction(orderId: string, operation: "stornieren" | "retry") {
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
      notify(operation === "retry" ? "CRM Rechnung wurde erneut übertragen." : "Bestellung storniert.", { type: operation === "retry" ? "success" : "info" });
      await load();
    } catch (error) {
      notify(`Aktion fehlgeschlagen. ${error instanceof Error ? error.message : "Unbekannter Fehler"}`, { type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <AdminToolShell title="CRM / Rechnungen" description="CRM besitzt Rechnungsnummern, Rechnungs-PDFs, Gutschriften, Storno-Dokumente und Mahnungen. Der Webshop bleibt Eigentümer von Bestellungen, Zahlungen und Kundenkommunikation.">
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Verbindung</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  Ziel-Endpoint für Webshop-Bestellungen. Anfragen werden als JSON mit Bearer-Token gesendet.
                </Typography>
              </Box>
              <AdminStatusBadge label={crmConfigured.url && crmConfigured.token ? "Verbunden" : "Nicht konfiguriert"} tone={crmConfigured.url && crmConfigured.token ? "green" : "red"} />
            </Box>
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
                  {configSaving ? "Speichert..." : "Verbindung speichern"}
                </Button>
                <Button variant="outlined" onClick={() => void load()} disabled={loading}>Verbindung testen</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "grid", gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Verwendet für</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 0.75 }}>
              {["Rechnungserstellung", "Rechnungsspeicherung", "Rechnungs-PDF", "Gutschrift", "Storno", "Mahnung"].map((item) => (
                <Typography key={item} variant="body2" sx={{ color: adminColors.ink, fontWeight: 800 }}>✓ {item}</Typography>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="Bezahlte Webshop-Bestellungen" value={String(payload?.summary.stripeOrders ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="Synchronisiert" value={String(payload?.summary.crmSynced ?? 0)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DashboardCard label="Ausstehend" value={String(payload?.summary.crmPending ?? 0)} />
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>Probleme bei Rechnungsübertragung</Typography>
              <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading}>Aktualisieren</Button>
            </Box>
            {(payload?.pending ?? []).length === 0 ? (
              <EmptyState title="Keine Probleme bei Rechnungsübertragung." text="Bezahlte Webshop-Bestellungen sind mit dem CRM synchronisiert." />
            ) : (
              <Box sx={{ mt: 1, display: "grid", gap: 0.6 }}>
                {(payload?.pending ?? []).slice(0, 15).map((row) => (
                  <Box key={row.id} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr .6fr .9fr auto" }, alignItems: "center", gap: 1, fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 1, px: 1, py: 0.9 }}>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.id}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{row.customer}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{formatCurrency(Number(row.total || 0))}</Typography>
                    <Typography variant="body2" sx={{ fontSize: 13 }}>{new Date(row.createdAt).toLocaleString()}</Typography>
                    <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={actionLoadingId !== null}
                        onClick={() => void handleAction(row.id, "retry")}
                      >
                        Erneut versuchen
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
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

type ProductionBindingConfigPayload = {
  bindingSystems: Array<Record<string, any>>;
  bindingVariants: Array<Record<string, any>>;
  updatedAt?: string;
};

function ProductionBindingConfigToolPage() {
  const notify = useNotify();
  const [configText, setConfigText] = useState("");
  const [config, setConfig] = useState<ProductionBindingConfigPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/production/bindings");
      if (!res.ok) throw new Error("Produktionsdaten konnten nicht geladen werden.");
      const payload = await res.json() as ProductionBindingConfigPayload;
      setConfig(payload);
      setConfigText(JSON.stringify(payload, null, 2));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Laden fehlgeschlagen.", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const parsed = JSON.parse(configText) as ProductionBindingConfigPayload;
      const res = await fetch("/api/admin/production/bindings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message ?? "Speichern fehlgeschlagen.");
      setConfig(payload);
      setConfigText(JSON.stringify(payload, null, 2));
      notify("Produktionsdaten gespeichert.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Speichern fehlgeschlagen.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function resetDefaults() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/production/bindings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true })
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message ?? "Zurücksetzen fehlgeschlagen.");
      setConfig(payload);
      setConfigText(JSON.stringify(payload, null, 2));
      notify("Standard-Produktionsdaten wiederhergestellt.", { type: "success" });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Zurücksetzen fehlgeschlagen.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function readImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setConfigText(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  }

  function exportJson() {
    const blob = new Blob([configText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "production-binding-config.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const systems = config?.bindingSystems ?? [];
  const variants = config?.bindingVariants ?? [];
  const activeVariants = variants.filter((variant) => variant.active !== false);
  const suppliers = Array.from(new Set(variants.map((variant) => variant.supplier).filter(Boolean)));

  return (
    <AdminToolShell title="Produktionsdaten Bindungen" description="Technische Binding-Systeme, Größen, Kapazitäten, Farben, SKUs und Lieferantenartikel zentral pflegen. Diese Daten werden vom Konfigurator und serverseitig beim Warenkorb/Checkout verwendet.">
      <Box sx={{ display: "grid", gap: 2 }}>
        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Binding-Systeme" value={String(systems.length)} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Varianten" value={String(variants.length)} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Aktive Varianten" value={String(activeVariants.length)} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><DashboardCard label="Lieferanten" value={String(suppliers.length)} /></Grid>
        </Grid>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Import / Export</Typography>
                <Typography variant="body2" color="text.secondary">
                  JSON ist bewusst importfreundlich: Supplier-Exporte können später in dieses Format gemappt werden.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" component="label">
                  JSON importieren
                  <input hidden type="file" accept=".json,application/json" onChange={readImportFile} />
                </Button>
                <Button variant="outlined" onClick={exportJson} disabled={!configText.trim()}>Export</Button>
                <Button variant="outlined" color="warning" onClick={() => void resetDefaults()} disabled={saving}>Standards</Button>
                <Button variant="contained" onClick={() => void save()} disabled={saving || loading || !configText.trim()}>
                  {saving ? "Speichert..." : "Speichern"}
                </Button>
              </Box>
            </Box>
            <MuiTextField
              label="Production Binding Config JSON"
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
              multiline
              minRows={18}
              fullWidth
              disabled={loading}
              helperText="Bearbeite bindingSystems, sizes/referenceCapacity und bindingVariants. Ungültiges JSON wird nicht gespeichert."
              sx={{ "& textarea": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5, lineHeight: 1.5 } }}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>Diagnose</Typography>
            <Box sx={{ mt: 1.25, display: "grid", gap: 1 }}>
              {systems.map((system) => (
                <Box key={String(system.id)} sx={{ border: `1px solid ${adminColors.border}`, borderRadius: 1.5, p: 1.25, bgcolor: "#f8fafc" }}>
                  <Typography variant="body2" sx={{ fontWeight: 950 }}>{system.label ?? system.id}</Typography>
                  <Typography variant="caption" sx={{ display: "block", color: adminColors.muted }}>
                    {system.type ?? "other"} · {system.resolutionStrategy ?? "physical-thickness"} · {Array.isArray(system.sizes) ? system.sizes.length : 0} Größen
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: adminColors.muted }}>
                    Varianten: {variants.filter((variant) => variant.bindingSystemId === system.id).length}
                  </Typography>
                  {Array.isArray(system.sizes) && system.sizes.length ? (
                    <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 0.75 }}>
                      {system.sizes.slice(0, 6).map((size: any) => {
                        const caliper = Number(size.referenceCapacity?.referencePaperCaliperMm ?? 0);
                        const maxThickness = Number(size.maxBlockThicknessMm ?? 0);
                        const capacity = caliper > 0 && maxThickness > 0 ? Math.floor(maxThickness / caliper) : undefined;
                        return (
                          <Box key={String(size.id ?? size.value)} sx={{ border: "1px solid #e2e8f0", borderRadius: 1, bgcolor: "#fff", p: 1 }}>
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 950, color: adminColors.ink }}>{size.label ?? size.value}</Typography>
                            <Typography variant="caption" sx={{ display: "block", color: adminColors.muted }}>Spine/Diameter: {size.spineWidthMm ?? size.diameterMm ?? "-"} mm</Typography>
                            <Typography variant="caption" sx={{ display: "block", color: adminColors.muted }}>Max block: {size.maxBlockThicknessMm ?? "-"} mm</Typography>
                            {size.referenceCapacity ? (
                              <Typography variant="caption" sx={{ display: "block", color: adminColors.muted }}>
                                Reference: {size.referenceCapacity.minSheets ?? "-"}-{size.referenceCapacity.maxSheets ?? "-"} sheets at {size.referenceCapacity.referencePaperCaliperMm ?? "-"} mm
                              </Typography>
                            ) : null}
                            {capacity !== undefined ? (
                              <Typography variant="caption" sx={{ display: "block", color: adminColors.ink, fontWeight: 850 }}>Calculated capacity: ~{capacity} sheets</Typography>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : null}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminToolShell>
  );
}

const adminMenuGroups = [
  {
    label: "",
    items: [
      { href: "#/", label: "Dashboard", description: "Betriebsübersicht", icon: <DashboardIcon /> }
    ]
  },
  {
    label: "SHOP",
    items: [
      { href: "#/products", label: "Produkte", description: "Katalog, Gesundheit und Preise", icon: <Inventory2Icon /> },
      { href: "#/categories", label: "Kategorien", description: "Shop-Struktur", icon: <CategoryIcon /> },
      { href: "#/properties", label: "Eigenschaften", description: "Globale Werte und Preise", icon: <LocalOfferIcon /> },
      { href: "#/tools/production-bindings", label: "Bindungen", description: "Produktionsdaten für Bindungen", icon: <TuneIcon /> },
      { href: "#/fileUploads", label: "Dateien", description: "Kunden-Uploads", icon: <UploadFileIcon /> }
    ]
  },
  {
    label: "VERKAUF",
    items: [
      { href: "#/orders", label: "Bestellungen", description: "Webshop-Aufträge und Status", icon: <ReceiptLongIcon /> },
      { href: "#/quotes", label: "Anfragen", description: "Kundenanfragen und Angebote", icon: <RequestQuoteIcon /> }
    ]
  },
  {
    label: "INHALTE",
    items: [
      { href: "#/tools/homepage", label: "Homepage", description: "Homepage-Inhalte", icon: <ArticleIcon /> },
      { href: "#/tools/site-images", label: "Website-Bilder", description: "Globale Bildplätze", icon: <UploadFileIcon /> },
      { href: "#/tools/werbung", label: "Werbung", description: "Tracking und Kampagnen", icon: <CampaignIcon /> },
      { href: "#/tools/layouts", label: "Layout Studio", description: "Visuelle Layouts", icon: <TuneIcon /> },
      { href: "#/industries", label: "Branchen", description: "Landingpages", icon: <BusinessIcon /> },
      { href: "#/studentArticles", label: "Ratgeber", description: "Studenten-SEO-Inhalte", icon: <SchoolIcon /> }
    ]
  },
  {
    label: "INTEGRATIONEN",
    items: [
      { href: "#/tools/crm", label: "CRM / Rechnungen", description: "Rechnungen und Sync", icon: <ReceiptLongIcon /> },
      { href: "#/tools/email", label: "E-Mail", description: "SMTP-Einstellungen", icon: <MailIcon /> }
    ]
  },
  {
    label: "WERKZEUGE",
    items: [
      { href: "#/tools/catalog-csv", label: "CSV Import", description: "Katalog per CSV importieren", icon: <UploadFileIcon /> },
      { href: "#/tools/image-import", label: "Bildimport", description: "Katalogbilder zuweisen", icon: <UploadFileIcon /> }
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { href: "#/tools/backup", label: "Backup", description: "Datenbank-Backups", icon: <TuneIcon /> },
      { href: "#/tools/maintenance", label: "Wartung", description: "Wartungsmodus", icon: <TuneIcon /> },
      { href: "#/tools/vacation", label: "Urlaubsmodus", description: "Lieferhinweise", icon: <LocalShippingIcon /> },
      { href: "#/tools/online-shop", label: "Shop-Steuerung", description: "Checkout steuern", icon: <TuneIcon /> },
      { href: "#/tools/settings", label: "Einstellungen", description: "Globale Einstellungen", icon: <ManageAccountsIcon /> },
      { href: "#/studentVerifications", label: "Studentenprüfung", description: "Studentenstatus prüfen", icon: <SchoolIcon /> },
      { href: "#/coupons", label: "Gutscheine", description: "Rabatte", icon: <CardGiftcardIcon /> },
      { href: "#/reviews", label: "Bewertungen", description: "Kundenbewertungen", icon: <StarIcon /> },
      { href: "#/newsletter", label: "Kontakte", description: "Newsletter-Kontakte", icon: <MailIcon /> },
      { href: "#/newsletterCampaigns", label: "Newsletter", description: "Kampagnen", icon: <CampaignIcon /> },
      { href: "#/shipping", label: "Versandarten", description: "Versandmethoden", icon: <LocalShippingIcon /> },
      { href: "#/usersRoles", label: "Benutzer & Rollen", description: "Admin-Zugänge", icon: <ManageAccountsIcon /> },
      { href: "#/tools/shutdown", label: "Shutdown", description: "Destruktive Systemaktion", icon: <DeleteOutlineIcon />, destructive: true }
    ]
  }
];

function AdminMenu() {
  const [hash, setHash] = useState(typeof window === "undefined" ? "#/" : window.location.hash || "#/");

  useEffect(() => {
    const update = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", update);
    update();
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden", px: 1, py: 1.5, bgcolor: "#f8fafc", minHeight: "100%" }}>
      <Box sx={{ px: 1.25, pb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.1 }}>DUD Studio</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>Admin-Navigation</Typography>
      </Box>
      {adminMenuGroups.map((group, groupIndex) => (
        <Box key={group.label} sx={{ mb: 1.25 }}>
          {groupIndex > 0 ? <Divider sx={{ my: 1.25 }} /> : null}
          {group.label ? (
            <Typography variant="caption" sx={{ display: "block", px: 1.25, pb: 0.75, color: "#64748b", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>
              {group.label}
            </Typography>
          ) : null}
          <MuiList disablePadding sx={{ display: "grid", gap: 0.5 }}>
            {group.items.map((item) => {
              const active = item.href === "#/" ? hash === "#/" : hash.startsWith(item.href);
              return (
                <ListItemButton
                  component="a"
                  href={item.href}
                  key={item.href}
                  selected={active}
                  sx={{
                    minHeight: 58,
                    alignItems: "flex-start",
                    gap: 1,
                    borderRadius: 1.5,
                    px: 1.25,
                    py: 1,
                    color: item.destructive ? "#b42318" : active ? "#0d3f99" : "#334155",
                    border: active ? "1px solid rgba(17,85,204,.22)" : item.destructive ? "1px solid #fecaca" : "1px solid transparent",
                    bgcolor: active ? "rgba(17,85,204,.08)" : item.destructive ? "#fef2f2" : "transparent",
                    "&:hover": { bgcolor: item.destructive ? "#fee2e2" : active ? "rgba(17,85,204,.12)" : "#eef4ff", borderColor: item.destructive ? "#fca5a5" : "rgba(17,85,204,.16)" }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, mt: 0.2, color: item.destructive ? "#b42318" : active ? "#1155cc" : "#64748b" }}>
                    {item.icon}
                  </ListItemIcon>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1.2 }}>{item.label}</Typography>
                    <Typography sx={{ mt: 0.25, whiteSpace: "normal", fontSize: 11.5, fontWeight: 650, color: active ? "#385d9f" : "#64748b", lineHeight: 1.25 }}>
                      {item.description}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </MuiList>
        </Box>
      ))}
    </Box>
  );
}

function AdminGlobalAppBar() {
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.hash = `#/orders?filter=${encodeURIComponent(JSON.stringify({ q }))}`;
  }
  return (
    <RaAppBar sx={{ bgcolor: "#fff", color: adminColors.ink, borderBottom: `1px solid ${adminColors.border}`, boxShadow: "none" }}>
      <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 2, px: { xs: 1, md: 2 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 950, minWidth: { xs: 80, md: 160 } }}>DUD Admin</Typography>
        <Box component="form" onSubmit={submit} sx={{ flex: 1, maxWidth: 620 }}>
          <MuiTextField
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bestellungen, Produkte, Kunden, Rechnungen suchen..."
            fullWidth
          />
        </Box>
        <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 800, display: { xs: "none", sm: "block" } }}>Admin</Typography>
      </Box>
    </RaAppBar>
  );
}

function AdminLayout(props: any) {
  return (
    <Layout
      {...props}
      menu={AdminMenu}
      appBar={AdminGlobalAppBar}
      sx={{
        minWidth: 0,
        width: "100%",
        "& .RaLayout-appFrame": { minWidth: 0 },
        "& .RaLayout-contentWithSidebar": { minWidth: 0, width: "100%" },
        "& .RaLayout-content": { minWidth: 0, maxWidth: "100%", overflowX: "auto" },
        "& .RaSidebar-paper": { width: "292px !important", overflowX: "hidden" },
        "& .RaSidebar-fixed": { width: "292px", overflowX: "hidden" }
      }}
    />
  );
}

export function ReactAdminDashboard() {
  return (
    <div className="w-full min-w-0 bg-[#f3f6fb] text-[#0a1020]">
    <Admin dataProvider={dataProvider} dashboard={AdminDashboardHome} title="DUD Studio Admin" theme={adminTheme} layout={AdminLayout}>
      <CustomRoutes>
        <Route path="/tools/maintenance" element={<MaintenanceToolPage />} />
        <Route path="/tools/online-shop" element={<OnlineShopToolPage />} />
        <Route path="/tools/checkout-lock" element={<CheckoutLockToolPage />} />
        <Route path="/tools/vacation" element={<VacationToolPage />} />
        <Route path="/tools/email" element={<EmailConfigToolPage />} />
        <Route path="/tools/uploads" element={<UploadFoldersToolPage />} />
        <Route path="/tools/image-import" element={<CatalogImageImportToolPage />} />
        <Route path="/tools/catalog-csv" element={<CatalogCsvImportToolPage />} />
        <Route path="/tools/production-bindings" element={<ProductionBindingConfigToolPage />} />
        <Route path="/tools/homepage" element={<HomepageContentToolPage />} />
        <Route path="/tools/site-images" element={<SiteImagesToolPage />} />
        <Route path="/tools/backup" element={<BackupToolPage />} />
        <Route path="/tools/werbung" element={<WerbungToolPage />} />
        <Route path="/tools/settings" element={<SettingsToolPage />} />
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
      <Resource name="usersRoles" options={{ label: "Benutzer & Rollen" }} list={UsersRolesList} edit={UsersRolesEdit} create={UsersRolesCreate} icon={ManageAccountsIcon} />
    </Admin>
    </div>
  );
}
