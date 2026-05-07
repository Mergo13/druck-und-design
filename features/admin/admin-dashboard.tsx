"use client";

import { BarChart3, Edit3, FileText, FolderTree, Package, Plus, ReceiptText, Save, Settings, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { posts as seedPosts } from "@/data/products";
import { formatEuro } from "@/lib/utils";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

type AdminProduct = {
  slug: string;
  name: string;
  category: string;
  priceFrom: number;
  active: boolean;
  stockMode: "Verkauf aktiv" | "Pausiert" | "Nur Anfrage";
  image: string;
};

type AdminCategory = {
  slug: string;
  name: string;
  description: string;
  active: boolean;
};

type AdminPost = {
  slug: string;
  title: string;
  category: string;
  status: "Entwurf" | "Geplant" | "Veröffentlicht";
  excerpt: string;
};

type AdminOrder = {
  id: string;
  customer: string;
  total: number;
  status: "Neu" | "In Prüfung" | "In Produktion" | "Versendet";
};

type AdminInvoice = {
  id: string;
  customer: string;
  amount: number;
  status: "Offen" | "Bezahlt" | "Überfällig";
};

type AdminState = {
  products: AdminProduct[];
  categories: AdminCategory[];
  posts: AdminPost[];
  orders: AdminOrder[];
  invoices: AdminInvoice[];
  settings: {
    sellingEnabled: boolean;
    expressEnabled: boolean;
    invoicePrefix: string;
    taxRate: number;
  };
};

const emptyProduct: AdminProduct = {
  slug: "",
  name: "",
  category: "druckprodukte",
  priceFrom: 0,
  active: true,
  stockMode: "Verkauf aktiv",
  image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80"
};

const emptyCategory: AdminCategory = {
  slug: "",
  name: "",
  description: "",
  active: true
};

const emptyPost: AdminPost = {
  slug: "",
  title: "",
  category: "Druckwissen",
  status: "Entwurf",
  excerpt: ""
};

const seedState: AdminState = {
  products: [],
  categories: [],
  posts: seedPosts.map((post) => ({ slug: post.slug, title: post.title, category: post.category, status: "Veröffentlicht", excerpt: post.excerpt })),
  orders: [
    { id: "ORD-2026-1042", customer: "Muster GmbH", total: 248.9, status: "In Prüfung" },
    { id: "ORD-2026-1043", customer: "Studio Nord", total: 1190, status: "In Produktion" },
    { id: "ORD-2026-1044", customer: "Eventagentur Blau", total: 79, status: "Neu" }
  ],
  invoices: [
    { id: "RE-2026-881", customer: "Muster GmbH", amount: 248.9, status: "Offen" },
    { id: "RE-2026-882", customer: "Studio Nord", amount: 1190, status: "Bezahlt" }
  ],
  settings: {
    sellingEnabled: true,
    expressEnabled: true,
    invoicePrefix: "RE-2026",
    taxRate: 19
  }
};

const tabs = [
  ["Übersicht", BarChart3],
  ["Produkte", Package],
  ["Gruppen", FolderTree],
  ["News", FileText],
  ["Bestellungen", ShoppingCart],
  ["Rechnungen", ReceiptText],
  ["Einstellungen", Settings]
] as const;

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("Übersicht");
  const [state, setState] = useState<AdminState>(seedState);
  const [productDraft, setProductDraft] = useState<AdminProduct>(emptyProduct);
  const [categoryDraft, setCategoryDraft] = useState<AdminCategory>(emptyCategory);
  const [postDraft, setPostDraft] = useState<AdminPost>(emptyPost);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    void loadBackendState();
  }, []);

  const revenue = useMemo(() => state.orders.reduce((sum, order) => sum + order.total, 0), [state.orders]);
  const openInvoices = useMemo(() => state.invoices.filter((invoice) => invoice.status !== "Bezahlt").length, [state.invoices]);

  async function loadBackendState() {
    const [productsRes, categoriesRes] = await Promise.all([fetch("/api/catalog/products"), fetch("/api/catalog/categories")]);
    const products = await productsRes.json() as ProductCatalogItem[];
    const categories = await categoriesRes.json() as ProductCategory[];
    setState((current) => ({
      ...current,
      products: products.map((product) => ({ slug: product.slug, name: product.name, category: product.category, priceFrom: product.basePrice, active: true, stockMode: "Verkauf aktiv", image: product.heroImage })),
      categories: categories.map((category) => ({ ...category, active: true }))
    }));
  }

  async function upsertProduct() {
    if (!productDraft.slug || !productDraft.name) return;
    await fetch("/api/catalog/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toCatalogProduct(productDraft)) });
    await loadBackendState();
    setProductDraft(emptyProduct);
  }

  async function upsertCategory() {
    if (!categoryDraft.slug || !categoryDraft.name) return;
    await fetch("/api/catalog/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: categoryDraft.slug, name: categoryDraft.name, description: categoryDraft.description }) });
    await loadBackendState();
    setCategoryDraft(emptyCategory);
  }

  function upsertPost() {
    if (!postDraft.slug || !postDraft.title) return;
    setState((current) => ({
      ...current,
      posts: current.posts.some((item) => item.slug === postDraft.slug)
        ? current.posts.map((item) => (item.slug === postDraft.slug ? postDraft : item))
        : [postDraft, ...current.posts]
    }));
    setPostDraft(emptyPost);
  }

  async function uploadProductImage(file?: File) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: form });
      if (!res.ok) return;
      const data = await res.json() as { url: string };
      setProductDraft((current) => ({ ...current, image: data.url }));
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <section className="min-h-screen bg-brand-mist">
      <div className="container-page py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold text-brand-blue">Admin Console</p>
            <h1 className="mt-2 text-4xl font-black">Shop-Steuerung</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Demo-Backend für Katalog, Gruppen, News, Verkauf, Bestellungen, Rechnungen und globale Shop-Regeln.</p>
          </div>
          <Button onClick={() => void loadBackendState()} variant="outline">Neu laden</Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-lg border bg-white p-3 shadow-soft">
            {tabs.map(([label, Icon]) => (
              <button key={label} onClick={() => setActiveTab(label)} className={activeTab === label ? "flex w-full items-center gap-3 rounded-md bg-brand-blue px-4 py-3 text-left text-sm font-black text-white" : "flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-black text-slate-700 hover:bg-brand-mist"}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </aside>

          <div className="grid gap-6">
            {activeTab === "Übersicht" && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Metric label="Aktive Produkte" value={state.products.filter((item) => item.active).length.toString()} />
                  <Metric label="Umsatz Demo" value={formatEuro(revenue)} />
                  <Metric label="Offene Rechnungen" value={openInvoices.toString()} />
                  <Metric label="News-Beiträge" value={state.posts.length.toString()} />
                </div>
                <AdminPanel title="Operative Aufgaben">
                  <div className="grid gap-3 md:grid-cols-3">
                    {["Neue Druckdaten prüfen", "Rechnungslauf vorbereiten", "Express-Kapazität kontrollieren"].map((task) => <div className="rounded-lg border bg-white p-4 text-sm font-bold" key={task}>{task}</div>)}
                  </div>
                </AdminPanel>
              </>
            )}

            {activeTab === "Produkte" && (
              <AdminPanel title="Produkte erstellen, bearbeiten und löschen">
                <div className="grid gap-3 lg:grid-cols-5">
                  <Input placeholder="Slug" value={productDraft.slug} onChange={(event) => setProductDraft({ ...productDraft, slug: event.target.value })} />
                  <Input placeholder="Produktname" value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} />
                  <Input placeholder="Kategorie" value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} />
                  <Input placeholder="Preis ab" type="number" value={productDraft.priceFrom} onChange={(event) => setProductDraft({ ...productDraft, priceFrom: Number(event.target.value) })} />
                  <Button onClick={() => void upsertProduct()}><Plus className="h-4 w-4" /> Speichern</Button>
                </div>
                <Input className="mt-3" placeholder="Bild-URL von Unsplash/Pexels" value={productDraft.image} onChange={(event) => setProductDraft({ ...productDraft, image: event.target.value })} />
                <div className="mt-3 rounded-lg border bg-slate-50 p-4">
                  <label className="grid gap-2 text-sm font-bold">
                    Produktbild hochladen
                    <input type="file" accept="image/*" onChange={(event) => void uploadProductImage(event.target.files?.[0])} className="block w-full text-sm font-normal" />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">{uploadingImage ? "Upload läuft..." : "Nach Upload wird die Bild-URL automatisch ins Produkt übernommen."}</p>
                </div>
                <AdminTable rows={state.products.map((item) => [item.name, item.category, formatEuro(item.priceFrom), item.stockMode])} onEdit={(index) => setProductDraft(state.products[index])} onDelete={(index) => void deleteProduct(state.products[index].slug, loadBackendState)} />
              </AdminPanel>
            )}

            {activeTab === "Gruppen" && (
              <AdminPanel title="Produktgruppen und Kategorien">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                  <Input placeholder="Slug" value={categoryDraft.slug} onChange={(event) => setCategoryDraft({ ...categoryDraft, slug: event.target.value })} />
                  <Input placeholder="Name" value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} />
                  <Input placeholder="SEO-Beschreibung" value={categoryDraft.description} onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} />
                  <Button onClick={() => void upsertCategory()}><Save className="h-4 w-4" /> Speichern</Button>
                </div>
                <AdminTable rows={state.categories.map((item) => [item.name, item.slug, item.active ? "Aktiv" : "Inaktiv", item.description])} onEdit={(index) => setCategoryDraft(state.categories[index])} onDelete={(index) => void deleteCategory(state.categories[index].slug, loadBackendState)} />
              </AdminPanel>
            )}

            {activeTab === "News" && (
              <AdminPanel title="News schreiben und veröffentlichen">
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="Slug" value={postDraft.slug} onChange={(event) => setPostDraft({ ...postDraft, slug: event.target.value })} />
                  <Input placeholder="Titel" value={postDraft.title} onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })} />
                  <Input placeholder="Kategorie" value={postDraft.category} onChange={(event) => setPostDraft({ ...postDraft, category: event.target.value })} />
                  <select className="h-11 rounded-md border bg-white px-3 text-sm" value={postDraft.status} onChange={(event) => setPostDraft({ ...postDraft, status: event.target.value as AdminPost["status"] })}><option>Entwurf</option><option>Geplant</option><option>Veröffentlicht</option></select>
                </div>
                <textarea className="mt-3 min-h-28 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Kurztext oder Teaser" value={postDraft.excerpt} onChange={(event) => setPostDraft({ ...postDraft, excerpt: event.target.value })} />
                <Button className="mt-3" onClick={upsertPost}><Plus className="h-4 w-4" /> Beitrag speichern</Button>
                <AdminTable rows={state.posts.map((item) => [item.title, item.category, item.status, item.slug])} onEdit={(index) => setPostDraft(state.posts[index])} onDelete={(index) => setState({ ...state, posts: state.posts.filter((_, itemIndex) => itemIndex !== index) })} />
              </AdminPanel>
            )}

            {activeTab === "Bestellungen" && (
              <AdminPanel title="Bestellungen und Produktionsstatus">
                <AdminTable rows={state.orders.map((item) => [item.id, item.customer, formatEuro(item.total), item.status])} onEdit={(index) => setState({ ...state, orders: state.orders.map((item, itemIndex) => itemIndex === index ? { ...item, status: nextOrderStatus(item.status) } : item) })} onDelete={(index) => setState({ ...state, orders: state.orders.filter((_, itemIndex) => itemIndex !== index) })} editLabel="Status weiter" />
              </AdminPanel>
            )}

            {activeTab === "Rechnungen" && (
              <AdminPanel title="Rechnungen erstellen und kontrollieren">
                <Button onClick={() => setState({ ...state, invoices: [{ id: `${state.settings.invoicePrefix}-${900 + state.invoices.length}`, customer: "Neuer Kunde", amount: 0, status: "Offen" }, ...state.invoices] })}><Plus className="h-4 w-4" /> Rechnung erstellen</Button>
                <AdminTable rows={state.invoices.map((item) => [item.id, item.customer, formatEuro(item.amount), item.status])} onEdit={(index) => setState({ ...state, invoices: state.invoices.map((item, itemIndex) => itemIndex === index ? { ...item, status: item.status === "Bezahlt" ? "Offen" : "Bezahlt" } : item) })} onDelete={(index) => setState({ ...state, invoices: state.invoices.filter((_, itemIndex) => itemIndex !== index) })} editLabel="Bezahlt umschalten" />
              </AdminPanel>
            )}

            {activeTab === "Einstellungen" && (
              <AdminPanel title="Verkauf, Steuern und Checkout">
                <div className="grid gap-4 md:grid-cols-2">
                  <Toggle label="Verkauf aktiv" checked={state.settings.sellingEnabled} onChange={() => setState({ ...state, settings: { ...state.settings, sellingEnabled: !state.settings.sellingEnabled } })} />
                  <Toggle label="Express-Produktion aktiv" checked={state.settings.expressEnabled} onChange={() => setState({ ...state, settings: { ...state.settings, expressEnabled: !state.settings.expressEnabled } })} />
                  <label className="grid gap-2 text-sm font-bold">Rechnungspräfix<Input value={state.settings.invoicePrefix} onChange={(event) => setState({ ...state, settings: { ...state.settings, invoicePrefix: event.target.value } })} /></label>
                  <label className="grid gap-2 text-sm font-bold">MwSt. in Prozent<Input type="number" value={state.settings.taxRate} onChange={(event) => setState({ ...state, settings: { ...state.settings, taxRate: Number(event.target.value) } })} /></label>
                </div>
              </AdminPanel>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-5 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

async function deleteProduct(slug: string, onDone: () => Promise<void>) {
  await fetch(`/api/catalog/products/${slug}`, { method: "DELETE" });
  await onDone();
}

async function deleteCategory(slug: string, onDone: () => Promise<void>) {
  await fetch(`/api/catalog/categories/${slug}`, { method: "DELETE" });
  await onDone();
}

function toCatalogProduct(input: AdminProduct): ProductCatalogItem {
  return {
    slug: input.slug,
    name: input.name,
    category: input.category as ProductCatalogItem["category"],
    short: `${input.name} für professionelle Printproduktion.`,
    description: `${input.name} mit konfigurierbaren Optionen und Produktionsworkflow.`,
    seo: `${input.name} online konfigurieren, prüfen und drucken lassen.`,
    heroImage: input.image,
    gallery: [input.image],
    rating: 4.8,
    basePrice: input.priceFrom,
    deliveryText: "2-5 Werktage",
    tags: ["Neu"],
    variants: [
      {
        id: `${input.slug}-standard`,
        name: "Standard",
        skuPrefix: input.slug.toUpperCase().slice(0, 8),
        attributes: [{ key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 19 }] }],
        quantityRule: { min: 1, max: 10000, step: 1 },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: input.priceFrom }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: 0.1 }]
      }
    ],
    production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
  };
}

function AdminPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-white p-5 shadow-soft"><h2 className="text-xl font-black">{title}</h2><div className="mt-5">{children}</div></section>;
}

function AdminTable({ rows, onEdit, onDelete, editLabel = "Bearbeiten" }: { rows: string[][]; onEdit: (index: number) => void; onDelete: (index: number) => void; editLabel?: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border">
      {rows.map((row, index) => (
        <div className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" key={`${row[0]}-${index}`}>
          {row.map((cell) => <span className="text-sm" key={cell}>{cell}</span>)}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(index)}><Edit3 className="h-4 w-4" /> {editLabel}</Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(index)}><Trash2 className="h-4 w-4" /> Löschen</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button onClick={onChange} className="flex items-center justify-between rounded-lg border p-4 text-left font-bold"><span>{label}</span><span className={checked ? "rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-800" : "rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"}>{checked ? "Ein" : "Aus"}</span></button>;
}

function nextOrderStatus(status: AdminOrder["status"]): AdminOrder["status"] {
  const statuses: AdminOrder["status"][] = ["Neu", "In Prüfung", "In Produktion", "Versendet"];
  return statuses[(statuses.indexOf(status) + 1) % statuses.length];
}
