"use client";

import { ArrowLeft, Copy, Eye, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addAdminRecent } from "@/components/admin/admin-recents";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateConfiguredProductPrice, validateProductPricing } from "@/lib/print-workflow";
import type { GlobalProperty, ProductCatalogItem, ProductCategory, ProductPricingProperty, ProductPropertyPriceMode, ProductPropertyValue } from "@/types/print-platform";

type ProductEditPageProps = {
  slug: string;
};

function emptyProduct(): ProductCatalogItem {
  return {
    slug: "",
    name: "",
    category: "",
    visible: false,
    published: false,
    short: "",
    description: "",
    seo: "",
    heroImage: "",
    gallery: [],
    rating: 5,
    basePrice: 0,
    pricingType: "fixed",
    deliveryText: "",
    tags: [],
    variants: [],
    production: {
      baseProductionDays: 3,
      expressAvailable: false,
      preflightProfile: "standard-print",
      renderPipeline: "pdf-x4"
    },
    priceTiers: [{ quantity: 1, price: 0 }],
    pricingProperties: [],
    productStatus: "draft",
    industrySlugs: []
  };
}

export function ProductEditPage({ slug }: ProductEditPageProps) {
  const isNew = slug === "new";
  const [product, setProduct] = useState<ProductCatalogItem>(emptyProduct());
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [globalProperties, setGlobalProperties] = useState<GlobalProperty[]>([]);
  const [advancedJson, setAdvancedJson] = useState("");
  const [savedJson, setSavedJson] = useState("");
  const [previewQuantity, setPreviewQuantity] = useState(500);
  const [previewConfig, setPreviewConfig] = useState<Record<string, string>>({});
  const [vatPercent, setVatPercent] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");
      const categoriesRes = await fetch("/api/catalog/categories?scope=admin");
      const nextCategories = categoriesRes.ok ? await categoriesRes.json() as ProductCategory[] : [];
      const propertiesRes = await fetch("/api/catalog/properties");
      const nextProperties = propertiesRes.ok ? await propertiesRes.json() as GlobalProperty[] : [];
      const statsRes = await fetch("/api/admin/stats?period=30d");
      if (statsRes.ok) {
        const stats = await statsRes.json() as { vatPercent?: number };
        if (Number.isFinite(Number(stats.vatPercent))) setVatPercent(Number(stats.vatPercent));
      }
      setCategories(nextCategories);
      setGlobalProperties(nextProperties);
      if (isNew) {
        const next = { ...emptyProduct(), category: nextCategories[0]?.slug ?? "" };
        setProduct(next);
        syncJson(next, true);
      } else {
        const productRes = await fetch(`/api/catalog/products/${encodeURIComponent(slug)}?scope=admin`);
        if (!productRes.ok) {
      setMessage("Produkt konnte nicht geladen werden.");
        } else {
          const nextProduct = await productRes.json() as ProductCatalogItem;
          setProduct(nextProduct);
          syncJson(nextProduct, true);
          addAdminRecent({
            id: nextProduct.slug,
            type: "Produkt",
            label: nextProduct.name,
            href: `/admin/catalog/products/${encodeURIComponent(nextProduct.slug)}`,
            subtitle: nextProduct.slug
          });
        }
      }
      setLoading(false);
    }
    void load();
  }, [isNew, slug]);

  const status = useMemo(() => product.productStatus ?? (product.visible === false || product.published === false ? "inactive" : "active"), [product]);
  const dirty = advancedJson !== savedJson;
  const pricingErrors = useMemo(() => validateProductPricing(product), [product]);
  const preview = useMemo(() => calculateConfiguredProductPrice(product, previewQuantity, previewConfig), [previewConfig, previewQuantity, product]);
  const previewVat = Math.round(preview.total * (vatPercent / 100) * 100) / 100;

  useEffect(() => {
    const defaults = Object.fromEntries((product.pricingProperties ?? []).map((property) => {
      const selected = property.values.find((value) => value.defaultSelected && value.enabled !== false) ?? property.values.find((value) => value.enabled !== false);
      return [`eigenschaft:${property.name}`, selected?.value ?? ""];
    }).filter(([, value]) => value));
    setPreviewConfig(defaults);
  }, [product.slug, product.pricingProperties]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dirty, advancedJson]);

  function syncJson(next: ProductCatalogItem, markSaved = false) {
    const serialized = JSON.stringify(next, null, 2);
    setAdvancedJson(serialized);
    if (markSaved) setSavedJson(serialized);
  }

  function update<K extends keyof ProductCatalogItem>(key: K, value: ProductCatalogItem[K]) {
    setProduct((current) => {
      const next = { ...current, [key]: value };
      syncJson(next);
      return next;
    });
  }

  function updateExtra(key: string, value: unknown) {
    setProduct((current) => {
      const next = { ...(current as ProductCatalogItem & Record<string, unknown>), [key]: value } as ProductCatalogItem;
      syncJson(next);
      return next;
    });
  }

  const productRecord = product as ProductCatalogItem & Record<string, unknown>;
  const pricingGuards = (productRecord.pricingGuards && typeof productRecord.pricingGuards === "object" ? productRecord.pricingGuards : {}) as Record<string, unknown>;
  const areaPricing = (productRecord.areaPricing && typeof productRecord.areaPricing === "object" ? productRecord.areaPricing : {}) as Record<string, unknown>;
  const production = (product.production ?? emptyProduct().production) as ProductCatalogItem["production"];

  function updateGuard(key: string, value: string | number) {
    updateExtra("pricingGuards", { ...pricingGuards, [key]: value === "" ? undefined : value });
  }

  function updateArea(key: string, value: string | number) {
    updateExtra("areaPricing", { ...areaPricing, [key]: value === "" ? undefined : value });
  }

  function updateProduction(key: string, value: string | number | boolean) {
    update("production", { ...production, [key]: value });
  }

  function updateTier(index: number, key: "fromQuantity" | "toQuantity" | "unitPrice", value: number | undefined) {
    const nextTiers = [...(product.priceTiers ?? [])];
    const current = nextTiers[index] ?? { quantity: 1, price: 0 };
    const fromQuantity = key === "fromQuantity" ? Number(value ?? 1) : Number(current.fromQuantity ?? current.quantity ?? 1);
    const toQuantity = key === "toQuantity" ? value : current.toQuantity;
    const unitPrice = key === "unitPrice" ? Number(value ?? 0) : Number(current.unitPrice ?? current.price ?? 0);
    nextTiers[index] = {
      ...current,
      quantity: fromQuantity,
      fromQuantity,
      toQuantity,
      unitPrice,
      price: product.tierPriceMode === "totalPrice" ? unitPrice : unitPrice
    };
    update("priceTiers", nextTiers);
  }

  function addTier(afterIndex?: number) {
    const tiers = [...(product.priceTiers ?? [])];
    const previous = afterIndex === undefined ? tiers[tiers.length - 1] : tiers[afterIndex];
    const from = Number(previous?.toQuantity ?? previous?.fromQuantity ?? previous?.quantity ?? 0) + 1;
    const next = { quantity: from, fromQuantity: from, toQuantity: undefined, price: Number(previous?.unitPrice ?? previous?.price ?? product.basePrice ?? 0), unitPrice: Number(previous?.unitPrice ?? previous?.price ?? product.basePrice ?? 0) };
    tiers.splice(afterIndex === undefined ? tiers.length : afterIndex + 1, 0, next);
    update("priceTiers", tiers);
  }

  function removeTier(index: number) {
    update("priceTiers", (product.priceTiers ?? []).filter((_, tierIndex) => tierIndex !== index));
  }

  function duplicateTier(index: number) {
    const tiers = [...(product.priceTiers ?? [])];
    const tier = tiers[index];
    if (!tier) return;
    tiers.splice(index + 1, 0, { ...tier, fromQuantity: Number(tier.toQuantity ?? tier.fromQuantity ?? tier.quantity ?? 0) + 1, quantity: Number(tier.toQuantity ?? tier.fromQuantity ?? tier.quantity ?? 0) + 1, toQuantity: undefined });
    update("priceTiers", tiers);
  }

  function propertyValueFromGlobal(value: GlobalProperty["values"][number], index: number, tiers = product.priceTiers ?? []): ProductPropertyValue {
    return {
      propertyValueId: value.id,
      value: value.value,
      label: value.label,
      image: value.image,
      description: value.description,
      enabled: value.active !== false,
      defaultSelected: index === 0,
      sortOrder: index,
      pricingMode: value.pricingMode ?? "included",
      fixedPrice: value.fixedPrice ?? 0,
      costPrice: value.costPrice,
      multiplier: value.multiplier ?? 1,
      tierPrices: value.tierPrices?.length
        ? value.tierPrices
        : tiers.map((tier) => {
          const quantity = Number(tier.fromQuantity ?? tier.quantity ?? 1);
          return {
            quantity,
            fromQuantity: quantity,
            toQuantity: tier.toQuantity,
            price: 0,
            unitPrice: 0
          };
        })
    };
  }

  function assignGlobalProperty(propertySlug: string) {
    const source = globalProperties.find((entry) => entry.slug === propertySlug);
    if (!source) return;
    const currentProperties = product.pricingProperties ?? [];
    if (currentProperties.some((entry) => (entry.propertyId ?? entry.name) === source.slug || entry.name === source.name)) return;
    const nextProperty: ProductPricingProperty = {
      propertyId: source.slug,
      name: source.name,
      required: true,
      sortOrder: currentProperties.length,
      values: source.values
        .filter((value) => value.active !== false)
        .map((value, index) => propertyValueFromGlobal(value, index))
    };
    update("pricingProperties", [...currentProperties, nextProperty]);
  }

  function addBlankProperty() {
    const currentProperties = product.pricingProperties ?? [];
    const nextProperty: ProductPricingProperty = {
      name: `Eigenschaft ${currentProperties.length + 1}`,
      required: true,
      sortOrder: currentProperties.length,
      values: [{
        value: "standard",
        label: "Standard",
        enabled: true,
        defaultSelected: true,
        sortOrder: 0,
        pricingMode: "included",
        fixedPrice: 0,
        multiplier: 1
      }]
    };
    update("pricingProperties", [...currentProperties, nextProperty]);
  }

  function updatePricingProperty(index: number, patch: Partial<ProductPricingProperty>) {
    const nextProperties = [...(product.pricingProperties ?? [])];
    const current = nextProperties[index];
    if (!current) return;
    nextProperties[index] = { ...current, ...patch };
    update("pricingProperties", nextProperties);
  }

  function removePricingProperty(index: number) {
    update("pricingProperties", (product.pricingProperties ?? []).filter((_, propertyIndex) => propertyIndex !== index));
  }

  function updatePricingPropertyValue(propertyIndex: number, valueIndex: number, patch: Partial<ProductPropertyValue>) {
    const nextProperties = [...(product.pricingProperties ?? [])];
    const property = nextProperties[propertyIndex];
    const value = property?.values[valueIndex];
    if (!property || !value) return;
    const values = [...property.values];
    values[valueIndex] = { ...value, ...patch };
    nextProperties[propertyIndex] = { ...property, values };
    update("pricingProperties", nextProperties);
  }

  function addPricingPropertyValue(propertyIndex: number) {
    const property = product.pricingProperties?.[propertyIndex];
    if (!property) return;
    const values = property.values ?? [];
    const nextValue: ProductPropertyValue = {
      value: `option-${values.length + 1}`,
      label: `Option ${values.length + 1}`,
      enabled: true,
      defaultSelected: values.length === 0,
      sortOrder: values.length,
      pricingMode: "included",
      fixedPrice: 0,
      multiplier: 1
    };
    updatePricingProperty(propertyIndex, { values: [...values, nextValue] });
  }

  function removePricingPropertyValue(propertyIndex: number, valueIndex: number) {
    const property = product.pricingProperties?.[propertyIndex];
    if (!property) return;
    updatePricingProperty(propertyIndex, { values: property.values.filter((_, index) => index !== valueIndex) });
  }

  async function saveAndClose() {
    await save();
    window.location.href = "/admin/catalog/products";
  }

  async function duplicateProduct() {
    const baseSlug = `${product.slug || "produkt"}-kopie`;
    const next: ProductCatalogItem = {
      ...product,
      slug: `${baseSlug}-${Date.now().toString(36)}`,
      name: `${product.name || "Produkt"} Kopie`,
      productStatus: "draft",
      visible: false,
      published: false
    };
    const response = await fetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    if (!response.ok) {
      const json = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(json?.message ?? "Produkt konnte nicht dupliziert werden.");
      return;
    }
    const saved = await response.json() as ProductCatalogItem;
    addAdminRecent({ id: saved.slug, type: "Produkt", label: saved.name, href: `/admin/catalog/products/${encodeURIComponent(saved.slug)}`, subtitle: "Duplikat, Entwurf" });
    window.location.href = `/admin/catalog/products/${encodeURIComponent(saved.slug)}`;
  }

  async function save() {
    setSaving(true);
    setMessage("");
    let payload = product;
    try {
      payload = JSON.parse(advancedJson) as ProductCatalogItem;
    } catch {
      setSaving(false);
      setMessage("Das erweiterte JSON ist ungültig.");
      return;
    }
    const response = await fetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const json = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(json?.message ?? "Produkt konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }
    const saved = await response.json() as ProductCatalogItem;
    setProduct(saved);
    syncJson(saved, true);
    setMessage("Gespeichert.");
    setSaving(false);
    if (isNew) window.history.replaceState(null, "", `/admin/catalog/products/${encodeURIComponent(saved.slug)}`);
  }

  return (
    <>
      <PageHeader
        title={isNew ? "Neues Produkt" : `Produkt: ${product.name || slug}`}
        description="Produktdaten bearbeiten, ohne Preis-, Konfigurator-, Produktions- oder Lieferkonfiguration zu vereinfachen."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/catalog/products">
                <ArrowLeft className="h-4 w-4" />
                Produkte
              </Link>
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={saving || loading}>
              <Save className="h-4 w-4" />
              {saving ? "Speichert..." : "Speichern"}
            </Button>
          </>
        }
      />

      {message ? <div className="mb-4 rounded-md border bg-white p-3 text-sm font-semibold text-slate-700">{message}</div> : null}
      {pricingErrors.length ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {pricingErrors.slice(0, 3).join(" ")}
        </div>
      ) : null}

      <Tabs defaultValue="general" className="min-w-0">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="pricing">Preise</TabsTrigger>
          <TabsTrigger value="options">Optionen</TabsTrigger>
          <TabsTrigger value="production">Produktion</TabsTrigger>
          <TabsTrigger value="delivery">Lieferung</TabsTrigger>
          <TabsTrigger value="media">Medien</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Erweitert</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Panel>
            <Field label="Name"><Input value={product.name} onChange={(event) => update("name", event.target.value)} /></Field>
            <Field label="Slug"><Input value={product.slug} onChange={(event) => update("slug", event.target.value)} disabled={!isNew} /></Field>
            <Field label="Kategorie">
              <Select value={product.category} onValueChange={(value) => update("category", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category.slug} value={category.slug}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(value) => update("productStatus", value as ProductCatalogItem["productStatus"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <CheckField label="Sichtbar im Shop" checked={Boolean(product.visible)} onChange={(checked) => update("visible", checked)} />
            <CheckField label="Veröffentlicht" checked={Boolean(product.published)} onChange={(checked) => update("published", checked)} />
            <Field label="Kaufmodus">
              <Select value={String(productRecord.purchaseMode ?? "online")} onValueChange={(value) => updateExtra("purchaseMode", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online bestellbar</SelectItem>
                  <SelectItem value="request">Nur Anfrage</SelectItem>
                  <SelectItem value="both">Online + Anfrage</SelectItem>
                  <SelectItem value="disabled">Kein CTA</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2"><Field label="Kurzbeschreibung"><Input value={product.short} onChange={(event) => update("short", event.target.value)} /></Field></div>
            <div className="sm:col-span-2"><TextAreaField label="Beschreibung" value={product.description} onChange={(value) => update("description", value)} /></div>
            <CheckField label="Als Bestseller anzeigen" checked={Boolean(productRecord.isBestseller)} onChange={(checked) => updateExtra("isBestseller", checked)} />
            <Field label="Bestseller Reihenfolge"><Input type="number" value={String(productRecord.bestsellerSortOrder ?? 10)} onChange={(event) => updateExtra("bestsellerSortOrder", Number(event.target.value))} /></Field>
            <CheckField label="Im Studenten-Shop anzeigen" checked={Boolean(productRecord.isStudentShop)} onChange={(checked) => updateExtra("isStudentShop", checked)} />
            <Field label="Studenten-Shop Reihenfolge"><Input type="number" value={String(productRecord.studentShopSortOrder ?? 10)} onChange={(event) => updateExtra("studentShopSortOrder", Number(event.target.value))} /></Field>
            <CheckField label="Studentenrabatt erlauben" checked={productRecord.studentDiscountEligible !== false} onChange={(checked) => updateExtra("studentDiscountEligible", checked)} />
          </Panel>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Panel>
            <Field label="Basispreis"><Input type="number" step="0.01" value={product.basePrice} onChange={(event) => update("basePrice", Number(event.target.value))} /></Field>
            <Field label="Preisart">
              <Select value={product.pricingType ?? "fixed"} onValueChange={(value) => update("pricingType", value as ProductCatalogItem["pricingType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixpreis</SelectItem>
                  <SelectItem value="tiered">Staffelpreis</SelectItem>
                  <SelectItem value="area">Fläche</SelectItem>
                  <SelectItem value="hourly">Stundensatz</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">Mengenstaffeln</p>
                  <p className="text-sm text-slate-500">Inline bearbeiten. Validierung nutzt die bestehende Produktpreisprüfung.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => addTier()}>
                  <Plus className="h-4 w-4" />
                  Staffel
                </Button>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-3 py-2 text-left">Von</th><th className="px-3 py-2 text-left">Bis</th><th className="px-3 py-2 text-left">Stückpreis</th><th className="px-3 py-2 text-right">Summe</th><th className="px-3 py-2" /></tr>
                  </thead>
                  <tbody>
                    {(product.priceTiers ?? []).map((tier, index) => {
                      const from = Number(tier.fromQuantity ?? tier.quantity ?? 1);
                      const unit = Number(tier.unitPrice ?? tier.price ?? 0);
                      return (
                        <tr key={`${from}-${index}`} className="border-b last:border-0">
                          <td className="px-3 py-2"><Input className="h-8" type="number" min={1} value={from} onChange={(event) => updateTier(index, "fromQuantity", Number(event.target.value))} /></td>
                          <td className="px-3 py-2"><Input className="h-8" type="number" min={from} value={tier.toQuantity ?? ""} onChange={(event) => updateTier(index, "toQuantity", event.target.value ? Number(event.target.value) : undefined)} placeholder="offen" /></td>
                          <td className="px-3 py-2"><Input className="h-8" type="number" min={0} step="0.01" value={unit} onChange={(event) => updateTier(index, "unitPrice", Number(event.target.value))} /></td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(from * unit)}</td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateTier(index)} aria-label="Staffel duplizieren"><Copy className="h-4 w-4" /></Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-700" onClick={() => removeTier(index)} aria-label="Staffel löschen"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Summary label="Preis-Eigenschaften" value={product.pricingProperties?.length ?? 0} />
            <div className="sm:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">Produkt-Eigenschaften</p>
                  <p className="text-sm text-slate-500">Diese Eigenschaften erscheinen im Produkt-Konfigurator und werden in der Preisvorschau berechnet.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="min-w-56">
                    <Select value="__placeholder" onValueChange={assignGlobalProperty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__placeholder">Globale Eigenschaft hinzufügen</SelectItem>
                        {globalProperties
                          .filter((property) => !(product.pricingProperties ?? []).some((assigned) => (assigned.propertyId ?? assigned.name) === property.slug || assigned.name === property.name))
                          .map((property) => (
                            <SelectItem key={property.slug} value={property.slug}>{property.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addBlankProperty}>
                    <Plus className="h-4 w-4" />
                    Eigenschaft
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {(product.pricingProperties ?? []).length ? (product.pricingProperties ?? []).map((property, propertyIndex) => (
                  <div key={`${property.name}-${propertyIndex}`} className="rounded-md border bg-slate-50 p-3">
                    <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <Input value={property.name} onChange={(event) => updatePricingProperty(propertyIndex, { name: event.target.value })} />
                      <Input className="sm:w-28" type="number" value={String(property.sortOrder ?? propertyIndex)} onChange={(event) => updatePricingProperty(propertyIndex, { sortOrder: Number(event.target.value) })} />
                      <Button type="button" variant="ghost" size="icon" className="text-red-700" onClick={() => removePricingProperty(propertyIndex)} aria-label="Eigenschaft löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-md border bg-white">
                      <table className="w-full min-w-[920px] text-sm">
                        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Wert</th>
                            <th className="px-3 py-2 text-left">Label</th>
                            <th className="px-3 py-2 text-left">Preisart</th>
                            <th className="px-3 py-2 text-left">Preis</th>
                            <th className="px-3 py-2 text-left">Faktor</th>
                            <th className="px-3 py-2 text-left">Standard</th>
                            <th className="px-3 py-2 text-left">Aktiv</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {property.values.map((value, valueIndex) => (
                            <tr key={`${value.value}-${valueIndex}`} className="border-b last:border-0">
                              <td className="px-3 py-2"><Input className="h-8" value={value.value} onChange={(event) => updatePricingPropertyValue(propertyIndex, valueIndex, { value: event.target.value })} /></td>
                              <td className="px-3 py-2"><Input className="h-8" value={value.label ?? ""} onChange={(event) => updatePricingPropertyValue(propertyIndex, valueIndex, { label: event.target.value })} /></td>
                              <td className="px-3 py-2">
                                <Select value={value.pricingMode ?? "included"} onValueChange={(nextValue) => updatePricingPropertyValue(propertyIndex, valueIndex, { pricingMode: nextValue as ProductPropertyPriceMode })}>
                                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="included">inkludiert</SelectItem>
                                    <SelectItem value="fixed">pro Menge</SelectItem>
                                    <SelectItem value="flat">pauschal</SelectItem>
                                    <SelectItem value="tiered">gestaffelt</SelectItem>
                                    <SelectItem value="multiplier">Faktor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-2"><Input className="h-8" type="number" step="0.01" value={String(value.fixedPrice ?? 0)} onChange={(event) => updatePricingPropertyValue(propertyIndex, valueIndex, { fixedPrice: Number(event.target.value) })} /></td>
                              <td className="px-3 py-2"><Input className="h-8" type="number" step="0.01" value={String(value.multiplier ?? 1)} onChange={(event) => updatePricingPropertyValue(propertyIndex, valueIndex, { multiplier: Number(event.target.value) })} /></td>
                              <td className="px-3 py-2"><input type="checkbox" checked={Boolean(value.defaultSelected)} onChange={(event) => updatePricingProperty(propertyIndex, { values: property.values.map((entry, index) => ({ ...entry, defaultSelected: index === valueIndex ? event.target.checked : false })) })} className="h-5 w-5 accent-slate-950" /></td>
                              <td className="px-3 py-2"><input type="checkbox" checked={value.enabled !== false} onChange={(event) => updatePricingPropertyValue(propertyIndex, valueIndex, { enabled: event.target.checked })} className="h-5 w-5 accent-slate-950" /></td>
                              <td className="px-3 py-2 text-right">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-700" onClick={() => removePricingPropertyValue(propertyIndex, valueIndex)} aria-label="Wert löschen">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => addPricingPropertyValue(propertyIndex)}>
                      <Plus className="h-4 w-4" />
                      Wert
                    </Button>
                  </div>
                )) : (
                  <div className="rounded-md border border-dashed bg-white p-4 text-sm font-semibold text-slate-500">Keine Produkt-Eigenschaften zugewiesen.</div>
                )}
              </div>
            </div>
            <Field label="Pricing Profile"><Input value={typeof productRecord.pricingProfile === "string" ? productRecord.pricingProfile : ""} onChange={(event) => updateExtra("pricingProfile", event.target.value)} /></Field>
            <Field label="Mindestbestellwert"><Input type="number" step="0.01" value={String(pricingGuards.minimumOrderPrice ?? "")} onChange={(event) => updateGuard("minimumOrderPrice", Number(event.target.value))} /></Field>
            <Field label="Mindestmarge (%)"><Input type="number" step="0.1" value={String(pricingGuards.minimumMarginPercent ?? "")} onChange={(event) => updateGuard("minimumMarginPercent", Number(event.target.value))} /></Field>
            <Field label="Zielmarge (%)"><Input type="number" step="0.1" value={String(pricingGuards.targetMarginPercent ?? "")} onChange={(event) => updateGuard("targetMarginPercent", Number(event.target.value))} /></Field>
            <Field label="Max. Rabatt (%)"><Input type="number" step="0.1" value={String(pricingGuards.maximumDiscountPercent ?? "")} onChange={(event) => updateGuard("maximumDiscountPercent", Number(event.target.value))} /></Field>
            <Field label="Rundung">
              <Select value={String(pricingGuards.roundingRule ?? "none")} onValueChange={(value) => updateGuard("roundingRule", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="cent">Cent</SelectItem>
                  <SelectItem value="ten_cent">0,10 €</SelectItem>
                  <SelectItem value="fifty_cent">0,50 €</SelectItem>
                  <SelectItem value="whole">Ganze Euro</SelectItem>
                  <SelectItem value="psychological">Psychologisch</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {product.pricingType === "area" ? (
              <>
                <Field label="Standard Breite (cm)"><Input type="number" step="0.1" value={String(areaPricing.defaultWidthCm ?? "")} onChange={(event) => updateArea("defaultWidthCm", Number(event.target.value))} /></Field>
                <Field label="Standard Höhe (cm)"><Input type="number" step="0.1" value={String(areaPricing.defaultHeightCm ?? "")} onChange={(event) => updateArea("defaultHeightCm", Number(event.target.value))} /></Field>
                <Field label="Mindestfläche (m²)"><Input type="number" step="0.01" value={String(areaPricing.minAreaM2 ?? "")} onChange={(event) => updateArea("minAreaM2", Number(event.target.value))} /></Field>
                <Field label="Min. Breite (cm)"><Input type="number" step="0.1" value={String(areaPricing.minWidthCm ?? "")} onChange={(event) => updateArea("minWidthCm", Number(event.target.value))} /></Field>
                <Field label="Max. Breite (cm)"><Input type="number" step="0.1" value={String(areaPricing.maxWidthCm ?? "")} onChange={(event) => updateArea("maxWidthCm", Number(event.target.value))} /></Field>
                <Field label="Min. Höhe (cm)"><Input type="number" step="0.1" value={String(areaPricing.minHeightCm ?? "")} onChange={(event) => updateArea("minHeightCm", Number(event.target.value))} /></Field>
                <Field label="Max. Höhe (cm)"><Input type="number" step="0.1" value={String(areaPricing.maxHeightCm ?? "")} onChange={(event) => updateArea("maxHeightCm", Number(event.target.value))} /></Field>
              </>
            ) : null}
            <div className="sm:col-span-2 text-sm text-slate-500">Preiskomponenten und Eigenschaftswerte bleiben vollständig im erweiterten JSON editierbar.</div>
          </Panel>
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-black text-slate-950">Konfigurator-Preisvorschau</h3>
            </div>
            <Field label="Menge"><Input type="number" min={1} value={previewQuantity} onChange={(event) => setPreviewQuantity(Number(event.target.value))} /></Field>
            <div className="mt-3 grid gap-3">
              {(product.pricingProperties ?? []).map((property) => (
                <Field key={property.name} label={property.name}>
                  <Select value={previewConfig[`eigenschaft:${property.name}`] ?? ""} onValueChange={(value) => setPreviewConfig((current) => ({ ...current, [`eigenschaft:${property.name}`]: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {property.values.filter((value) => value.enabled !== false).map((value) => <SelectItem key={value.value} value={value.value}>{value.labelOverride || value.label || value.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              ))}
            </div>
            <div className="mt-4 grid gap-2 rounded-md border bg-slate-50 p-3 text-sm">
              <PreviewLine label="Stückpreis" value={formatMoney(preview.printUnitPrice || preview.baseUnitPrice)} />
              <PreviewLine label="Extras" value={formatMoney(preview.surchargeTotal)} />
              <PreviewLine label="Netto" value={formatMoney(preview.total)} />
              <PreviewLine label={`USt. ${vatPercent}%`} value={formatMoney(previewVat)} />
              <PreviewLine label="Brutto" value={formatMoney(preview.total + previewVat)} strong />
            </div>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="options">
          <Panel>
            <Field label="Konfiguratorprofil"><Input value={String(product.configuratorProfile ?? "standard")} onChange={(event) => updateExtra("configuratorProfile", event.target.value)} /></Field>
            <Field label="Darstellungsprofil"><Input value={String(product.experienceProfile ?? "standard")} onChange={(event) => updateExtra("experienceProfile", event.target.value)} /></Field>
            <Field label="PDF Analyse">
              <Select value={String(productRecord.pdfAnalysisMode ?? "disabled")} onValueChange={(value) => updateExtra("pdfAnalysisMode", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Deaktiviert</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="required">Erforderlich</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Summary label="Varianten" value={product.variants?.length ?? 0} />
            <Field label="Branchen-Slugs"><Input value={(product.industrySlugs ?? []).join(", ")} onChange={(event) => update("industrySlugs", splitList(event.target.value))} /></Field>
            <Field label="Aktive Kategorie-Eigenschaften"><Input value={((productRecord.enabledCategoryProperties as string[] | undefined) ?? []).join(", ")} onChange={(event) => updateExtra("enabledCategoryProperties", splitList(event.target.value))} /></Field>
          </Panel>
        </TabsContent>

        <TabsContent value="production">
          <Panel>
            <Summary label="PDF-Analyse" value={String(productRecord.pdfAnalysisMode ?? "disabled")} />
            <Summary label="Bindungskonfiguration" value={product.productBindingConfig ? "konfiguriert" : "nicht konfiguriert"} />
            <Field label="Produktionstage"><Input type="number" value={String(production?.baseProductionDays ?? 3)} onChange={(event) => updateProduction("baseProductionDays", Number(event.target.value))} /></Field>
            <CheckField label="Express verfügbar" checked={Boolean(production?.expressAvailable)} onChange={(checked) => updateProduction("expressAvailable", checked)} />
            <Field label="Preflight-Profil"><Input value={String(production?.preflightProfile ?? "")} onChange={(event) => updateProduction("preflightProfile", event.target.value)} /></Field>
            <Field label="Render-Pipeline"><Input value={String(production?.renderPipeline ?? "")} onChange={(event) => updateProduction("renderPipeline", event.target.value)} /></Field>
          </Panel>
        </TabsContent>

        <TabsContent value="delivery">
          <Panel>
            <div className="sm:col-span-2"><TextAreaField label="Liefertext" value={product.deliveryText} onChange={(value) => update("deliveryText", value)} /></div>
          </Panel>
        </TabsContent>

        <TabsContent value="media">
          <Panel>
            <Field label="Hero-Bild"><Input value={product.heroImage} onChange={(event) => update("heroImage", event.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Galeriebilder"><Input value={(product.gallery ?? []).join(", ")} onChange={(event) => update("gallery", splitList(event.target.value))} /></Field></div>
          </Panel>
        </TabsContent>

        <TabsContent value="seo">
          <Panel>
            <div className="sm:col-span-2"><TextAreaField label="SEO" value={product.seo} onChange={(value) => update("seo", value)} /></div>
            <div className="sm:col-span-2"><Field label="Tags"><Input value={(product.tags ?? []).join(", ")} onChange={(event) => update("tags", splitList(event.target.value))} /></Field></div>
          </Panel>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">Vollständiges Produkt-JSON</p>
                <p className="text-sm text-slate-500">Erhält komplexe Preis-, Options-, Liefer-, Produktions- und Konfigurator-Daten.</p>
              </div>
              <Badge variant="outline">slug keyed</Badge>
            </div>
            <textarea
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
              className="min-h-[560px] w-full rounded-md border bg-slate-950 p-4 font-mono text-xs text-slate-50 outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>
        </TabsContent>
      </Tabs>
      <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 border bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="text-sm font-semibold text-slate-600">{dirty ? "Ungespeicherte Änderungen" : "Alle Änderungen gespeichert"}</div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href={`/produkt/${encodeURIComponent(product.slug)}`} target="_blank"><Eye className="h-4 w-4" />Preview</Link></Button>
          {!isNew ? <Button type="button" variant="outline" size="sm" onClick={() => void duplicateProduct()}><Copy className="h-4 w-4" />Duplicate</Button> : null}
          <Button type="button" variant="outline" size="sm" onClick={() => void saveAndClose()} disabled={saving || loading}>Save & Close</Button>
          <Button type="button" size="sm" onClick={save} disabled={saving || loading}><Save className="h-4 w-4" />Save</Button>
        </div>
      </div>
    </>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-36 rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border bg-slate-50 p-3">
      <span className="text-sm font-black text-slate-950">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-slate-950" />
    </label>
  );
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PreviewLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={strong ? "flex justify-between text-base font-black text-slate-950" : "flex justify-between font-semibold text-slate-700"}><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(Number.isFinite(value) ? value : 0);
}
