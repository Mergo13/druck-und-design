"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { CsvExportMenu } from "@/components/admin/csv/csv-export-menu";
import { CsvImportDialog } from "@/components/admin/csv/csv-import-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AnyRecord = Record<string, unknown>;

export function HomepageToolPage() {
  const [settings, setSettings] = useState<AnyRecord | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    const response = await fetch("/api/admin/homepage");
    if (response.ok) setSettings(await response.json() as AnyRecord);
    else setMessage("Homepage-Einstellungen konnten nicht geladen werden.");
  }
  async function save() {
    if (!settings) return;
    const response = await fetch("/api/admin/homepage", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setMessage(response.ok ? "Homepage gespeichert." : "Speichern fehlgeschlagen.");
    if (response.ok) setSettings(await response.json() as AnyRecord);
  }
  return (
    <>
      <PageHeader title="Homepage" description="Bestseller, Studenten-Shop und Google-Bewertungen auf der Startseite steuern." actions={<Button size="sm" onClick={() => void save()} disabled={!settings}>Speichern</Button>} />
      <Message text={message} />
      <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
        <Toggle label="Bestseller anzeigen" checked={Boolean(settings?.bestsellerEnabled)} onChange={(value) => update(settings, setSettings, "bestsellerEnabled", value)} />
        <Field label="Bestseller Titel"><Input value={text(settings?.bestsellerTitle)} onChange={(event) => update(settings, setSettings, "bestsellerTitle", event.target.value)} /></Field>
        <Field label="Bestseller Untertitel"><Textarea value={text(settings?.bestsellerSubtitle)} onChange={(value) => update(settings, setSettings, "bestsellerSubtitle", value)} /></Field>
        <Field label="Bestseller Reihenfolge"><Input type="number" value={numberText(settings?.bestsellerSortOrder)} onChange={(event) => update(settings, setSettings, "bestsellerSortOrder", Number(event.target.value))} /></Field>
        <Toggle label="Studenten-Shop anzeigen" checked={Boolean(settings?.studentShopEnabled)} onChange={(value) => update(settings, setSettings, "studentShopEnabled", value)} />
        <Field label="Studenten-Shop Titel"><Input value={text(settings?.studentShopTitle)} onChange={(event) => update(settings, setSettings, "studentShopTitle", event.target.value)} /></Field>
        <Field label="Studenten-Shop Beschreibung"><Textarea value={text(settings?.studentShopDescription)} onChange={(value) => update(settings, setSettings, "studentShopDescription", value)} /></Field>
        <Field label="Studenten-Shop Bild"><Input value={text(settings?.studentShopImage)} onChange={(event) => update(settings, setSettings, "studentShopImage", event.target.value)} /></Field>
        <Field label="Studenten-Shop Link"><Input value={text(settings?.studentShopLink)} onChange={(event) => update(settings, setSettings, "studentShopLink", event.target.value)} /></Field>
        <Field label="Studenten-Shop Reihenfolge"><Input type="number" value={numberText(settings?.studentShopSortOrder)} onChange={(event) => update(settings, setSettings, "studentShopSortOrder", Number(event.target.value))} /></Field>
        <Toggle label="Google-Bewertungen anzeigen" checked={Boolean(settings?.googleReviewsEnabled)} onChange={(value) => update(settings, setSettings, "googleReviewsEnabled", value)} />
        <Field label="Google-Bewertungen Titel"><Input value={text(settings?.googleReviewsTitle)} onChange={(event) => update(settings, setSettings, "googleReviewsTitle", event.target.value)} /></Field>
        <Field label="Google-Bewertungen Untertitel"><Textarea value={text(settings?.googleReviewsSubtitle)} onChange={(value) => update(settings, setSettings, "googleReviewsSubtitle", value)} /></Field>
        <Field label="Google-Bewertungen Reihenfolge"><Input type="number" value={numberText(settings?.googleReviewsSortOrder)} onChange={(event) => update(settings, setSettings, "googleReviewsSortOrder", Number(event.target.value))} /></Field>
      </div>
    </>
  );
}

