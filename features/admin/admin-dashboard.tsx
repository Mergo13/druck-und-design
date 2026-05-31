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
  short: string;
  description: string;
  priceFrom: number;
  unitPrice: number;
  quantityStepsCsv: string;
  propertyTemplate: string;
  active: boolean;
  stockMode: "Verkauf aktiv" | "Pausiert" | "Nur Anfrage";
  image: string;
};

type AdminCategory = {
  slug: string;
  name: string;
  description: string;
  quantityStepsCsv: string;
  defaultPropertyTemplate: string;
  logo: string;
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
    clientLogos: string[];
  };
};

const emptyProduct: AdminProduct = {
  slug: "",
  name: "",
  category: "druckprodukte",
  short: "",
  description: "",
  priceFrom: 0,
  unitPrice: 0.1,
  quantityStepsCsv: "1, 10, 100, 1000, 2500, 5000, 10000",
  propertyTemplate: "print-basic",
  active: true,
  stockMode: "Verkauf aktiv",
  image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80"
};

const emptyCategory: AdminCategory = {
  slug: "",
  name: "",
  description: "",
  quantityStepsCsv: "1, 10, 100, 1000, 2500, 5000, 10000",
  defaultPropertyTemplate: "print-basic",
  logo: "",
  active: true
};

const defaultQuantitySteps = [1, 10, 100, 1000, 2500, 5000, 10000];

