"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import {
  STUDENT_PRINT_PRESETS,
  bindingLabel,
  calculateSheets,
  deriveStudentProductionQuantities,
  estimateBlockThicknessMm,
  getAvailableBindings,
  parsePageRange,
  paperLabel,
  productPriceConfig,
  productionLabel,
  recommendBinding,
  recommendPaper,
  resolveColorCounts,
  studentProductConfig,
  type PdfAnalysis,
  type StudentColorMode,
  type StudentPrintAudience,
  type StudentPrintPreset,
  type StudentPrintSelection
} from "@/lib/student-print-config";
import type { ProductCatalogItem } from "@/types/print-platform";

type PricePayload = {
  unitPrice: number;
  total: number;
  config: Record<string, string>;
  production: ReturnType<typeof deriveStudentProductionQuantities>;
  price: { total: number; lines: Array<{ label: string; value: string; price: number }> };
};

type Thumb = { page: number; url: string; label: string };

const initialAudience: StudentPrintAudience = "student";

function presetId(preset: StudentPrintPreset) {
  return `${preset.audience}:${preset.key}`;
}

function selectionForPreset(preset: StudentPrintPreset): StudentPrintSelection {
  return {
    presetKey: preset.key,
    productSlug: preset.productSlug,
    format: preset.defaults.format,
    manualPageCount: undefined,
    colorMode: preset.defaults.colorMode,
    manualColorPages: [],
    printSides: preset.defaults.printSides,
    paper: preset.defaults.paper,
    binding: preset.defaults.binding,
    quantity: 1,
    production: preset.defaults.production
  };
}

function colorModeLabel(mode: StudentColorMode) {
  if (mode === "auto") return "Automatisch wie im PDF";
  if (mode === "bw") return "Alles Schwarz-Weiß";
  if (mode === "color") return "Alles Farbe";
  return "Seiten selbst auswählen";
}

function isRuntimeUploadImage(src?: string) {
  return Boolean(src?.startsWith("/uploads/"));
}