export function SiteImagesToolPage() {
  const [slots, setSlots] = useState<Array<{ key: string; label: string; description?: string; defaultUrl?: string }>>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    const response = await fetch("/api/admin/tools?action=site-images");
    if (!response.ok) return setMessage("Website-Bilder konnten nicht geladen werden.");
    const json = await response.json() as { slots: Array<{ key: string; label: string; description?: string; defaultUrl?: string }>; images: Record<string, string> };
    setSlots(json.slots);
    setImages(json.images);
  }
  async function upload(slotKey: string, file: File) {
    setUploading(slotKey);
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/uploads/site-image", { method: "POST", body: formData });
    setUploading("");
    if (!response.ok) return setMessage("Upload fehlgeschlagen.");
    const payload = await response.json() as { url?: string };
    if (payload.url) setImages((current) => ({ ...current, [slotKey]: payload.url ?? "" }));
  }
  async function save() {
    const response = await fetch("/api/admin/tools?action=site-images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images }) });
    setMessage(response.ok ? "Website-Bilder gespeichert." : "Speichern fehlgeschlagen.");
  }
  return (
    <>
      <PageHeader title="Website-Bilder" description="Zentrale Bildslots der Website verwalten." actions={<Button size="sm" onClick={() => void save()}>Speichern</Button>} />
      <Message text={message} />
      <div className="grid gap-4">
        {slots.map((slot) => (
          <div key={slot.key} className="grid gap-2 rounded-lg border bg-white p-4 md:grid-cols-[220px_1fr]">
            <div>
              <div className="text-sm font-black text-slate-950">{slot.label}</div>
              <div className="text-sm text-slate-500">{slot.description ?? slot.defaultUrl ?? slot.key}</div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={images[slot.key] ?? ""} onChange={(event) => setImages((current) => ({ ...current, [slot.key]: event.target.value }))} placeholder="/uploads/site-images/..." />
              <Button asChild type="button" variant="outline" size="sm">
                <label className="cursor-pointer">
                  {uploading === slot.key ? "Upload..." : "Upload"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(slot.key, file);
                  }} />
                </label>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function AdvertisingToolPage() {
  return <EnvConfigTool title="Werbung" description="Tracking, SEO-Verifikation und Werbe-Konfiguration." action="marketing-config" rootKey="marketing" keys={["NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_CLARITY_PROJECT_ID", "NEXT_PUBLIC_META_PIXEL_ID", "GOOGLE_SITE_VERIFICATION"]} />;
}

export function EmailConfigToolPage() {
  return <EnvConfigTool title="E-Mail / SMTP" description="SMTP- und Benachrichtigungs-Konfiguration aus der bestehenden Admin-API." action="email" rootKey="smtp" keys={["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_FROM_EMAIL", "CONTACT_NOTIFY_EMAIL", "PRODUCT_SELECTION_NOTIFY_EMAIL"]} />;
}

export function CrmToolPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<AnyRecord | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    const [configRes, statusRes] = await Promise.all([fetch("/api/admin/tools?action=crm-config"), fetch("/api/admin/tools?action=crm-status")]);
    if (configRes.ok) {
      const json = await configRes.json() as { crm: Record<string, string> };
      setConfig(json.crm);
    }
    if (statusRes.ok) setStatus(await statusRes.json() as AnyRecord);
  }
  async function save() {
    const response = await fetch("/api/admin/tools?action=crm-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setMessage(response.ok ? "CRM-Konfiguration gespeichert." : ((await response.json().catch(() => null)) as { message?: string } | null)?.message ?? "Speichern fehlgeschlagen.");
  }
  async function manage(operation: "retry" | "stornieren" | "delete", orderId: string) {
    const response = await fetch("/api/admin/tools?action=crm-manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, orderId }) });
    setMessage(response.ok ? "CRM-Aktion ausgeführt." : ((await response.json().catch(() => null)) as { message?: string } | null)?.message ?? "CRM-Aktion fehlgeschlagen.");
    await load();
  }
  const summary = status?.summary as AnyRecord | undefined;
  const pending = Array.isArray(status?.pending) ? status.pending as AnyRecord[] : [];
  return (
    <>
      <PageHeader title="CRM / Rechnungen" description="Rechnungs-Sync, offene CRM-Übertragungen und Konfiguration." actions={<Button size="sm" onClick={() => void save()}>Speichern</Button>} />
      <Message text={message} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-black">Konfiguration</h3>
          <Field label="CRM API URL"><Input value={config.CRM_API_URL ?? ""} onChange={(event) => setConfig((current) => ({ ...current, CRM_API_URL: event.target.value }))} /></Field>
          <Field label="CRM API Token"><Input type="password" value={config.CRM_API_TOKEN ?? ""} onChange={(event) => setConfig((current) => ({ ...current, CRM_API_TOKEN: event.target.value }))} /></Field>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-black">Status</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Metric label="Stripe-Bestellungen" value={summary?.stripeOrders} />
            <Metric label="CRM synchronisiert" value={summary?.crmSynced} />
            <Metric label="CRM offen" value={summary?.crmPending} />
            <Metric label="Offener Umsatz" value={currency(summary?.pendingRevenue)} />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-sm font-black">Offene Übertragungen</h3>
        <div className="grid gap-2">
          {pending.map((row) => (
            <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-slate-50 p-3 text-sm">
              <span className="font-semibold">{String(row.id)} · {String(row.customer ?? "-")} · {currency(row.total)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void manage("retry", String(row.id))}>Erneut übertragen</Button>
                <Button size="sm" variant="outline" onClick={() => void manage("stornieren", String(row.id))}>Stornieren</Button>
              </div>
            </div>
          ))}
          {!pending.length ? <p className="text-sm text-slate-500">Keine offenen CRM-Übertragungen.</p> : null}
        </div>
      </div>
    </>
  );
}

export function CatalogToolsPage() {
  const [imageImport, setImageImport] = useState("");
  const [imageResult, setImageResult] = useState("");
  const [rawResource, setRawResource] = useState<"products" | "categories" | "properties" | "industries">("products");
  const [rawMode, setRawMode] = useState("merge");
  const [rawStrategy, setRawStrategy] = useState("update");
  const [rawCsv, setRawCsv] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [rawBusy, setRawBusy] = useState(false);
  const [targets, setTargets] = useState<{ products: Array<{ slug: string; name: string }>; categories: Array<{ slug: string; name: string }> }>({ products: [], categories: [] });
  const [targetType, setTargetType] = useState<"product" | "category">("product");
  const [targetSlug, setTargetSlug] = useState("");
  const [imageUsage, setImageUsage] = useState<"hero" | "gallery" | "logo">("hero");
  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/tools?action=image-targets");
      if (response.ok) setTargets(await response.json() as { products: Array<{ slug: string; name: string }>; categories: Array<{ slug: string; name: string }> });
    })();
  }, []);
  async function uploadCatalogImages(files: FileList | null) {
    if (!files?.length || !targetSlug) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/uploads/product-image", { method: "POST", body: formData });
      if (!response.ok) continue;
      const payload = await response.json() as { url?: string };
      if (payload.url) urls.push(payload.url);
    }
    if (!urls.length) return setImageResult("Upload fehlgeschlagen.");
    const content = targetType === "category"
      ? JSON.stringify({ categories: [{ slug: targetSlug, image_path: urls[0] }] })
      : JSON.stringify({ products: [{ slug: targetSlug, image_path: imageUsage === "gallery" ? undefined : urls[0], gallery: imageUsage === "hero" ? urls.slice(1) : urls }] });
    await postTool("catalog-image-import", { content }, setImageResult);
  }
  async function runRawCsv(action: "validate" | "import") {
    if (!rawCsv.trim()) return setRawResult("CSV ist leer.");
    setRawBusy(true);
    const response = await fetch(`/api/admin/csv/${rawResource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        filename: "raw.csv",
        content: rawCsv,
        strategy: rawStrategy,
        importMode: rawMode
      })
    });
    const json = await response.json().catch(() => null) as unknown;
    setRawBusy(false);
    setRawResult(JSON.stringify(json, null, 2));
  }
  return (
    <>
      <PageHeader title="Katalog-Werkzeuge" description="CSV-Import/Export, Bildimport und Produktions-Bindungskonfiguration." />
      <Tabs defaultValue="csv">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="csv">CSV Import / Export</TabsTrigger>
          <TabsTrigger value="images">Bildimport</TabsTrigger>
          <TabsTrigger value="bindings">Bindungskonfiguration</TabsTrigger>
        </TabsList>
        <TabsContent value="csv">
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
              {(["products", "categories", "properties", "industries"] as const).map((resource) => (
                <div key={resource} className="rounded-md border bg-slate-50 p-3">
                  <div className="mb-3 text-sm font-black">{resourceLabel(resource)}</div>
                  <div className="flex flex-wrap gap-2"><CsvImportDialog resource={resource} /><CsvExportMenu resource={resource} /></div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <Field label="Ressource">
                  <select className="h-10 rounded-md border bg-white px-3 text-sm" value={rawResource} onChange={(event) => setRawResource(event.target.value as typeof rawResource)}>
                    <option value="products">Product Import</option>
                    <option value="categories">Category Import</option>
                    <option value="properties">Eigenschaften Import</option>
                    <option value="industries">Branchen Import</option>
                  </select>
                </Field>
                <Field label="Modus">
                  <select className="h-10 rounded-md border bg-white px-3 text-sm" value={rawMode} onChange={(event) => setRawMode(event.target.value)}>
                    <option value="merge">Merge</option>
                    <option value="price-update-only">Price Update Only</option>
                    <option value="properties-update-only">Properties Update Only</option>
                    <option value="full-replace">Full Replace</option>
                  </select>
                </Field>
                <Field label="Strategie">
                  <select className="h-10 rounded-md border bg-white px-3 text-sm" value={rawStrategy} onChange={(event) => setRawStrategy(event.target.value)}>
                    <option value="update">Bestehende aktualisieren</option>
                    <option value="skip">Bestehende überspringen</option>
                    <option value="duplicate">Duplikate erstellen</option>
                  </select>
                </Field>
                <Button size="sm" variant="outline" onClick={() => void runRawCsv("validate")} disabled={rawBusy || !rawCsv.trim()}>Dry Run / Preview</Button>
                <Button size="sm" onClick={() => void runRawCsv("import")} disabled={rawBusy || !rawCsv.trim()}>Import bestätigen</Button>
              </div>
              <Field label="Raw CSV">
                <Textarea
                  value={rawCsv}
                  onChange={setRawCsv}
                  className="min-h-[260px] font-mono"
                  placeholder={'slug;priceTiers\nflyer;"1-9:1.50|10-24:0.85|25-49:0.55"\n\nslug;pricingProperties\nflyer;"format|druckart|druckseiten|papier|veredelung"'}
                />
              </Field>
              <Message text={rawResult} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="images">
          <div className="grid gap-4 rounded-lg border bg-white p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Zieltyp">
                <select className="h-10 rounded-md border bg-white px-3 text-sm" value={targetType} onChange={(event) => {
                  setTargetType(event.target.value as "product" | "category");
                  setTargetSlug("");
                }}>
                  <option value="product">Produkt</option>
                  <option value="category">Kategorie</option>
                </select>
              </Field>
              <Field label="Ziel">
                <select className="h-10 rounded-md border bg-white px-3 text-sm" value={targetSlug} onChange={(event) => setTargetSlug(event.target.value)}>
                  <option value="">Auswählen</option>
                  {(targetType === "product" ? targets.products : targets.categories).map((target) => <option key={target.slug} value={target.slug}>{target.name}</option>)}
                </select>
              </Field>
              <Field label="Verwendung">
                <select className="h-10 rounded-md border bg-white px-3 text-sm" value={targetType === "category" ? "logo" : imageUsage} onChange={(event) => setImageUsage(event.target.value as "hero" | "gallery" | "logo")} disabled={targetType === "category"}>
                  <option value="hero">Hero + Galerie</option>
                  <option value="gallery">Nur Galerie</option>
                  <option value="logo">Logo</option>
                </select>
              </Field>
              <Field label="Dateien hochladen">
                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer">
                    Bilder auswählen
                    <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => void uploadCatalogImages(event.target.files)} />
                  </label>
                </Button>
              </Field>
            </div>
            <Field label="JSON oder CSV für Produkt-/Kategorie-Bilder"><Textarea value={imageImport} onChange={setImageImport} placeholder="type,slug,image_path,gallery" /></Field>
            <Button className="mt-3" size="sm" onClick={() => void postTool("catalog-image-import", { content: imageImport }, setImageResult)}>Bildimport ausführen</Button>
            <Message text={imageResult} />
          </div>
        </TabsContent>
        <TabsContent value="bindings"><ProductionBindingToolPage /></TabsContent>
      </Tabs>
    </>
  );
}

export function ProductionBindingToolPage() {
  const [config, setConfig] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    const response = await fetch("/api/admin/production/bindings");
    if (response.ok) setConfig(JSON.stringify(await response.json(), null, 2));
    else setMessage("Bindungskonfiguration konnte nicht geladen werden.");
  }
  async function save() {
    try {
      const parsed = JSON.parse(config) as unknown;
      const response = await fetch("/api/admin/production/bindings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      setMessage(response.ok ? "Bindungskonfiguration gespeichert." : "Speichern fehlgeschlagen.");
    } catch {
      setMessage("JSON ist ungültig.");
    }
  }
  async function reset() {
    if (!window.confirm("Standard-Bindungskonfiguration wirklich wiederherstellen?")) return;
    const response = await fetch("/api/admin/production/bindings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset: true }) });
    setMessage(response.ok ? "Standard wiederhergestellt." : "Zurücksetzen fehlgeschlagen.");
    if (response.ok) setConfig(JSON.stringify(await response.json(), null, 2));
  }
  return (
    <div className="rounded-lg border bg-white p-4">
      <Field label="Produktions-Bindungskonfiguration"><Textarea value={config} onChange={setConfig} className="min-h-[420px] font-mono" /></Field>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void save()}>Speichern</Button>
        <Button size="sm" variant="outline" onClick={() => void reset()}>Standard wiederherstellen</Button>
      </div>
      <Message text={message} />
    </div>
  );
}

export function LayoutStudioPage() {
  const [layout, setLayout] = useState("magazine");
  return (
    <>
      <PageHeader title="Layout Studio" description="Vorhandenes Layout-Studio als shadcn-Ansicht: Layout wählen und Module prüfen." />
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {["magazine", "split", "grid"].map((value, index) => <Button key={value} size="sm" variant={layout === value ? "default" : "outline"} onClick={() => setLayout(value)}>Layout {index + 1}</Button>)}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {["Neuigkeiten", "Highlights", "CTA"].map((item) => <div key={item} className="min-h-32 rounded-md border bg-slate-50 p-4"><Badge variant="outline">{layout}</Badge><h3 className="mt-3 font-black">{item}</h3></div>)}
        </div>
      </div>
    </>
  );
}

export function SystemDangerPage() {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-black text-red-950">Gefährliche Aktionen</h3>
      <p className="mt-1 text-sm text-red-800">Shutdown setzt Wartungsmodus und Checkout-Sperre. Der Serverprozess wird nicht beendet.</p>
      <Input className="mt-3 bg-white" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Grund" />
      <Button className="mt-3 bg-red-700 hover:bg-red-800" size="sm" onClick={() => window.confirm("Shutdown-Anfrage wirklich erstellen?") && void postTool("shutdown", { reason }, setMessage)}>Shutdown anfragen</Button>
      <Message text={message} />
    </div>
  );
}

export function BackupToolPage() {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-black text-slate-950">Backup erstellen</h3>
      <p className="mt-1 text-sm text-slate-500">Erstellt in lokaler Umgebung eine Kopie der aktuellen SQLite-Datenbank und protokolliert sie als Backup-Datensatz.</p>
      <Input className="mt-3" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Backup-Bezeichnung" />
      <Button className="mt-3" size="sm" onClick={() => void postTool("backup", { label }, setMessage)}>Backup erstellen</Button>
      <Message text={message} />
    </div>
  );
}

function EnvConfigTool({ title, description, action, rootKey, keys }: { title: string; description: string; action: string; rootKey: string; keys: string[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    const response = await fetch(`/api/admin/tools?action=${action}`);
    if (!response.ok) return setMessage(`${title} konnte nicht geladen werden.`);
    const json = await response.json() as Record<string, Record<string, string>>;
    setValues(json[rootKey] ?? {});
  }
  async function save() {
    const response = await fetch(`/api/admin/tools?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setMessage(response.ok ? "Gespeichert." : ((await response.json().catch(() => null)) as { message?: string } | null)?.message ?? "Speichern fehlgeschlagen.");
  }
  return (
    <>
      <PageHeader title={title} description={description} actions={<Button size="sm" onClick={() => void save()}>Speichern</Button>} />
      <Message text={message} />
      <div className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-2">
        {keys.map((key) => <Field key={key} label={key}><Input value={values[key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} /></Field>)}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black uppercase text-slate-500">{label}</span>{children}</label>;
}

function Textarea({ value, onChange, placeholder, className = "" }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return <textarea className={`min-h-32 rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-ring ${className}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-md border bg-slate-50 p-3"><span className="text-sm font-black">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-slate-950" /></label>;
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-md border bg-slate-50 p-3"><div className="text-xs font-black uppercase text-slate-500">{label}</div><div className="mt-1 text-xl font-black">{String(value ?? 0)}</div></div>;
}

function Message({ text }: { text: string }) {
  return text ? <div className="mt-3 rounded-md border bg-white p-3 text-sm font-semibold">{text}</div> : null;
}

function update(current: AnyRecord | null, set: Dispatch<SetStateAction<AnyRecord | null>>, key: string, value: unknown) {
  if (!current) return;
  set({ ...current, [key]: value });
}

async function postTool(action: string, body: AnyRecord, setMessage: (message: string) => void) {
  const response = await fetch(`/api/admin/tools?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => null) as { message?: string; result?: unknown } | null;
  setMessage(response.ok ? JSON.stringify(json?.result ?? json, null, 2) : json?.message ?? "Aktion fehlgeschlagen.");
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberText(value: unknown) {
  return typeof value === "number" ? String(value) : "";
}

function currency(value: unknown) {
  return Number(value ?? 0).toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

function resourceLabel(resource: string) {
  return ({ products: "Produkte", categories: "Kategorien", properties: "Eigenschaften", industries: "Branchen" } as Record<string, string>)[resource] ?? resource;
}