const propertyTemplates: Array<{ key: string; label: string }> = [
  { key: "print-basic", label: "Print Standard (Material, Grammatur, Veredelung, Lieferzeit)" },
  { key: "large-format", label: "Werbetechnik (Material, Größe, Konfektion, Lieferzeit)" },
  { key: "textile", label: "Textil (Verfahren, Farbe, Größe, Lieferzeit)" },
  { key: "sticker", label: "Aufkleber (Material, Form, Haltbarkeit, Lieferzeit)" },
  { key: "marketing-service", label: "Marketing Service (Paket, Laufzeit, Kanal)" }
];

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
    taxRate: 19,
    clientLogos: ["/brand/logo-dud.png", "/demo/flyer.svg", "/demo/rollup.svg"]
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
  const [uploadingCategoryLogo, setUploadingCategoryLogo] = useState(false);
  const [uploadingClientLogo, setUploadingClientLogo] = useState(false);
  const [productStatus, setProductStatus] = useState<string>("");
  const [productError, setProductError] = useState<string>("");
  const [categoryStatus, setCategoryStatus] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");
  const [settingsStatus, setSettingsStatus] = useState<string>("");
  const [settingsError, setSettingsError] = useState<string>("");
  const [previewNonce, setPreviewNonce] = useState(0);
  const categoryOptions = useMemo(() => state.categories.map((item) => item.slug), [state.categories]);
  const autoCategory = useMemo(() => suggestCategory(productDraft.name, categoryOptions), [categoryOptions, productDraft.name]);

  useEffect(() => {
    void loadBackendState();
  }, []);

  const revenue = useMemo(() => state.orders.reduce((sum, order) => sum + order.total, 0), [state.orders]);
  const openInvoices = useMemo(() => state.invoices.filter((invoice) => invoice.status !== "Bezahlt").length, [state.invoices]);

  async function loadBackendState() {
    const [productsRes, categoriesRes, ordersRes, logosRes] = await Promise.all([
      fetch("/api/catalog/products"),
      fetch("/api/catalog/categories"),
      fetch("/api/orders"),
      fetch("/api/settings/client-logos")
    ]);
    const products = await productsRes.json() as ProductCatalogItem[];
    const categories = await categoriesRes.json() as ProductCategory[];
    const backendOrders = await ordersRes.json() as any[];
    const clientLogos = await logosRes.json() as string[];

    setState((current) => ({
      ...current,
      products: products.map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category,
        short: product.short,
        description: product.description,
        priceFrom: product.basePrice,
        unitPrice: product.variants[0]?.priceRules.find((rule) => rule.key === "auflage")?.amount ?? 0,
        quantityStepsCsv: toStepsCsv(product.quantitySteps ?? [product.variants[0]?.quantityRule.min ?? 1]),
        propertyTemplate: product.propertyTemplate ?? "print-basic",
        active: true,
        stockMode: "Verkauf aktiv",
        image: product.heroImage
      })),
      categories: categories.map((category) => ({
        ...category,
        quantityStepsCsv: toStepsCsv(category.quantitySteps ?? defaultQuantitySteps),
        defaultPropertyTemplate: category.defaultPropertyTemplate ?? "print-basic",
        logo: category.logo ?? "",
        active: true
      })),
      orders: backendOrders.length > 0 ? backendOrders.map(o => ({
        ...o,
        customer: o.customer || "Kunde " + o.id.split('-').pop(),
        total: o.total,
        status: o.status || "Neu"
      })) : current.orders,
      settings: { ...current.settings, clientLogos }
    }));
  }

  async function upsertProduct() {
    if (uploadingImage) {
      setProductError("Bitte warten Sie, bis der Bild-Upload abgeschlossen ist.");
      return;
    }
    if (!productDraft.slug || !productDraft.name) {
      setProductError("Slug und Produktname sind Pflichtfelder.");
      return;
    }
    if (!categoryOptions.includes(productDraft.category)) {
      setProductError("Bitte eine gültige Kategorie auswählen.");
      return;
    }
    setProductError("");
    setProductStatus("");
    const steps = parseStepsCsv(productDraft.quantityStepsCsv);
    if (!steps.length) {
      setProductError("Bitte gültige Mengenstufen angeben, z.B. 1, 10, 25, 50.");
      return;
    }
    const response = await fetch("/api/catalog/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toCatalogProduct(productDraft, steps)) });
    if (!response.ok) {
      setProductError("Produkt konnte nicht gespeichert werden.");
      return;
    }
    await loadBackendState();
    setProductStatus(`Produkt gespeichert: ${productDraft.slug}`);
    setPreviewNonce((current) => current + 1);
    setProductDraft(emptyProduct);
  }

  async function upsertCategory() {
    if (uploadingCategoryLogo) {
      setCategoryError("Bitte warten Sie, bis der Logo-Upload abgeschlossen ist.");
      return;
    }
    if (!categoryDraft.slug || !categoryDraft.name) return;
    setCategoryStatus("");
    setCategoryError("");
    const steps = parseStepsCsv(categoryDraft.quantityStepsCsv);
    if (!steps.length) return;
    await fetch("/api/catalog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: categoryDraft.slug,
        name: categoryDraft.name,
        description: categoryDraft.description,
        quantitySteps: steps,
        defaultPropertyTemplate: categoryDraft.defaultPropertyTemplate,
        logo: categoryDraft.logo
      })
    });
    await loadBackendState();
    setCategoryStatus(`Kategorie gespeichert: ${categoryDraft.slug}`);
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
    setProductError("");
    setProductStatus("");
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: form });
      if (!res.ok) {
        setProductError("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
        return;
      }
      const data = await res.json() as { url: string };
      setProductDraft((current) => ({ ...current, image: data.url }));
      setPreviewNonce((current) => current + 1);
      setProductStatus("Bild hochgeladen. Bitte auf Speichern klicken.");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleEditProduct(index: number) {
    setProductError("");
    setProductStatus("");
    setProductDraft(state.products[index]);
    setPreviewNonce((current) => current + 1);
  }

  function applyCategoryDefaults() {
    const selectedCategory = state.categories.find((item) => item.slug === productDraft.category);
    if (!selectedCategory) return;
    setProductDraft((current) => ({
      ...current,
      quantityStepsCsv: selectedCategory.quantityStepsCsv,
      propertyTemplate: selectedCategory.defaultPropertyTemplate
    }));
  }

  async function uploadCategoryLogo(file?: File) {
    if (!file) return;
    setCategoryStatus("");
    setCategoryError("");
    setUploadingCategoryLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: form });
      if (!res.ok) {
        setCategoryError("Logo-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
        return;
      }
      const data = await res.json() as { url: string };
      setCategoryDraft((current) => ({ ...current, logo: data.url }));
      setPreviewNonce((current) => current + 1);
      setCategoryStatus("Logo hochgeladen. Bitte auf Speichern klicken.");
    } finally {
      setUploadingCategoryLogo(false);
    }
  }

  async function uploadClientLogo(file?: File) {
    if (!file) return;
    setSettingsError("");
    setSettingsStatus("");
    setUploadingClientLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body: form });
      if (!res.ok) {
        setSettingsError("Logo-Upload fehlgeschlagen.");
        return;
      }
      const data = await res.json() as { url: string };
      const nextLogos = [...state.settings.clientLogos, data.url].filter(Boolean);
      setState((current) => ({
        ...current,
        settings: { ...current.settings, clientLogos: nextLogos }
      }));
      const saveRes = await fetch("/api/settings/client-logos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logos: nextLogos })
      });
      if (!saveRes.ok) {
        setSettingsError("Logo wurde hochgeladen, aber nicht gespeichert.");
        return;
      }
      setSettingsStatus("Logo hochgeladen und gespeichert.");
    } finally {
      setUploadingClientLogo(false);
    }
  }

  async function saveClientLogosSettings() {
    setSettingsError("");
    setSettingsStatus("");
    const logos = state.settings.clientLogos.map((item) => item.trim()).filter(Boolean);
    const res = await fetch("/api/settings/client-logos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logos })
    });
    if (!res.ok) {
      setSettingsError("Kundenlogos konnten nicht gespeichert werden.");
      return;
    }
    setSettingsStatus("Kundenlogos gespeichert.");
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
                  <select
                    suppressHydrationWarning
                    className="h-11 rounded-md border bg-white px-3 text-sm"
                    value={productDraft.category}
                    onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })}
                  >
                    {state.categories.map((category) => (
                      <option key={category.slug} value={category.slug}>{category.name} ({category.slug})</option>
                    ))}
                  </select>
                  <Input placeholder="Preis ab" type="number" value={productDraft.priceFrom} onChange={(event) => setProductDraft({ ...productDraft, priceFrom: Number(event.target.value) })} />
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <Input placeholder="Preis je Stück (Auflagenfaktor)" type="number" step="0.01" value={productDraft.unitPrice} onChange={(event) => setProductDraft({ ...productDraft, unitPrice: Number(event.target.value) })} />
                  <Button onClick={() => void upsertProduct()} disabled={uploadingImage}><Plus className="h-4 w-4" /> Speichern</Button>
                </div>
                <Input className="mt-3" placeholder="Kurzbeschreibung" value={productDraft.short} onChange={(event) => setProductDraft({ ...productDraft, short: event.target.value })} />
                <textarea
                  className="mt-3 min-h-24 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Produktbeschreibung"
                  value={productDraft.description}
                  onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })}
                />
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <Input placeholder="Mengenstufen (z.B. 1,10,25,50,100,1000)" value={productDraft.quantityStepsCsv} onChange={(event) => setProductDraft({ ...productDraft, quantityStepsCsv: event.target.value })} />
                  <select suppressHydrationWarning className="h-11 rounded-md border bg-white px-3 text-sm" value={productDraft.propertyTemplate} onChange={(event) => setProductDraft({ ...productDraft, propertyTemplate: event.target.value })}>
                    {propertyTemplates.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
                  </select>
                  <Button type="button" variant="outline" onClick={applyCategoryDefaults}>Kategorie-Standard übernehmen</Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-bold">Auto-Kategorie:</span>
                  <span className="rounded-full bg-white px-3 py-1">{autoCategory ?? "Keine klare Zuordnung"}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!autoCategory}
                    onClick={() => autoCategory && setProductDraft({ ...productDraft, category: autoCategory })}
                  >
                    Automatisch übernehmen
                  </Button>
                </div>
                <Input className="mt-3" placeholder="Bild-URL von Unsplash/Pexels" value={productDraft.image} onChange={(event) => setProductDraft({ ...productDraft, image: event.target.value })} />
                {productDraft.image ? (
                  <div className="mt-3 overflow-hidden rounded-lg border bg-white">
                    <img src={`${productDraft.image}${productDraft.image.startsWith("/uploads/") ? `?v=${previewNonce}` : ""}`} alt="Produktbild Vorschau" className="h-40 w-full object-cover" />
                  </div>
                ) : null}
                <div className="mt-3 rounded-lg border bg-slate-50 p-4">
                  <label className="grid gap-2 text-sm font-bold">
                    Produktbild hochladen
                    <input suppressHydrationWarning type="file" accept="image/*" onChange={(event) => void uploadProductImage(event.target.files?.[0])} className="block w-full text-sm font-normal" />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">{uploadingImage ? "Upload läuft..." : "Nach Upload wird die Bild-URL automatisch ins Produkt übernommen."}</p>
                </div>
                {productStatus ? <p className="mt-3 text-sm font-bold text-emerald-700">{productStatus}</p> : null}
                {productError ? <p className="mt-3 text-sm font-bold text-red-700">{productError}</p> : null}
                <AdminTable rows={state.products.map((item) => [item.name, item.category, `${formatEuro(item.priceFrom)} + ${formatEuro(item.unitPrice)}/Stk`, item.stockMode])} onEdit={handleEditProduct} onDelete={(index) => void deleteProduct(state.products[index].slug, loadBackendState)} />
              </AdminPanel>
            )}

            {activeTab === "Gruppen" && (
              <AdminPanel title="Produktgruppen und Kategorien">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Slug" value={categoryDraft.slug} onChange={(event) => setCategoryDraft({ ...categoryDraft, slug: event.target.value })} />
                  <Input placeholder="Name" value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} />
                  <Input placeholder="SEO-Beschreibung" value={categoryDraft.description} onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} />
                  <Input placeholder="Kategorie-Mengenstufen (z.B. 1,10,25,50...)" value={categoryDraft.quantityStepsCsv} onChange={(event) => setCategoryDraft({ ...categoryDraft, quantityStepsCsv: event.target.value })} />
                  <Input placeholder="Logo-URL (für Homepage-Marquee)" value={categoryDraft.logo} onChange={(event) => setCategoryDraft({ ...categoryDraft, logo: event.target.value })} />
                  <select suppressHydrationWarning className="h-11 rounded-md border bg-white px-3 text-sm" value={categoryDraft.defaultPropertyTemplate} onChange={(event) => setCategoryDraft({ ...categoryDraft, defaultPropertyTemplate: event.target.value })}>
                    {propertyTemplates.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
                  </select>
                  <Button onClick={() => void upsertCategory()}><Save className="h-4 w-4" /> Speichern</Button>
                </div>
                {categoryDraft.logo ? (
                  <div className="mt-3 overflow-hidden rounded-lg border bg-white p-4">
                    <img src={`${categoryDraft.logo}${categoryDraft.logo.startsWith("/uploads/") ? `?v=${previewNonce}` : ""}`} alt="Logo Vorschau" className="h-16 w-auto object-contain" />
                  </div>
                ) : null}
                <div className="mt-3 rounded-lg border bg-slate-50 p-4">
                  <label className="grid gap-2 text-sm font-bold">
                    Kategorie-Logo hochladen
                    <input suppressHydrationWarning type="file" accept="image/*" onChange={(event) => void uploadCategoryLogo(event.target.files?.[0])} className="block w-full text-sm font-normal" />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">{uploadingCategoryLogo ? "Upload läuft..." : "Nach Upload wird die Logo-URL automatisch ins Feld übernommen."}</p>
                </div>
                {categoryStatus ? <p className="mt-3 text-sm font-bold text-emerald-700">{categoryStatus}</p> : null}
                {categoryError ? <p className="mt-3 text-sm font-bold text-red-700">{categoryError}</p> : null}
                <AdminTable rows={state.categories.map((item) => [item.name, item.slug, item.quantityStepsCsv, item.defaultPropertyTemplate, item.logo ? "Logo gesetzt" : "Kein Logo"])} onEdit={(index) => setCategoryDraft(state.categories[index])} onDelete={(index) => void deleteCategory(state.categories[index].slug, loadBackendState)} />
              </AdminPanel>
            )}

            {activeTab === "News" && (
              <AdminPanel title="News schreiben und veröffentlichen">
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="Slug" value={postDraft.slug} onChange={(event) => setPostDraft({ ...postDraft, slug: event.target.value })} />
                  <Input placeholder="Titel" value={postDraft.title} onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })} />
                  <Input placeholder="Kategorie" value={postDraft.category} onChange={(event) => setPostDraft({ ...postDraft, category: event.target.value })} />
                  <select suppressHydrationWarning className="h-11 rounded-md border bg-white px-3 text-sm" value={postDraft.status} onChange={(event) => setPostDraft({ ...postDraft, status: event.target.value as AdminPost["status"] })}><option>Entwurf</option><option>Geplant</option><option>Veröffentlicht</option></select>
                </div>
                <textarea className="mt-3 min-h-28 w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Kurztext oder Teaser" value={postDraft.excerpt} onChange={(event) => setPostDraft({ ...postDraft, excerpt: event.target.value })} />
                <Button className="mt-3" onClick={upsertPost}><Plus className="h-4 w-4" /> Beitrag speichern</Button>
                <AdminTable rows={state.posts.map((item) => [item.title, item.category, item.status, item.slug])} onEdit={(index) => setPostDraft(state.posts[index])} onDelete={(index) => setState({ ...state, posts: state.posts.filter((_, itemIndex) => itemIndex !== index) })} />
              </AdminPanel>
            )}

            {activeTab === "Bestellungen" && (
              <AdminPanel title="Bestellungen und Produktionsstatus">
                <AdminTable 
                  rows={state.orders.map((item) => [item.id, item.customer, formatEuro(item.total), item.status])} 
                  onEdit={async (index) => {
                    const order = state.orders[index];
                    const nextStatus = nextOrderStatus(order.status);
                    const updatedOrder = { ...order, status: nextStatus };
                    
                    // Sync update to backend
                    await fetch("/api/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updatedOrder)
                    });
                    
                    setState({ ...state, orders: state.orders.map((item, itemIndex) => itemIndex === index ? updatedOrder : item) });
                  }} 
                  onDelete={async (index) => {
                    const orderId = state.orders[index].id;
                    await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
                    setState({ ...state, orders: state.orders.filter((_, itemIndex) => itemIndex !== index) });
                  }} 
                  editLabel="Status weiter" 
                />
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

function toCatalogProduct(input: AdminProduct, quantitySteps: number[]): ProductCatalogItem {
  const minStep = quantitySteps[0] ?? 1;
  const maxStep = quantitySteps[quantitySteps.length - 1] ?? 10000;
  const normalizedMax = maxStep < minStep ? minStep : maxStep;
  return {
    slug: input.slug,
    name: input.name,
    category: input.category as ProductCatalogItem["category"],
    short: input.short || `${input.name} für professionelle Printproduktion.`,
    description: input.description || `${input.name} mit konfigurierbaren Optionen und Produktionsworkflow.`,
    seo: `${input.name} online konfigurieren, prüfen und drucken lassen.`,
    heroImage: input.image,
    gallery: [input.image],
    rating: 4.8,
    basePrice: input.priceFrom,
    deliveryText: "2-5 Werktage",
    tags: ["Neu"],
    quantitySteps,
    propertyTemplate: input.propertyTemplate,
    variants: [
      {
        id: `${input.slug}-standard`,
        name: "Standard",
        skuPrefix: input.slug.toUpperCase().slice(0, 8),
        attributes: buildAttributesByTemplate(input.propertyTemplate),
        quantityRule: { min: minStep, max: normalizedMax, step: minStep },
        priceRules: [{ key: "basis", label: "Basispreis", type: "fixed", amount: input.priceFrom }, { key: "auflage", label: "Auflagenfaktor", type: "per-unit", amount: input.unitPrice }]
      }
    ],
    production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
  };
}

function suggestCategory(name: string, categories: string[]) {
  const lowerName = name.toLowerCase();
  const checks: Array<{ slug: string; keywords: string[] }> = [
    { slug: "druckprodukte", keywords: ["flyer", "visitenkarte", "brosch", "karte", "druck", "plakat", "folder"] },
    { slug: "werbetechnik", keywords: ["roll-up", "rollup", "banner", "display", "schild", "messe", "werbe"] },
    { slug: "kleidung-textilien", keywords: ["textil", "shirt", "hoodie", "polo", "jacke", "workwear", "stick"] },
    { slug: "aufkleber", keywords: ["aufkleber", "sticker", "etikett", "folie", "label"] },
    { slug: "digitales-marketing", keywords: ["social", "seo", "ads", "google", "meta", "kampagne", "marketing"] },
    { slug: "same-day", keywords: ["same day", "sameday", "heute", "24h", "express heute"] },
    { slug: "direct-mailings", keywords: ["mailing", "brief", "postwurf", "adressiert", "kuvert"] }
  ];

  for (const entry of checks) {
    if (!categories.includes(entry.slug)) continue;
    if (entry.keywords.some((keyword) => lowerName.includes(keyword))) return entry.slug;
  }

  return categories.includes("druckprodukte") ? "druckprodukte" : categories[0];
}

function parseStepsCsv(value: string) {
  const steps = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  return Array.from(new Set(steps)).sort((a, b) => a - b);
}

function toStepsCsv(steps: number[]) {
  return steps.join(", ");
}

function buildAttributesByTemplate(template: string): ProductCatalogItem["variants"][number]["attributes"] {
  if (template === "large-format") {
    return [
      { key: "material", label: "Material", type: "select", required: true, defaultValue: "pvc", options: [{ value: "pvc", label: "PVC 510 g/m²" }, { value: "mesh", label: "Mesh", priceModifier: 12 }] },
      { key: "groesse", label: "Größe", type: "select", required: true, defaultValue: "85x200", options: [{ value: "85x200", label: "85x200 cm" }, { value: "100x220", label: "100x220 cm", priceModifier: 15 }] },
      { key: "konfektion", label: "Konfektion", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "oese", label: "Ösen", priceModifier: 8 }] },
      { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 29 }] }
    ];
  }

  if (template === "textile") {
    return [
      { key: "verfahren", label: "Druckverfahren", type: "select", required: true, defaultValue: "dtf", options: [{ value: "dtf", label: "DTF" }, { value: "siebdruck", label: "Siebdruck", priceModifier: 22 }] },
      { key: "farbe", label: "Textilfarbe", type: "select", required: true, defaultValue: "schwarz", options: [{ value: "schwarz", label: "Schwarz" }, { value: "weiss", label: "Weiß" }, { value: "navy", label: "Navy" }] },
      { key: "groesse", label: "Größe", type: "select", required: true, defaultValue: "m", options: [{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }, { value: "xl", label: "XL", priceModifier: 2 }] },
      { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 25 }] }
    ];
  }

  if (template === "sticker") {
    return [
      { key: "material", label: "Material", type: "select", required: true, defaultValue: "weiss", options: [{ value: "weiss", label: "Weißfolie" }, { value: "transparent", label: "Transparente Folie", priceModifier: 5 }] },
      { key: "form", label: "Form", type: "select", required: true, defaultValue: "rund", options: [{ value: "rund", label: "Rund" }, { value: "kontur", label: "Kontur", priceModifier: 7 }] },
      { key: "haltbarkeit", label: "Haltbarkeit", type: "select", required: true, defaultValue: "innen", options: [{ value: "innen", label: "Innen" }, { value: "aussen", label: "Außen", priceModifier: 6 }] },
      { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 19 }] }
    ];
  }

  if (template === "marketing-service") {
    return [
      { key: "paket", label: "Paket", type: "select", required: true, defaultValue: "starter", options: [{ value: "starter", label: "Starter" }, { value: "pro", label: "Pro", priceModifier: 250 }] },
      { key: "laufzeit", label: "Laufzeit", type: "select", required: true, defaultValue: "1", options: [{ value: "1", label: "1 Monat" }, { value: "3", label: "3 Monate", priceModifier: 500 }] },
      { key: "kanal", label: "Kanal", type: "select", required: true, defaultValue: "social", options: [{ value: "social", label: "Social Media" }, { value: "seo", label: "SEO + Content", priceModifier: 180 }] }
    ];
  }

  return [
    { key: "material", label: "Material", type: "select", required: true, defaultValue: "bd-matt", options: [{ value: "bd-matt", label: "Bilderdruck matt" }, { value: "bd-glanz", label: "Bilderdruck glänzend" }, { value: "recycling", label: "Recyclingpapier", priceModifier: 3 }] },
    { key: "grammatur", label: "Grammatur", type: "select", required: true, defaultValue: "170", options: [{ value: "135", label: "135 g/m²" }, { value: "170", label: "170 g/m²" }, { value: "250", label: "250 g/m²", priceModifier: 5 }] },
    { key: "veredelung", label: "Veredelung", type: "select", required: true, defaultValue: "keine", options: [{ value: "keine", label: "Keine" }, { value: "softtouch", label: "Softtouch", priceModifier: 12 }, { value: "heissfolie", label: "Heißfolie Gold", priceModifier: 39 }] },
    { key: "lieferzeit", label: "Lieferzeit", type: "select", required: true, defaultValue: "standard", options: [{ value: "standard", label: "Standard" }, { value: "express", label: "Express", priceModifier: 19 }, { value: "sameday", label: "Same Day", priceModifier: 45 }] }
  ];
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
