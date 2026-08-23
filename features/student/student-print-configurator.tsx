"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmbossingConfigurator } from "@/features/embossing/embossing-configurator";
import { pricingQuantitiesForProductDocument } from "@/lib/document-production";
import { getPdfjs } from "@/lib/pdf/pdfjs-client";
import { resolvePdfAnalysisMode, resolveProductPdfConfig } from "@/lib/product-configurator-profile";
import { calculateConfiguredProductPrice } from "@/lib/print-workflow";
import { applyStudentDiscount } from "@/lib/student-discount";
import type { PdfAnalysis } from "@/lib/student-print-config";
import { formatEuro } from "@/lib/utils";
import type { EmbossingColor } from "@/lib/embossing/types";
import type { ProductCatalogItem, ProductPricingProperty, ProductPropertyValue } from "@/types/print-platform";

type ProductConfiguration = Record<string, string>;
type Thumb = { page: number; url: string; label: string };
type FinalizedEmbossing = {
  id: string;
  cartConfig: Record<string, string>;
  lineCount: number;
  previewUrl?: string;
  productionPdfUrl?: string;
};

function propertyKey(property: ProductPricingProperty) {
  return `eigenschaft:${property.name}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function enabledValues(property: ProductPricingProperty) {
  return (property.values ?? [])
    .filter((value) => value.enabled !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function valueLabel(value: ProductPropertyValue) {
  return value.labelOverride || value.label || value.value;
}

function findDependency(properties: ProductPricingProperty[], dependencyId: string) {
  const normalized = slugify(dependencyId);
  return properties.find((property) => {
    const ids = [property.propertyId, property.name].filter(Boolean).map((item) => slugify(String(item)));
    return ids.includes(normalized);
  });
}

export function isStudentPropertyVisible(
  property: ProductPricingProperty,
  properties: ProductPricingProperty[],
  configuration: ProductConfiguration
) {
  if (!property.visibility?.propertyId) return true;
  const dependency = findDependency(properties, property.visibility.propertyId);
  const actual = dependency
    ? configuration[propertyKey(dependency)]
    : configuration[`eigenschaft:${property.visibility.propertyId}`] ?? configuration[property.visibility.propertyId];
  return property.visibility.operator === "not_equals"
    ? actual !== property.visibility.value
    : actual === property.visibility.value;
}

function sanitizeConfiguration(properties: ProductPricingProperty[], current: ProductConfiguration) {
  let next: ProductConfiguration = { ...current };
  let changed = false;

  for (let pass = 0; pass < properties.length + 1; pass += 1) {
    let passChanged = false;
    for (const property of properties) {
      const key = propertyKey(property);
      const values = enabledValues(property);
      const visible = isStudentPropertyVisible(property, properties, next);
      if (!visible || !values.length) {
        if (key in next) {
          delete next[key];
          changed = true;
          passChanged = true;
        }
        continue;
      }
      const selected = next[key];
      if (!selected || !values.some((value) => value.value === selected)) {
        const fallback = values.find((value) => value.defaultSelected)?.value ?? (values.length === 1 ? values[0]?.value : "");
        if (fallback) {
          next[key] = fallback;
          changed = true;
          passChanged = true;
        } else if (key in next) {
          delete next[key];
          changed = true;
          passChanged = true;
        }
      }
    }
    if (!passChanged) break;
  }

  return changed ? next : current;
}

function sortedPricingProperties(product: ProductCatalogItem) {
  return (product.pricingProperties ?? [])
    .filter((property) => enabledValues(property).length > 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function isRuntimeUploadImage(src?: string) {
  return Boolean(src?.startsWith("/uploads/"));
}

function initialConfiguration(product: ProductCatalogItem) {
  const config: ProductConfiguration = { auflage: "1" };
  for (const property of sortedPricingProperties(product)) {
    const values = enabledValues(property);
    const defaultValue = values.find((value) => value.defaultSelected)?.value ?? (values.length === 1 ? values[0]?.value : "");
    if (defaultValue) config[propertyKey(property)] = defaultValue;
  }
  return sanitizeConfiguration(sortedPricingProperties(product), config);
}

function resolveEmbossingSelection(config: ProductConfiguration) {
  const entry = Object.entries(config).find(([key]) => /prägung|praegung/i.test(key));
  if (!entry) return null;
  return { key: entry[0], value: entry[1] };
}

function embossingActiveFromValue(value?: string) {
  return Boolean(value && !/keine|ohne|nein|none|no/i.test(value));
}

function embossingColorFromValue(value?: string): EmbossingColor {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("silber")) return "silber";
  if (normalized.includes("blind")) return "blind";
  return "gold";
}

function productWithEmbossingLinePricing(
  product: ProductCatalogItem,
  embossingSelection: { key: string; value: string } | null,
  lineCount: number
) {
  if (!embossingSelection || lineCount <= 0) return product;
  return {
    ...product,
    pricingProperties: (product.pricingProperties ?? []).map((property) => {
      if (propertyKey(property) !== embossingSelection.key) return property;
      return {
        ...property,
        values: (property.values ?? []).map((value) => value.value === embossingSelection.value
          ? {
            ...value,
            production: {
              ...(value.production ?? {}),
              pricingQuantitySource: "embossing_lines" as const
            }
          }
          : value)
      };
    })
  };
}

export function StudentPrintConfigurator({ products }: { products: ProductCatalogItem[] }) {
  const product = products[0];
  if (!product) return <StudentEmptyState />;
  return <StudentConfigurator product={product} />;
}

export function StudentConfigurator({
  product,
  authenticated = false,
  studentVerified = false,
  studentDiscountPercent = 20
}: {
  product: ProductCatalogItem;
  authenticated?: boolean;
  studentVerified?: boolean;
  studentDiscountPercent?: number;
}) {
  const properties = useMemo(() => sortedPricingProperties(product), [product]);
  const [config, setConfig] = useState<ProductConfiguration>(() => initialConfiguration(product));
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumb[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [finalizedEmbossing, setFinalizedEmbossing] = useState<FinalizedEmbossing | null>(null);
  const [draftEmbossingLineCount, setDraftEmbossingLineCount] = useState(0);
  const pdfMode = resolvePdfAnalysisMode(product);
  const pdfConfig = resolveProductPdfConfig(product);
  const pdfRequired = pdfMode === "required";
  const pdfEnabled = pdfMode !== "disabled";
  const currentQuantity = Math.max(1, Math.round(Number(config.auflage) || 1));
  const validConfig = useMemo(() => sanitizeConfiguration(properties, config), [config, properties]);

  useEffect(() => {
    if (validConfig !== config) setConfig(validConfig);
  }, [config, validConfig]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`dud_pending_student_config:${product.slug}`);
    if (!stored) return;
    try {
      const restored = JSON.parse(stored) as ProductConfiguration;
      setConfig((current) => sanitizeConfiguration(properties, { ...current, ...restored }));
    } catch {
      // Ignore invalid browser state.
    }
    sessionStorage.removeItem(`dud_pending_student_config:${product.slug}`);
  }, [product.slug, properties]);

  useEffect(() => {
    setConfig((current) => ({
      ...current,
      ...(analysis?.pages ? {
        seitenanzahl: String(analysis.pages),
        Seitenanzahl: String(analysis.pages),
        "PDF-Seiten": String(analysis.pages),
        "Seiten pro Exemplar": String(analysis.pages),
        pdfAnalysisPageCount: String(analysis.pages),
        pdfAnalysisFormat: analysis.dominantFormat ?? "",
        pdfAnalysisOrientation: analysis.orientation ?? "",
        pdfAnalysisColorPageCount: String(analysis.colorPages.length),
        pdfAnalysisBwPageCount: String(analysis.bwPages.length),
        pdfAnalysisColorPages: analysis.colorPages.join(","),
        pdfAnalysisBwPages: analysis.bwPages.join(",")
      } : {})
    }));
  }, [analysis]);

  const normalizedConfig = useMemo(() => sanitizeConfiguration(properties, {
    ...validConfig,
    auflage: String(currentQuantity)
  }), [currentQuantity, properties, validConfig]);
  const embossingSelection = useMemo(() => resolveEmbossingSelection(normalizedConfig), [normalizedConfig]);
  const embossingActive = embossingActiveFromValue(embossingSelection?.value);
  const embossingColor = embossingColorFromValue(embossingSelection?.value);
  const effectiveEmbossingLineCount = finalizedEmbossing?.lineCount ?? draftEmbossingLineCount;
  const pricedProduct = useMemo(
    () => productWithEmbossingLinePricing(product, embossingSelection, effectiveEmbossingLineCount),
    [effectiveEmbossingLineCount, embossingSelection, product]
  );
  const pricingConfig = useMemo(() => ({
    ...normalizedConfig,
    ...(finalizedEmbossing?.cartConfig ?? {}),
    resolvedEmbossingLineCount: effectiveEmbossingLineCount > 0 ? String(effectiveEmbossingLineCount) : normalizedConfig.resolvedEmbossingLineCount
  }), [effectiveEmbossingLineCount, finalizedEmbossing, normalizedConfig]);
  const pricingQuantities = useMemo(() => (
    pdfEnabled
      ? pricingQuantitiesForProductDocument(pricedProduct, [], pricingConfig, currentQuantity) ?? {
        propertyQuantity: currentQuantity,
        copies: currentQuantity,
        frontCovers: currentQuantity,
        backCovers: currentQuantity,
        printedCoverSides: currentQuantity * 2,
        embossingLines: effectiveEmbossingLineCount * currentQuantity,
        perOrder: 1
      }
      : undefined
  ), [currentQuantity, effectiveEmbossingLineCount, pdfEnabled, pricingConfig, pricedProduct]);
  const priceSnapshot = useMemo(() => calculateConfiguredProductPrice(pricedProduct, currentQuantity, pricingConfig, pricingQuantities), [currentQuantity, pricingConfig, pricingQuantities, pricedProduct]);
  const embossingOptionPrice = useMemo(() => {
    const line = priceSnapshot.lines.find((entry) => /prägung|praegung/i.test(entry.label));
    return line?.price ?? 0;
  }, [priceSnapshot.lines]);
  const discount = useMemo(() => applyStudentDiscount({
    subtotal: priceSnapshot.total,
    product,
    user: studentVerified ? { studentVerification: { status: "approved" } } : null,
    percent: studentDiscountPercent
  }), [priceSnapshot.total, product, studentDiscountPercent, studentVerified]);
  const visibleProperties = properties.filter((property) => isStudentPropertyVisible(property, properties, normalizedConfig));
  const standardProperties = visibleProperties.filter((property) => !property.display?.advanced);
  const advancedProperties = visibleProperties.filter((property) => property.display?.advanced);
  const summary = visibleProperties.map((property) => {
    const selected = enabledValues(property).find((value) => value.value === normalizedConfig[propertyKey(property)]);
    return selected ? { label: property.name, value: valueLabel(selected) } : null;
  }).filter(Boolean) as Array<{ label: string; value: string }>;
  const handleEmbossingFinalized = useCallback((design: FinalizedEmbossing | null) => {
    setFinalizedEmbossing(design);
  }, []);

  function updateProperty(property: ProductPricingProperty, value: string) {
    setConfig((current) => sanitizeConfiguration(properties, { ...current, [propertyKey(property)]: value }));
    if (/prägung|praegung/i.test(property.name)) {
      setFinalizedEmbossing(null);
      setDraftEmbossingLineCount(0);
    }
  }

  function updateQuantity(value: string) {
    setConfig((current) => ({ ...current, auflage: String(Math.max(1, Math.round(Number(value) || 1))) }));
  }

  async function handleFile(file?: File) {
    setMessage("");
    setCartMessage("");
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
      const browser = await analyzePdfInBrowser(file, serverAnalysis, pdfConfig.previewMode !== "none");
      setAnalysis(browser.analysis);
      setThumbnails(browser.thumbnails);
      setUploadState("done");
    } catch (error) {
      setUploadState("error");
      setAnalysis(null);
      setMessage(error instanceof Error ? error.message : "Die PDF konnte nicht analysiert werden.");
    }
  }

  function addToCart() {
    setCartMessage("");
    if (pdfRequired && !analysis?.valid) {
      setCartMessage("Bitte lade zuerst eine geprüfte PDF hoch.");
      return;
    }
    if (embossingActive && !finalizedEmbossing) {
      setCartMessage("Bitte schließe die Prägegestaltung ab, bevor du bestellst.");
      return;
    }
    const authoritativeConfig: ProductConfiguration = { ...pricingConfig };
    if (analysis?.valid) {
      authoritativeConfig.pdfAnalysisStatus = "success";
      authoritativeConfig.pdfAnalysisFileUrl = analysis.fileUrl ?? "";
      authoritativeConfig.pdfAnalysisFileName = analysis.fileName;
      authoritativeConfig.pdfAnalysisWidthMm = String(analysis.widthMm ?? "");
      authoritativeConfig.pdfAnalysisHeightMm = String(analysis.heightMm ?? "");
    }
    const authoritativePrice = calculateConfiguredProductPrice(pricedProduct, currentQuantity, authoritativeConfig, pricingQuantities);
    const authoritativeDiscount = applyStudentDiscount({
      subtotal: authoritativePrice.total,
      product,
      user: studentVerified ? { studentVerification: { status: "approved" } } : null,
      percent: studentDiscountPercent
    });
    const selectedConfig = Object.fromEntries([
      ["Menge", String(currentQuantity)],
      ...(analysis ? [
        ["Datei", analysis.fileName],
        ["PDF-Seiten", String(analysis.pages)],
        ["Format", analysis.dominantFormat ?? "PDF"],
        ["Farbseiten", String(analysis.colorPages.length)],
        ["SW-Seiten", String(analysis.bwPages.length)]
      ] as Array<[string, string]> : []),
      ...(finalizedEmbossing ? [
        ["Prägezeilen", String(finalizedEmbossing.lineCount)],
        ["Prägung gespeichert", "Ja"],
        ["Produktions-PDF", finalizedEmbossing.productionPdfUrl ?? "-"],
        ["Prägetext", finalizedEmbossing.cartConfig.PraegungText ?? "-"]
      ] as Array<[string, string]> : []),
      ...authoritativePrice.lines.map((line) => [line.label, `${line.value}${line.price ? ` (+${formatEuro(line.price)})` : ""}`] as [string, string])
    ]);
    const existing = JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<any>;
    existing.push({
      slug: product.slug,
      name: product.name,
      quantity: 1,
      category: product.category,
      unitPrice: authoritativeDiscount.total,
      normalUnitPrice: authoritativePrice.total,
      pricingConfig: authoritativeConfig,
      studentDiscountEligible: product.studentDiscountEligible !== false,
      printCheckRequested: false,
      printCheckFee: 0,
      printCheckFileName: analysis?.fileName,
      printCheckFileUrl: analysis?.fileUrl,
      config: selectedConfig
    });
    localStorage.setItem("dud_cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("dud-cart-updated"));
    setCartMessage("Dein Druckauftrag wurde in den Warenkorb gelegt.");
  }

  return (
    <section className="min-h-screen bg-[#fafaf8] py-6 md:py-8">
      <div className="mx-auto w-[min(100%-24px,1520px)]">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
          <Link href="/studenten" className="hover:text-brand-blue">Schule & Studium</Link>
          <span>/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <div className="rounded-lg border border-[#e8e8e5] bg-white p-5 md:p-7">
              <Badge variant="outline" className="border-brand-blue/20 bg-brand-mist text-brand-blue">1 Datei</Badge>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#181818] md:text-5xl">{product.name}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#6b6b6b]">PDF hochladen, wenige Optionen wählen und Preis sehen.</p>
              {pdfEnabled ? (
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
                  className={dragging ? "mt-6 block cursor-pointer rounded-lg border-2 border-dashed border-brand-blue bg-brand-mist p-8 text-center" : "mt-6 block cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-[#fafaf8] p-8 text-center transition hover:border-brand-blue hover:bg-brand-mist/40"}
                >
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
                  {uploadState === "uploading" || uploadState === "analyzing" ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-blue" /> : <UploadCloud className="mx-auto h-10 w-10 text-brand-blue" />}
                  <p className="mt-3 text-lg font-black text-brand-ink">PDF hochladen</p>
                  <p className="mt-1 text-sm text-slate-600">oder Datei hierher ziehen</p>
                  {uploadState === "analyzing" ? <p className="mt-3 text-sm font-bold text-brand-blue">PDF wird geprüft ...</p> : null}
                </label>
              ) : null}
              {message ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
              {analysis ? <PdfAnalysisSummary analysis={analysis} thumbnails={thumbnails} /> : null}
            </div>

            <div className="rounded-lg border border-[#e8e8e5] bg-white p-5 md:p-7">
              <Badge variant="outline" className="border-brand-blue/20 bg-brand-mist text-brand-blue">2 Ausführung</Badge>
              <div className="mt-5 grid gap-5">
                {standardProperties.map((property) => (
                  <PropertyControl key={property.name} property={property} value={normalizedConfig[propertyKey(property)] ?? ""} onChange={(value) => updateProperty(property, value)} />
                ))}
                <label className="grid gap-2">
                  <span className="text-sm font-black text-brand-ink">Menge</span>
                  <input type="number" min={1} value={currentQuantity} onChange={(event) => updateQuantity(event.target.value)} className="h-12 max-w-40 rounded-md border bg-white px-3 text-sm font-semibold" />
                </label>
              </div>
              {advancedProperties.length ? (
                <div className="mt-6 border-t border-[#e8e8e5] pt-5">
                  <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="flex w-full items-center justify-between text-left text-sm font-black text-brand-ink">
                    Weitere Druckoptionen
                    <ChevronDown className={advancedOpen ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} />
                  </button>
                  {advancedOpen ? (
                    <div className="mt-5 grid gap-5">
                      {advancedProperties.map((property) => (
                        <PropertyControl key={property.name} property={property} value={normalizedConfig[propertyKey(property)] ?? ""} onChange={(value) => updateProperty(property, value)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {embossingActive ? (
              <div className="rounded-lg border border-[#e8e8e5] bg-white p-5 md:p-7">
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Grafik & Prägung</Badge>
                <h2 className="mt-4 text-2xl font-semibold text-[#181818]">Prägung gestalten</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b6b]">Modernes Cover gestalten, Logo oder eigene Grafik hochladen und Produktionsdatei abschließen.</p>
                {authenticated ? (
                  <div className="mt-5">
                    <EmbossingConfigurator
                      productId={product.slug}
                      embossingColor={embossingColor}
                      authenticated={authenticated}
                      currentEmbossingPrice={embossingOptionPrice}
                      onFinalized={handleEmbossingFinalized}
                      onLineCountChange={setDraftEmbossingLineCount}
                      presentation="wide"
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-950">Präge-Cover-Generator</p>
                    <p className="mt-1 text-xs leading-5 text-amber-900">Für Grafik-Upload, Modern-Style und finale Produktionsdatei ist ein Kundenkonto erforderlich.</p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3 bg-amber-700 hover:bg-amber-800"
                      onClick={() => {
                        sessionStorage.setItem(`dud_pending_student_config:${product.slug}`, JSON.stringify(normalizedConfig));
                        window.location.href = `/login?next=${encodeURIComponent(`/studenten/${product.slug}`)}`;
                      }}
                    >
                      Prägung konfigurieren
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-lg border border-[#e8e8e5] bg-white p-5 shadow-sm">
              {product.heroImage ? (
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-md bg-brand-mist">
                  <Image src={product.heroImage} alt={product.name} fill unoptimized={isRuntimeUploadImage(product.heroImage)} className="object-cover" sizes="360px" />
                </div>
              ) : null}
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue">3 Prüfen</p>
              <h2 className="mt-1 text-xl font-black text-brand-ink">Deine Bestellung</h2>
              <div className="mt-4 grid gap-2 text-sm">
                {analysis ? <SummaryLine label="PDF" value={`${analysis.pages} Seiten`} /> : null}
                {summary.map((entry) => <SummaryLine key={`${entry.label}-${entry.value}`} label={entry.label} value={entry.value} />)}
                {finalizedEmbossing ? <SummaryLine label="Prägezeilen" value={String(finalizedEmbossing.lineCount)} /> : null}
                <SummaryLine label="Menge" value={`${currentQuantity} ${currentQuantity === 1 ? "Exemplar" : "Exemplare"}`} />
              </div>
              <div className="my-4 h-px bg-slate-200" />
              {studentVerified && discount.discounts[0]?.amount ? (
                <div className="mb-3 grid gap-1 text-sm">
                  <SummaryLine label="Zwischensumme" value={formatEuro(priceSnapshot.total)} />
                  <SummaryLine label="Studentenrabatt" value={`-${formatEuro(discount.discounts[0].amount)}`} />
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">Gesamt</span>
                <span className="text-3xl font-black text-brand-ink">{formatEuro(discount.total)}</span>
              </div>
              <Button type="button" className="mt-5 w-full" disabled={pdfRequired && !analysis?.valid} onClick={addToCart}>
                In den Warenkorb <ArrowRight className="h-4 w-4" />
              </Button>
              {cartMessage ? <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{cartMessage}</p> : null}
            </div>
          </aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_30px_rgba(15,23,42,.12)] lg:hidden">
        <div className="mx-auto flex w-[min(100%-16px,720px)] items-center justify-between gap-3">
          <span className="text-xl font-black text-brand-ink">{formatEuro(discount.total)}</span>
          <Button type="button" disabled={pdfRequired && !analysis?.valid} onClick={addToCart}>In den Warenkorb</Button>
        </div>
      </div>
    </section>
  );
}

function PropertyControl({ property, value, onChange }: { property: ProductPricingProperty; value: string; onChange: (value: string) => void }) {
  const values = enabledValues(property);
  const control = property.display?.control ?? (values.length <= 4 ? "cards" : "select");
  const label = property.name;
  if (!values.length) return null;
  if (control === "cards") {
    return (
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-black text-brand-ink">{label}</p>
          {property.display?.helpText ? <p className="mt-1 text-xs text-slate-500">{property.display.helpText}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {values.map((option) => {
            const selected = value === option.value;
            return (
              <button key={option.value} type="button" onClick={() => onChange(option.value)} className={selected ? "overflow-hidden rounded-lg border border-brand-blue bg-brand-mist text-left ring-2 ring-brand-blue/10" : "overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-brand-blue/40"}>
                {option.image ? <img src={option.image} alt="" className="aspect-[4/3] w-full object-cover" /> : null}
                <span className="block p-4">
                  <span className="block font-black text-brand-ink">{valueLabel(option)}</span>
                  {option.description ? <span className="mt-1 block text-sm leading-5 text-slate-600">{option.description}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (control === "buttons") {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-black text-brand-ink">{label}</p>
        <div className="flex flex-wrap gap-2">
          {values.map((option) => (
            <button key={option.value} type="button" onClick={() => onChange(option.value)} className={value === option.value ? "rounded-md border border-brand-blue bg-brand-mist px-4 py-2 text-sm font-black text-brand-blue" : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-brand-blue"}>
              {valueLabel(option)}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-brand-ink">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-md border bg-white px-3 text-sm font-semibold">
        {values.map((option) => <option key={option.value} value={option.value}>{valueLabel(option)}</option>)}
      </select>
    </label>
  );
}

function PdfAnalysisSummary({ analysis, thumbnails }: { analysis: PdfAnalysis; thumbnails: Thumb[] }) {
  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="break-all text-sm font-black text-brand-ink">{analysis.fileName}</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> PDF geprüft</p>
        </div>
        <Badge variant="outline" className="border-emerald-300 bg-white text-emerald-800">PDF OK</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Seiten" value={String(analysis.pages)} />
        <Metric label="Format" value={analysis.dominantFormat ?? "PDF"} sub={analysis.widthMm && analysis.heightMm ? `${analysis.widthMm} x ${analysis.heightMm} mm` : undefined} />
        <Metric label="Ausrichtung" value={analysis.orientation === "landscape" ? "Querformat" : analysis.orientation === "portrait" ? "Hochformat" : "Erkannt"} />
      </div>
      {thumbnails.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {thumbnails.map((thumb) => (
            <div key={`${thumb.page}-${thumb.label}`} className="overflow-hidden rounded-md border border-emerald-200 bg-white">
              <img src={thumb.url} alt={`Vorschau Seite ${thumb.page}`} className="h-28 w-full object-contain" />
              <p className="border-t px-2 py-1 text-xs font-bold text-slate-600">{thumb.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-brand-ink">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function StudentEmptyState() {
  return (
    <section className="container-page py-16">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-700">
        Für diesen Bereich sind momentan keine Produkte verfügbar.
      </div>
    </section>
  );
}

async function analyzePdfInBrowser(file: File, serverAnalysis: PdfAnalysis, createPreview: boolean): Promise<{ analysis: PdfAnalysis; thumbnails: Thumb[] }> {
  const pdfjs = getPdfjs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const colorPages: number[] = [];
  const thumbnails: Thumb[] = [];
  const thumbPages = createPreview ? Array.from(new Set([1, Math.min(2, pdf.numPages), pdf.numPages])).filter((page) => page >= 1 && page <= pdf.numPages) : [];

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