export function StudentPrintConfigurator({ products }: { products: ProductCatalogItem[] }) {
  const presets = STUDENT_PRINT_PRESETS.filter((preset) => products.some((product) => product.slug === preset.productSlug));
  const [audience, setAudience] = useState<StudentPrintAudience>(initialAudience);
  const defaultPreset = presets.find((preset) => preset.audience === initialAudience) ?? presets[0];
  const [activePresetId, setActivePresetId] = useState(defaultPreset ? presetId(defaultPreset) : "");
  const activePreset = presets.find((preset) => presetId(preset) === activePresetId) ?? defaultPreset;
  const activeProduct = products.find((product) => product.slug === activePreset?.productSlug);
  const [selection, setSelection] = useState<StudentPrintSelection>(() => activePreset ? selectionForPreset(activePreset) : selectionForPreset(STUDENT_PRINT_PRESETS[0]));
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumb[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [price, setPrice] = useState<PricePayload | null>(null);
  const [pricing, setPricing] = useState(false);
  const production = deriveStudentProductionQuantities(selection, analysis ?? undefined);
  const pageCount = production.pageCount;
  const sheets = production.sheetsPerCopy;
  const color = resolveColorCounts(selection, analysis ?? undefined);
  const bindings = getAvailableBindings({ pages: pageCount, sheets, format: selection.format, presetKey: selection.presetKey });
  const availableBindings = bindings.filter((binding) => binding.available);
  const blockThickness = estimateBlockThicknessMm(sheets, selection.paper);
  const selectedProductConfig = activeProduct ? productPriceConfig(activeProduct, selection) : {};

  const groupedPresets = useMemo(() => ({
    student: presets.filter((preset) => preset.audience === "student"),
    school: presets.filter((preset) => preset.audience === "school")
  }), [presets]);

  useEffect(() => {
    if (!activePreset) return;
    setSelection((current) => ({
      ...selectionForPreset(activePreset),
      quantity: current.quantity || 1,
      manualPageCount: current.manualPageCount
    }));
  }, [activePresetId]);

  useEffect(() => {
    if (!analysis || !activePreset) return;
    const detectedFormat = analysis.dominantFormat && activePreset.supportedFormats.includes(analysis.dominantFormat)
      ? analysis.dominantFormat
      : activePreset.defaults.format;
    const nextSheets = calculateSheets(analysis.pages, activePreset.defaults.printSides);
    const paper = recommendPaper(activePreset.key, analysis.pages);
    const binding = recommendBinding({ presetKey: activePreset.key, pages: analysis.pages, sheets: nextSheets, format: detectedFormat });
    setSelection((current) => ({
      ...current,
      format: detectedFormat,
      paper,
      binding,
      colorMode: activePreset.defaults.colorMode,
      printSides: activePreset.defaults.printSides,
      manualPageCount: undefined
    }));
  }, [analysis, activePresetId]);

  useEffect(() => {
    if (!activeProduct || pageCount <= 0) {
      setPrice(null);
      setPricing(false);
      return;
    }
    let cancelled = false;
    setPricing(true);
    void fetch("/api/student-print/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection, analysis })
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.message ?? "Preis konnte nicht berechnet werden.");
        if (!cancelled) setPrice(payload as PricePayload);
      })
      .catch((error) => {
        if (!cancelled) {
          setPrice(null);
          setMessage(error instanceof Error ? error.message : "Preis konnte nicht berechnet werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setPricing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analysis, activeProduct, pageCount, selection]);

  function choosePreset(preset: StudentPrintPreset) {
    setAudience(preset.audience);
    setActivePresetId(presetId(preset));
  }

  async function handleFile(file?: File) {
    setMessage("");
    setManualError("");
    setThumbnails([]);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadState("error");
      setMessage("Bitte lade eine PDF-Datei hoch.");
      return;
    }

    setUploadState("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/uploads/student-document", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "PDF-Upload fehlgeschlagen.");
      const serverAnalysis = payload.analysis as PdfAnalysis;
      setUploadState("analyzing");
      const browser = await analyzePdfInBrowser(file, serverAnalysis);
      setAnalysis(browser.analysis);
      setSelection((current) => ({ ...current, manualPageCount: undefined }));
      setThumbnails(browser.thumbnails);
      setUploadState("done");
    } catch (error) {
      setUploadState("error");
      setMessage(error instanceof Error ? error.message : "Die PDF konnte nicht analysiert werden.");
    }
  }

  function applyAutomaticConfiguration() {
    if (!analysis || !activePreset) return;
    const format = analysis.dominantFormat && activePreset.supportedFormats.includes(analysis.dominantFormat)
      ? analysis.dominantFormat
      : activePreset.defaults.format;
    const printSides = activePreset.key === "poster" ? "simplex" : "duplex";
    const nextSheets = calculateSheets(analysis.pages, printSides);
    const paper = recommendPaper(activePreset.key, analysis.pages);
    const binding = recommendBinding({ presetKey: activePreset.key, pages: analysis.pages, sheets: nextSheets, format });
    setSelection((current) => ({
      ...current,
      format,
      printSides,
      paper,
      binding,
      colorMode: activePreset.key === "poster" ? "color" : "auto",
      production: "standard"
    }));
  }

  function updateManualPages(value: string) {
    setManualInput(value);
    const parsed = parsePageRange(value, pageCount);
    setManualError(parsed.error);
    setSelection((current) => ({ ...current, manualColorPages: parsed.error ? current.manualColorPages : parsed.pages }));
  }

  function updateManualPageCount(value: string) {
    const pageValue = value === "" ? undefined : Math.max(1, Math.floor(Number(value) || 0));
    setSelection((current) => ({ ...current, manualPageCount: pageValue }));
    if (value !== "") setMessage("");
  }

  function addToCart() {
    if (!activeProduct || !price || pageCount <= 0) {
      setMessage("Bitte gib eine Seitenanzahl ein oder lade eine PDF hoch und warte auf die Preisberechnung.");
      return;
    }
    const config = {
      ...studentProductConfig(selection, analysis ?? undefined),
      ...price.config,
      Produktpfad: `/produkt/${activeProduct.slug}`
    };
    const existing = JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<any>;
    const itemId = `student-${Date.now()}`;
    existing.push({
      itemId,
      slug: `${activeProduct.slug}-${itemId}`,
      productSlug: activeProduct.slug,
      name: `${activePreset?.label ?? activeProduct.name}: ${activeProduct.name}`,
      quantity: 1,
      category: "Schule & Studium",
      unitPrice: price.unitPrice,
      printCheckRequested: false,
      printCheckFee: 0,
      printCheckFileName: analysis?.fileName,
      printCheckFileUrl: analysis?.fileUrl,
      studentPrint: { selection, analysis },
      config
    });
    localStorage.setItem("dud_cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("dud-cart-updated"));
    setMessage("Dein Druckauftrag wurde in den Warenkorb gelegt.");
  }

  if (!activePreset || !activeProduct) {
    return (
      <section className="container-page py-16">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-900">
          Keine passenden Produkte für Schule & Studium gefunden. Bitte aktiviere mindestens ein bestehendes Druckprodukt im Admin.
        </div>
      </section>
    );
  }

  return (
    <section id="konfigurator" className="bg-slate-50 py-16">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="border-brand-blue/20 bg-white text-brand-blue">Schule & Studium</Badge>
              <h2 className="mt-4 text-3xl font-black text-brand-ink md:text-5xl">PDF hochladen. Automatisch konfigurieren.</h2>
              <p className="mt-4 max-w-2xl text-slate-600">Wähle deinen Drucktyp, lade eine PDF hoch und wir erkennen Seiten, Format, Farbe/SW und Blattzahl automatisch.</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-2">
                {(["student", "school"] as const).map((item) => (
                  <Button key={item} type="button" variant={audience === item ? "default" : "outline"} onClick={() => setAudience(item)}>
                    {item === "student" ? "Für Studenten" : "Für Schüler"}
                  </Button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedPresets[audience].map((preset) => (
                  <button
                    key={presetId(preset)}
                    type="button"
                    onClick={() => choosePreset(preset)}
                    className={presetId(preset) === activePresetId ? "rounded-lg border border-brand-blue bg-brand-mist p-4 text-left shadow-sm" : "rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand-blue/40"}
                  >
                    <p className="font-black text-brand-ink">{preset.label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Produkt: {products.find((product) => product.slug === preset.productSlug)?.name ?? preset.productSlug}</p>
                  </button>
                ))}
              </div>
            </div>

            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void handleFile(event.dataTransfer.files[0]);
              }}
              className={dragging ? "block cursor-pointer rounded-lg border-2 border-dashed border-brand-blue bg-white p-8 text-center ring-4 ring-brand-blue/10" : "block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-brand-blue hover:bg-brand-mist/40"}
            >
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
              {uploadState === "uploading" || uploadState === "analyzing" ? (
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-blue" />
              ) : (
                <UploadCloud className="mx-auto h-10 w-10 text-brand-blue" />
              )}
              <p className="mt-3 text-lg font-black text-brand-ink">PDF hochladen</p>
              <p className="mt-1 text-sm text-slate-600">Ziehe deine Datei hierher oder wähle sie aus. Wir analysieren dein Dokument automatisch.</p>
              {uploadState === "analyzing" ? <p className="mt-3 text-sm font-bold text-brand-blue">Farbseiten und Vorschau werden analysiert...</p> : null}
            </label>

            {message ? (
              <div className={uploadState === "error" ? "rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" : "rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"}>
                {message}
              </div>
            ) : null}

            {!analysis ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Ohne PDF starten</p>
                <h3 className="mt-1 text-xl font-black text-brand-ink">Seitenanzahl manuell eingeben</h3>
                <p className="mt-2 text-sm text-slate-600">Für eine schnelle Preisberechnung kannst du die Seiten pro Exemplar selbst eintragen. Nach einem PDF-Upload wird die Seitenanzahl automatisch aus der Datei übernommen.</p>
                <div className="mt-4 max-w-xs">
                  <Control label="Seiten pro Exemplar">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={selection.manualPageCount ?? ""}
                      onChange={(event) => updateManualPageCount(event.target.value)}
                      placeholder="z.B. 26"
                      className="h-11 rounded-md border bg-white px-3 text-sm font-semibold"
                    />
                  </Control>
                </div>
              </div>
            ) : null}

            {analysis ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-brand-ink">{analysis.fileName}</p>
                    <p className="mt-1 text-xs font-bold text-emerald-700">PDF grundsätzlich druckbar</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">PDF OK</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Seiten" value={`${analysis.pages}`} sub="pro Exemplar" />
                  <Metric label="Format" value={analysis.dominantFormat ?? "Sonderformat"} sub={analysis.widthMm && analysis.heightMm ? `${analysis.widthMm} x ${analysis.heightMm} mm` : undefined} />
                  <Metric label="Ausrichtung" value={analysis.orientation === "landscape" ? "Querformat" : analysis.orientation === "portrait" ? "Hochformat" : "Quadratisch"} />
                  <Metric label="Farbseiten" value={`${production.colorPagesPerCopy}`} sub={`${production.totalColorPages} gesamt`} />
                  <Metric label="SW-Seiten" value={`${production.bwPagesPerCopy}`} sub={`${production.totalBwPages} gesamt`} />
                  <Metric label="Blätter" value={`${production.sheetsPerCopy}`} sub={`${production.totalSheets} gesamt`} />
                </div>
                {analysis.warnings.length ? (
                  <div className="mt-4 space-y-2">
                    {analysis.warnings.map((warning, index) => (
                      <div key={`${warning.type}-${index}`} className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        {warning.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Alle Seiten haben dasselbe Format.
                  </div>
                )}
                {thumbnails.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    {thumbnails.map((thumb) => (
                      <div key={`${thumb.page}-${thumb.label}`} className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        <img src={thumb.url} alt={`Vorschau Seite ${thumb.page}`} className="h-32 w-full object-contain bg-white" />
                        <p className="border-t px-2 py-1 text-xs font-bold text-slate-600">{thumb.label}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-5">
                  <p className="text-sm font-black text-brand-ink">Farbseiten erkannt: {analysis.colorPages.length}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analysis.colorPages.slice(0, 40).map((page) => <span key={page} className="rounded bg-brand-blue px-2 py-1 text-xs font-bold text-white">{page} Farbe</span>)}
                    {analysis.colorPages.length > 40 ? <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">+{analysis.colorPages.length - 40} weitere</span> : null}
                    {!analysis.colorPages.length ? <span className="text-xs font-semibold text-slate-500">Keine Farbseiten erkannt.</span> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {pageCount > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Druck konfigurieren</p>
                    <h3 className="text-2xl font-black text-brand-ink">{analysis ? "Automatische Empfehlung" : "Konfiguration"}</h3>
                  </div>
                  {analysis ? <Button type="button" onClick={applyAutomaticConfiguration}>Druck automatisch konfigurieren</Button> : null}
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <Control label="Seiten pro Exemplar">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={pageCount}
                      disabled={Boolean(analysis)}
                      onChange={(event) => updateManualPageCount(event.target.value)}
                      className="h-11 rounded-md border bg-white px-3 text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">{analysis ? "Wird automatisch aus der PDF gelesen." : "Diese Zahl wird für Druckseiten, Papier und Preisstaffeln verwendet."}</p>
                  </Control>
                  <Control label="Format">
                    <select value={selection.format} onChange={(event) => setSelection({ ...selection, format: event.target.value })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold">
                      {activePreset.supportedFormats.map((format) => <option key={format} value={format}>{format}</option>)}
                    </select>
                  </Control>
                  <Control label="Druckseiten">
                    <select value={selection.printSides} onChange={(event) => setSelection({ ...selection, printSides: event.target.value as any })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold">
                      <option value="duplex">Beidseitig</option>
                      <option value="simplex">Einseitig</option>
                    </select>
                  </Control>
                  <Control label="Papier">
                    <select value={selection.paper} onChange={(event) => setSelection({ ...selection, paper: event.target.value as any })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold">
                      {(["80g-weiss", "100g-weiss", "120g-weiss", "170g-bilderdruck"] as const).map((paper) => <option key={paper} value={paper}>{paperLabel(paper)}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Empfohlen: {paperLabel(recommendPaper(selection.presetKey, pageCount))}</p>
                  </Control>
                  <Control label="Menge">
                    <input type="number" min={1} value={selection.quantity} onChange={(event) => setSelection({ ...selection, quantity: Math.max(1, Number(event.target.value) || 1) })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold" />
                  </Control>
                  <Control label="Produktion">
                    <select value={selection.production} onChange={(event) => setSelection({ ...selection, production: event.target.value as any })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold">
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      {selectedProductConfig.lieferzeit === "sameday" || activeProduct.variants[0]?.attributes.some((attribute) => attribute.options?.some((option) => option.value === "sameday")) ? <option value="sameday">Same Day</option> : null}
                    </select>
                  </Control>
                  <Control label="Bindung">
                    <select value={selection.binding} onChange={(event) => setSelection({ ...selection, binding: event.target.value as any })} className="h-11 rounded-md border bg-white px-3 text-sm font-semibold">
                      {bindings.map((binding) => <option key={binding.value} value={binding.value} disabled={!binding.available}>{binding.label}{binding.available ? "" : ` - ${binding.reason}`}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Empfohlen: {bindingLabel(recommendBinding({ presetKey: selection.presetKey, pages: pageCount, sheets, format: selection.format }))}</p>
                  </Control>
                </div>

                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-brand-ink">Druckfarbe</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {(["auto", "bw", "color", "manual"] as const).map((mode) => (
                      <label key={mode} className={selection.colorMode === mode ? "rounded-md border border-brand-blue bg-white p-3 ring-2 ring-brand-blue/10" : "rounded-md border border-slate-200 bg-white p-3"}>
                        <input type="radio" className="mr-2 accent-brand-blue" checked={selection.colorMode === mode} onChange={() => setSelection({ ...selection, colorMode: mode })} />
                        <span className="text-sm font-bold">{colorModeLabel(mode)}</span>
                        {mode === "auto" ? <span className="ml-2 text-xs text-slate-500">{production.colorPagesPerCopy} Farbseiten · {production.bwPagesPerCopy} SW-Seiten</span> : null}
                      </label>
                    ))}
                  </div>
                  {selection.colorMode === "manual" ? (
                    <div className="mt-3">
                      <input value={manualInput} onChange={(event) => updateManualPages(event.target.value)} placeholder="z.B. 1,2,5-8,15" className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold" />
                      {manualError ? <p className="mt-2 text-xs font-bold text-red-600">{manualError}</p> : <p className="mt-2 text-xs text-slate-500">Aktuell ausgewählt: {selection.manualColorPages.length} Farbseiten.</p>}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <VariantCard title="Empfohlen" text={`${color.label}, ${paperLabel(selection.paper)}, ${bindingLabel(selection.binding)}`} price={price?.unitPrice} active />
                  <VariantCard title="Günstigste Variante" text="Alles Schwarz-Weiß, 80 g weiß, beidseitig" />
                  <VariantCard title="Premium" text={`Farbe wie PDF, ${selection.paper === "80g-weiss" ? "100 g weiß" : paperLabel(selection.paper)}, hochwertige Bindung`} />
                </div>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-md bg-brand-mist">
                <Image src={activeProduct.heroImage || "/uploads/products/abschlussarbeiten.webp"} alt={activeProduct.name} fill unoptimized={isRuntimeUploadImage(activeProduct.heroImage)} className="object-cover" sizes="380px" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">Deine Konfiguration</p>
              <h3 className="mt-1 text-xl font-black text-brand-ink">{activePreset.label}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <SummaryLine label="Produkt" value={activeProduct.name} />
                <SummaryLine label="Format" value={selection.format} />
                <SummaryLine label="Auflage" value={`${production.quantity} ${production.quantity === 1 ? "Exemplar" : "Exemplare"}`} />
                <SummaryLine label="PDF-Seiten" value={pageCount ? `${production.pageCount} pro Exemplar` : "-"} />
                <SummaryLine label="Druckseiten gesamt" value={pageCount ? String(production.totalPrintedPages) : "-"} />
                <SummaryLine label="Blätter" value={pageCount ? `${production.sheetsPerCopy} pro Exemplar · ${production.totalSheets} gesamt` : "-"} />
                <SummaryLine label="Farbe" value={`${production.colorPagesPerCopy} Farbe · ${production.bwPagesPerCopy} SW je Exemplar`} />
                <SummaryLine label="Farbe gesamt" value={`${production.totalColorPages} Farbe · ${production.totalBwPages} SW`} />
                <SummaryLine label="Druckseiten" value={selection.printSides === "duplex" ? "Beidseitig" : "Einseitig"} />
                <SummaryLine label="Papier" value={paperLabel(selection.paper)} />
                <SummaryLine label="Bindung" value={bindingLabel(selection.binding)} />
                <SummaryLine label="Blockstärke" value={pageCount ? `ca. ${blockThickness} mm` : "-"} />
                <SummaryLine label="Produktion" value={productionLabel(selection.production)} />
              </div>
              <div className="my-4 h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Zwischensumme</span>
                <span className="text-2xl font-black text-brand-ink">{pricing ? "..." : price ? formatEuro(price.unitPrice) : "-"}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Der Preis wird serverseitig aus dem bestehenden Produkt berechnet. Versand, Gutschein und Zahlungsdetails kommen im bestehenden Checkout dazu.</p>
              <Button type="button" className="mt-5 w-full" disabled={pageCount <= 0 || !price || Boolean(manualError)} onClick={addToCart}>
                In den Warenkorb <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/warenkorb">Zum Warenkorb</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-brand-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-brand-ink">{label}</span>
      {children}
    </label>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function VariantCard({ title, text, price, active }: { title: string; text: string; price?: number; active?: boolean }) {
  return (
    <div className={active ? "rounded-lg border border-brand-blue bg-brand-mist p-4" : "rounded-lg border border-slate-200 bg-white p-4"}>
      <p className="font-black text-brand-ink">{title}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{text}</p>
      {price !== undefined ? <p className="mt-3 text-sm font-black text-brand-blue">{formatEuro(price)}</p> : <p className="mt-3 text-xs font-bold text-slate-500">Wird aus bestehenden Optionen berechnet.</p>}
    </div>
  );
}

async function analyzePdfInBrowser(file: File, serverAnalysis: PdfAnalysis): Promise<{ analysis: PdfAnalysis; thumbnails: Thumb[] }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const colorPages: number[] = [];
  const thumbnails: Thumb[] = [];
  const thumbPages = Array.from(new Set([1, Math.min(2, pdf.numPages), Math.max(1, Math.ceil(pdf.numPages / 2)), pdf.numPages])).filter((page) => page >= 1 && page <= pdf.numPages);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) continue;
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    if (pageHasColor(context, canvas.width, canvas.height)) colorPages.push(pageNumber);
    if (thumbPages.includes(pageNumber)) {
      thumbnails.push({
        page: pageNumber,
        label: pageNumber === 1 ? "Erste Seite" : pageNumber === pdf.numPages ? "Letzte Seite" : `Seite ${pageNumber}`,
        url: canvas.toDataURL("image/jpeg", 0.72)
      });
    }
  }

  const bwPages = Array.from({ length: pdf.numPages }, (_, index) => index + 1).filter((page) => !colorPages.includes(page));
  return {
    analysis: {
      ...serverAnalysis,
      pages: pdf.numPages,
      colorPages,
      bwPages,
      warnings: serverAnalysis.warnings
    },
    thumbnails
  };
}

function pageHasColor(context: CanvasRenderingContext2D, width: number, height: number) {
  const data = context.getImageData(0, 0, width, height).data;
  let colored = 0;
  let sampled = 0;
  for (let index = 0; index < data.length; index += 4 * 6) {
    const alpha = data[index + 3];
    if (alpha < 20) continue;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    sampled += 1;
    if (max - min > 18 && max > 40) colored += 1;
    if (sampled > 0 && colored / sampled > 0.012) return true;
  }
  return sampled > 0 && colored / sampled > 0.012;
}
