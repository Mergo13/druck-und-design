"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileCheck, FileImage, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BindingConfigurationSummary } from "@/features/configurator/binding-configuration-summary";
import { PdfPageThumbnail } from "@/features/configurator/pdf/pdf-page-thumbnail";
import { PdfPreviewPanel } from "@/features/configurator/pdf/pdf-preview-panel";
import { resolveBindingConfigurationForProduct, type BindingSystem, type BindingVariant } from "@/lib/binding-resolution";
import { defaultBrochureCoverMapping, deriveProductDocumentProduction, pricingQuantitiesForProductDocument, type BrochureCoverSlot, type PrintColorMode } from "@/lib/document-production";
import { usePdfSession } from "@/lib/pdf/pdf-session";
import { isBrochureProduct, resolvePdfAnalysisMode, resolveProductPdfConfig } from "@/lib/product-configurator-profile";
import { formatProductDeliveryText } from "@/lib/product-delivery";
import { calculateConfiguredProductPrice, calculateSelectedCategoryPropertiesPrice, calculateTierPrice, calculateVariantPrice } from "@/lib/print-workflow";
import { applyStudentDiscount } from "@/lib/student-discount";
import type { PdfAnalysis } from "@/lib/student-print-config";
import { formatEuro } from "@/lib/utils";
import type { GlobalProperty, ProductCatalogItem, ProductCategoryProperty, ProductPricingProperty, ProductPropertyValue } from "@/types/print-platform";
import { EmbossingConfigurator } from "@/features/embossing/embossing-configurator";

const acceptedExtensions = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".heic", ".heif", ".svg", ".eps"];
const maxFileSize = 50 * 1024 * 1024;
const fixedQuantitySteps = [1, 10, 100, 1000, 2500, 5000, 10000];
const brochureCoverSlots: BrochureCoverSlot[] = ["U1", "U2", "U3", "U4"];
const brochureFallbackFormats = [
  { value: "pdf", label: "PDF-Format übernehmen" },
  { value: "a5-portrait", label: "DIN A5 Hochformat - 148 x 210 mm", widthMm: 148, heightMm: 210 },
  { value: "a5-landscape", label: "DIN A5 Querformat - 210 x 148 mm", widthMm: 210, heightMm: 148 },
  { value: "a4-portrait", label: "DIN A4 Hochformat - 210 x 297 mm", widthMm: 210, heightMm: 297 },
  { value: "a4-landscape", label: "DIN A4 Querformat - 297 x 210 mm", widthMm: 297, heightMm: 210 }
];

function clampAreaDimension(value: string | undefined, fallback: number, min?: number, max?: number) {
  const parsed = Number(value || fallback);
  const minValue = Number(min);
  const maxValue = Number(max);
  const lower = Number.isFinite(minValue) && minValue > 0 ? minValue : 1;
  const upper = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : undefined;
  const numeric = Number.isFinite(parsed) ? parsed : fallback;
  const lowerBounded = Math.max(numeric, lower);
  return upper === undefined ? lowerBounded : Math.min(lowerBounded, upper);
}

function normalizeAreaConfig(product: ProductCatalogItem, config: Record<string, string>) {
  if (product.pricingType !== "area") return config;
  return {
    ...config,
    areaWidthCm: String(clampAreaDimension(config.areaWidthCm, product.areaPricing?.defaultWidthCm ?? 100, product.areaPricing?.minWidthCm, product.areaPricing?.maxWidthCm)),
    areaHeightCm: String(clampAreaDimension(config.areaHeightCm, product.areaPricing?.defaultHeightCm ?? 100, product.areaPricing?.minHeightCm, product.areaPricing?.maxHeightCm))
  };
}

function formatCm(value: number) {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function brochureProperty(product: ProductCatalogItem, globalProperties: GlobalProperty[], slug: string, fallbackName: string) {
  const global = globalProperties.find((property) => property.slug === slug);
  const names = new Set([slug, fallbackName, global?.name].filter(Boolean).map((entry) => slugify(String(entry))));
  return (product.pricingProperties ?? []).find((property) => {
    const id = property.propertyId ? slugify(property.propertyId) : "";
    return id === slug || names.has(slugify(property.name));
  }) ?? null;
}

function selectedPropertyValue(config: Record<string, string>, property: ProductPricingProperty | null, fallback = "") {
  if (!property) return fallback;
  const enabled = (property.values ?? []).filter((value) => value.enabled !== false);
  return config[`eigenschaft:${property.name}`] || enabled.find((value) => value.defaultSelected)?.value || enabled[0]?.value || fallback;
}

function brochureOptionMeansSeparate(value: string) {
  return /separat|separate|mit|yes|true/i.test(value);
}

function detectedFormatLabel(analysis: PdfAnalysis | null) {
  if (!analysis?.widthMm || !analysis.heightMm) return analysis?.dominantFormat ?? "PDF-Format übernehmen";
  const orientation = analysis.orientation === "landscape" ? "Querformat" : analysis.orientation === "portrait" ? "Hochformat" : "Format";
  return `${analysis.dominantFormat ?? "PDF"} ${orientation} - ${analysis.widthMm} x ${analysis.heightMm} mm`;
}

function selectedBrochureFormatDimensions(value: string) {
  const fallback = brochureFallbackFormats.find((format) => format.value === value && format.widthMm && format.heightMm);
  if (fallback) return fallback;
  const match = value.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)/i);
  if (!match) return undefined;
  return { value, label: value, widthMm: Number(match[1]), heightMm: Number(match[2]) };
}

function withBrochureDefaults(config: Record<string, string>, analysis: PdfAnalysis | null, product: ProductCatalogItem, globalProperties: GlobalProperty[]) {
  const formatProperty = brochureProperty(product, globalProperties, "broschuere-format", "Broschüre Format");
  const coverProperty = brochureProperty(product, globalProperties, "umschlag-option", "Umschlag");
  const bindingProperty = brochureProperty(product, globalProperties, "broschuere-bindung", "Broschüre Bindung");
  const pageCount = analysis?.pages ?? (Number(config.pdfAnalysisPageCount || config.seitenanzahl || config["PDF-Seiten"] || 0) || 0);
  const defaultMapping = defaultBrochureCoverMapping(pageCount);
  const coverValue = config.brochureSeparateCover ?? selectedPropertyValue(config, coverProperty, "no-cover");
  const bindingValue = selectedPropertyValue(config, bindingProperty, config["brochureFallback:Bindung"] ?? "");
  return {
    ...config,
    brochureConfig: "true",
    seitenanzahl: String(pageCount || config.seitenanzahl || ""),
    Seitenanzahl: String(pageCount || config.Seitenanzahl || ""),
    "PDF-Seiten": String(pageCount || config["PDF-Seiten"] || ""),
    "Seiten pro Exemplar": String(pageCount || config["Seiten pro Exemplar"] || ""),
    brochureProductionFormat: config.brochureProductionFormat ?? selectedPropertyValue(config, formatProperty, "pdf"),
    brochureSeparateCover: brochureOptionMeansSeparate(coverValue) ? "yes" : "no",
    brochureBinding: bindingValue,
    brochureInnerColorMode: config.brochureInnerColorMode ?? "auto",
    brochureCoverColorMode: config.brochureCoverColorMode ?? "auto",
    brochureCoverU1: config.brochureCoverU1 ?? defaultMapping.U1,
    brochureCoverU2: config.brochureCoverU2 ?? defaultMapping.U2,
    brochureCoverU3: config.brochureCoverU3 ?? defaultMapping.U3,
    brochureCoverU4: config.brochureCoverU4 ?? defaultMapping.U4
  };
}

function propertyVisibleInProduct(property: ProductPricingProperty, properties: ProductPricingProperty[], config: Record<string, string>) {
  if (!property.visibility?.propertyId) return true;
  const dependencyId = slugify(property.visibility.propertyId);
  const dependency = properties.find((entry) => {
    const ids = [entry.propertyId, entry.name].filter(Boolean).map((value) => slugify(String(value)));
    return ids.includes(dependencyId);
  });
  const dependencyValues = (dependency?.values ?? []).filter((value) => value.enabled !== false);
  const dependencyValue = dependency
    ? config[`eigenschaft:${dependency.name}`] ?? dependencyValues.find((value) => value.defaultSelected)?.value ?? dependencyValues[0]?.value ?? ""
    : undefined;
  const actual = dependencyValue ?? config[`eigenschaft:${property.visibility.propertyId}`] ?? config[property.visibility.propertyId] ?? "";
  return property.visibility.operator === "not_equals"
    ? actual !== property.visibility.value
    : actual === property.visibility.value;
}

function sortedPricingProperties(product: ProductCatalogItem) {
  return (product.pricingProperties ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function ProductConfigurator({ product, authenticated, studentVerified = false, studentDiscountPercent = 20, globalProperties = [] }: { product: ProductCatalogItem; authenticated: boolean; studentVerified?: boolean; studentDiscountPercent?: number; globalProperties?: GlobalProperty[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstVariant = product.variants[0];
  const productOptions = useMemo(() => {
    if (!firstVariant) return [];
    return firstVariant.attributes
      .filter((attribute) => attribute.type === "select")
      .map((attribute) => ({ label: attribute.label, key: attribute.key, options: attribute.options ?? [] }));
  }, [firstVariant]);

  const quantityOptions = useMemo(() => {
    const steps = product.pricingType === "tiered" && product.priceTiers?.length
      ? product.priceTiers.flatMap((tier) => [Number(tier.fromQuantity ?? tier.quantity), Number(tier.toQuantity)]).filter(Boolean)
      : product.quantitySteps?.length
        ? product.quantitySteps
        : fixedQuantitySteps;
    return Array.from(new Set(steps)).map((step) => ({
      value: String(step),
      label: step.toLocaleString("de-DE")
    }));
  }, [product.priceTiers, product.pricingType, product.quantitySteps]);

  const pricingProperties = useMemo(() => sortedPricingProperties(product), [product]);
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (firstVariant) {
      for (const attribute of firstVariant.attributes) {
        if (attribute.type !== "select") continue;
        const selected = attribute.options?.find((option) => option.value === attribute.defaultValue);
        initial[attribute.key] = selected?.value ?? attribute.options?.[0]?.value ?? "";
      }
    }
    initial.auflage = quantityOptions[0]?.value ?? String(fixedQuantitySteps[0]);
    if (product.pricingType === "area") {
      initial.areaWidthCm = String(product.areaPricing?.defaultWidthCm ?? 100);
      initial.areaHeightCm = String(product.areaPricing?.defaultHeightCm ?? 100);
    }
    for (const property of sortedPricingProperties(product)) {
      const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
      initial[`eigenschaft:${property.name}`] = enabledValues.find((value) => value.defaultSelected)?.value ?? enabledValues[0]?.value ?? "";
    }
    return initial;
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>();
  const [pdfAnalysis, setPdfAnalysis] = useState<PdfAnalysis | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [categoryProperties, setCategoryProperties] = useState<ProductCategoryProperty[]>([]);
  const [bindingConfig, setBindingConfig] = useState<{ bindingSystems: BindingSystem[]; bindingVariants: BindingVariant[] } | null>(null);
  const [finalizedEmbossing, setFinalizedEmbossing] = useState<{
    id: string;
    cartConfig: Record<string, string>;
    lineCount: number;
    previewUrl?: string;
    productionPdfUrl?: string;
  } | null>(null);
  const isBrochure = isBrochureProduct(product);
  const currentQuantity = Math.max(1, Math.round(Number(config.auflage ?? fixedQuantitySteps[0]) || 1));
  const configForPricing = useMemo(() => isBrochure ? withBrochureDefaults(config, pdfAnalysis, product, globalProperties) : config, [config, globalProperties, isBrochure, pdfAnalysis, product]);
  const pdfConfig = useMemo(() => resolveProductPdfConfig(product), [product]);
  const pdfSession = usePdfSession(uploadedFile);
  const pdfAnalysisMode = resolvePdfAnalysisMode(product);
  const pdfAnalysisEnabled = pdfAnalysisMode !== "disabled";
  const pdfAnalysisRequired = pdfAnalysisMode === "required";
  const pdfAnalysisBlocking = pdfAnalysisRequired && !pdfAnalysis?.valid;
  const normalizedConfig = useMemo(() => normalizeAreaConfig(product, configForPricing), [configForPricing, product]);
  const documentProduction = deriveProductDocumentProduction(product, categoryProperties, normalizedConfig, currentQuantity);
  const pricingQuantities = pdfAnalysisEnabled ? pricingQuantitiesForProductDocument(product, categoryProperties, normalizedConfig, currentQuantity) : undefined;
  const printColorMode = documentProduction.printColorMode;
  const bindingResolution = useMemo(() => resolveBindingConfigurationForProduct({
    product,
    categoryProperties,
    config: normalizedConfig,
    quantity: currentQuantity,
    bindingSystems: bindingConfig?.bindingSystems,
    bindingVariants: bindingConfig?.bindingVariants
  }), [bindingConfig, categoryProperties, currentQuantity, normalizedConfig, product]);
  const minAreaWidthCm = product.areaPricing?.minWidthCm && product.areaPricing.minWidthCm > 0 ? product.areaPricing.minWidthCm : 1;
  const minAreaHeightCm = product.areaPricing?.minHeightCm && product.areaPricing.minHeightCm > 0 ? product.areaPricing.minHeightCm : 1;
  const areaBelowMinimum = product.pricingType === "area" && (
    Number(config.areaWidthCm) < minAreaWidthCm ||
    Number(config.areaHeightCm) < minAreaHeightCm
  );

  useEffect(() => {
    return () => {
      if (mockupUrl) URL.revokeObjectURL(mockupUrl);
    };
  }, [mockupUrl]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`dud_pending_config:${product.slug}`);
    if (!stored) return;
    try {
      const restored = JSON.parse(stored) as Record<string, string>;
      setConfig((current) => ({ ...current, ...restored }));
    } catch {
      // ignore invalid browser state
    }
    sessionStorage.removeItem(`dud_pending_config:${product.slug}`);
  }, [product.slug]);

  useEffect(() => {
    const preset = searchParams.get("studentPreset");
    if (!preset) return;
    setConfig((current) => applyStudentProductPreset(product, categoryProperties, current, preset));
  }, [categoryProperties, product, searchParams]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/catalog/categories");
        if (!res.ok) return;
        const categories = await res.json() as Array<{ slug: string; properties?: ProductCategoryProperty[] }>;
        const category = categories.find((entry) => entry.slug === product.category);
        setCategoryProperties(category?.properties ?? []);
      } catch {
        setCategoryProperties([]);
      }
    })();
  }, [product.category]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/production/bindings");
        if (!res.ok) return;
        setBindingConfig(await res.json() as { bindingSystems: BindingSystem[]; bindingVariants: BindingVariant[] });
      } catch {
        setBindingConfig(null);
      }
    })();
  }, []);

  const enabledProperties = useMemo(() => {
    if (product.pricingProperties?.length) {
      return [];
    }
    const enabled = new Set(product.enabledCategoryProperties ?? []);
    if (!enabled.size) return [];
    return categoryProperties.filter((property) => enabled.has(property.name) && property.values.length > 0);
  }, [categoryProperties, product.enabledCategoryProperties]);
  const hasConfiguredPrintColorProperty = useMemo(() => {
    if (isBrochure) return true;
    const names = [
      ...pricingProperties.map((property) => property.name),
      ...enabledProperties.map((property) => property.name),
      ...productOptions.map((option) => option.label)
    ].join(" ");
    return /druckart|farbmodus|farbe.*sw|schwarz.*weiß|schwarz.*weiss|color/i.test(names);
  }, [enabledProperties, isBrochure, pricingProperties, productOptions]);
  const currentPrice = useMemo(() => {
    const quantity = Number.isFinite(currentQuantity) ? currentQuantity : 1;
    if (product.pricingType === "tiered" || product.pricingType === "area" || product.pricingProperties?.length) {
      return calculateConfiguredProductPrice(product, quantity, normalizedConfig, pdfAnalysisEnabled ? pricingQuantitiesForProductDocument(product, categoryProperties, normalizedConfig, quantity) : undefined).total;
    }
    const productPrice = firstVariant
      ? calculateVariantPrice(product, firstVariant.id, quantity, config)
      : product.basePrice;
    return Math.round((productPrice + calculateSelectedCategoryPropertiesPrice(enabledProperties, quantity, config)) * 100) / 100;
  }, [categoryProperties, config, currentQuantity, enabledProperties, firstVariant, normalizedConfig, pdfAnalysisEnabled, product]);
  const priceSnapshot = useMemo(() => calculateConfiguredProductPrice(product, currentQuantity, {
    ...normalizedConfig,
    ...(finalizedEmbossing?.cartConfig ?? {}),
    resolvedEmbossingLineCount: finalizedEmbossing ? String(finalizedEmbossing.lineCount) : normalizedConfig.resolvedEmbossingLineCount
  }, pricingQuantities), [currentQuantity, finalizedEmbossing, normalizedConfig, pricingQuantities, product]);
  const embossingSelection = useMemo(() => resolveEmbossingSelection(config), [config]);
  const embossingActive = Boolean(embossingSelection && !/keine|ohne/i.test(embossingSelection.value));
  const embossingColor = embossingColorFromValue(embossingSelection?.value);
  const brochureProperties = useMemo(() => ({
    format: brochureProperty(product, globalProperties, "broschuere-format", "Broschüre Format"),
    coverOption: brochureProperty(product, globalProperties, "umschlag-option", "Umschlag"),
    coverMaterial: brochureProperty(product, globalProperties, "umschlag-material", "Umschlag Material"),
    coverFinishing: brochureProperty(product, globalProperties, "umschlag-veredelung", "Umschlag Veredelung"),
    innerMaterial: brochureProperty(product, globalProperties, "innenteil-material", "Innenteil Material"),
    binding: brochureProperty(product, globalProperties, "broschuere-bindung", "Broschüre Bindung"),
    corners: brochureProperty(product, globalProperties, "broschuere-ecken", "Broschüre Ecken")
  }), [globalProperties, product]);
  const brochureSeparateCover = isBrochure && "separateCover" in documentProduction ? documentProduction.separateCover : false;
  const brochureCoverMapping = isBrochure && "coverMapping" in documentProduction ? documentProduction.coverMapping : defaultBrochureCoverMapping(pdfAnalysis?.pages ?? 0);
  const brochureBlankProductionPages = isBrochure && "blankProductionPages" in documentProduction ? documentProduction.blankProductionPages : 0;
  const brochureValidation = isBrochure && "validation" in documentProduction ? documentProduction.validation : { valid: true, errors: [], warnings: [] };
  const selectedFormat = normalizedConfig.brochureProductionFormat ?? "pdf";
  const brochureFormatKey = brochureProperties.format ? `eigenschaft:${brochureProperties.format.name}` : "";
  const brochureCoverOptionKey = brochureProperties.coverOption ? `eigenschaft:${brochureProperties.coverOption.name}` : "";
  const selectedFormatDimensions = selectedBrochureFormatDimensions(selectedFormat);
  const productionFormatMismatch = Boolean(isBrochure && pdfAnalysis?.widthMm && pdfAnalysis.heightMm && selectedFormatDimensions && (
    Math.abs(selectedFormatDimensions.widthMm! - pdfAnalysis.widthMm) > 2 ||
    Math.abs(selectedFormatDimensions.heightMm! - pdfAnalysis.heightMm) > 2
  ));
  const productionFormatConfirmed = normalizedConfig.brochureFormatScalingConfirmed === "true" || !productionFormatMismatch;
  const brochureTotalPages = isBrochure && "pdfPagesPerCopy" in documentProduction ? documentProduction.pdfPagesPerCopy : documentProduction.pagesPerCopy;
  const brochureProductionPageCount = isBrochure && "productionPageCount" in documentProduction ? documentProduction.productionPageCount : brochureTotalPages;
  const brochurePageMinimumInvalid = isBrochure && brochureTotalPages > 0 && brochureTotalPages < (pdfConfig.minPages ?? 4);
  const brochureProductionInvalid = isBrochure && !brochureValidation.valid;
  const configuratorBlocking = pdfAnalysisBlocking || brochurePageMinimumInvalid || brochureProductionInvalid || (isBrochure && !productionFormatConfirmed);
  const pdfPageSizesConsistent = !pdfAnalysis?.pageSizes?.length || pdfAnalysis.pageSizes.every((page) => (
    Math.abs(page.widthMm - pdfAnalysis.pageSizes[0].widthMm) <= 2 &&
    Math.abs(page.heightMm - pdfAnalysis.pageSizes[0].heightMm) <= 2
  ));
  const embossingOptionPrice = useMemo(() => {
    const line = priceSnapshot.lines.find((entry) => /prägung|praegung/i.test(entry.label));
    return line?.price ?? 0;
  }, [priceSnapshot.lines]);
  const handleEmbossingFinalized = useCallback((design: typeof finalizedEmbossing) => {
    setFinalizedEmbossing(design);
  }, []);
  const tierBreakdown = useMemo(() => {
    if (product.pricingType !== "tiered") return null;
    try {
      return calculateTierPrice(pricingQuantities?.baseQuantity ?? currentQuantity, product.priceTiers);
    } catch {
      return null;
    }
  }, [currentQuantity, pricingQuantities, product.priceTiers, product.pricingType]);
  const studentDiscount = useMemo(() => applyStudentDiscount({
    subtotal: currentPrice,
    product,
    user: studentVerified ? { studentVerification: { status: "approved" } } : null,
    percent: studentDiscountPercent
  }), [currentPrice, product, studentDiscountPercent, studentVerified]);
  const studentDiscountAmount = studentDiscount.discounts[0]?.amount ?? 0;
  const displayedTotal = studentDiscount.total;

  function applyPdfAnalysis(analysis: PdfAnalysis) {
    setPdfAnalysis(analysis);
    setUploadedFileUrl(analysis.fileUrl);
    setConfig((current) => ({
      ...current,
      seitenanzahl: String(analysis.pages),
      Seitenanzahl: String(analysis.pages),
      "PDF-Seiten": String(analysis.pages),
      "Seiten pro Exemplar": String(analysis.pages),
      PDFFormat: analysis.dominantFormat ?? current.PDFFormat ?? "",
      PDFAusrichtung: analysis.orientation === "landscape" ? "Querformat" : analysis.orientation === "portrait" ? "Hochformat" : analysis.orientation === "square" ? "Quadratisch" : current.PDFAusrichtung ?? "",
      pdfAnalysisColorPageCount: String(analysis.colorPages.length),
      pdfAnalysisBwPageCount: String(analysis.bwPages.length),
      pdfAnalysisColorPages: analysis.colorPages.join(","),
      pdfAnalysisBwPages: analysis.bwPages.join(","),
      printColorMode: current.printColorMode ?? (analysis.colorPages.length > 0 ? "auto" : "black_white")
    }));
  }

  function commitAreaDimension(field: "areaWidthCm" | "areaHeightCm") {
    if (product.pricingType !== "area") return;
    const isWidth = field === "areaWidthCm";
    const value = clampAreaDimension(
      config[field],
      isWidth ? product.areaPricing?.defaultWidthCm ?? 100 : product.areaPricing?.defaultHeightCm ?? 100,
      isWidth ? product.areaPricing?.minWidthCm : product.areaPricing?.minHeightCm,
      isWidth ? product.areaPricing?.maxWidthCm : product.areaPricing?.maxHeightCm
    );
    setConfig((current) => ({ ...current, [field]: String(value) }));
  }

  async function readFilePreview(file: File) {
    const fileName = file.name.toLowerCase();
    let widthPx: number | undefined;
    let heightPx: number | undefined;

    if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "tif", "tiff", "webp"].some(ext => fileName.endsWith(ext))) {
      try {
        setMockupUrl(URL.createObjectURL(file));
        const dimensions = await getImageDimensions(file);
        widthPx = dimensions?.width;
        heightPx = dimensions?.height;
      } catch (err) {
        console.error("Failed to get image dimensions", err);
      }
    } else {
      if (mockupUrl) URL.revokeObjectURL(mockupUrl);
      setMockupUrl("");
    }
    return { fileName, widthPx, heightPx };
  }

  async function validateAndSetFile(file?: File) {
    setUploadError("");
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAllowed = acceptedExtensions.some((extension) => fileName.endsWith(extension));

    if (!isAllowed) {
      setUploadedFile(null);
      setUploadError("Bitte laden Sie eine PDF-, AI-, PSD-, EPS-, PNG-, JPG-, TIFF-, HEIC- oder WebP-Datei hoch.");
      return;
    }

    if (file.size > maxFileSize) {
      setUploadedFile(null);
      setUploadError("Die Datei ist zu groß. Maximal 50 MB erlaubt.");
      return;
    }

    setUploadedFile(file);
    setUploadedFileUrl(undefined);
    setPdfAnalysis(null);
    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
    if (pdfAnalysisRequired && !isPdf) {
      setUploadedFile(null);
      setUploadError("Für dieses Produkt ist eine gültige PDF-Analyse erforderlich. Bitte laden Sie eine PDF-Datei hoch.");
      return;
    }

    if (pdfAnalysisEnabled && isPdf) {
      setIsAnalyzingPdf(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/uploads/student-document", { method: "POST", body: form });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.message ?? "PDF konnte nicht analysiert werden.");
        applyPdfAnalysis(payload.analysis as PdfAnalysis);
      } catch (error) {
        setUploadedFile(null);
        setUploadError(error instanceof Error ? error.message : "PDF konnte nicht analysiert werden.");
        return;
      } finally {
        setIsAnalyzingPdf(false);
      }
    }
    await readFilePreview(file);
  }

  async function uploadPrintFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/uploads/print-file", { method: "POST", body: formData });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Datei-Upload fehlgeschlagen." }));
      throw new Error(payload.message ?? "Datei-Upload fehlgeschlagen.");
    }
    return response.json() as Promise<{ url: string; name: string; size?: number; mimeType?: string }>;
  }

  async function addToCart() {
    if (embossingActive && !finalizedEmbossing) {
      setCartMessage("Bitte schließen Sie die Prägegestaltung ab, bevor Sie das Produkt in den Warenkorb legen.");
      return false;
    }
    if (isBrochure && !productionFormatConfirmed) {
      setCartMessage("Bitte bestätigen Sie die proportionale Skalierung oder wählen Sie das PDF-Format.");
      return false;
    }
    if (isBrochure && !brochureValidation.valid) {
      setCartMessage(brochureValidation.errors[0] ?? "Bitte prüfen Sie die Broschüren-Seitenzuordnung.");
      return false;
    }
    const existing = JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<{
      slug: string;
      name: string;
      quantity: number;
      category: string;
      unitPrice?: number;
      normalUnitPrice?: number;
      pricingConfig?: Record<string, string>;
      studentDiscountEligible?: boolean;
      printCheckRequested?: boolean;
      printCheckFee?: number;
      printCheckFileName?: string;
      printCheckFileUrl?: string;
      config?: Record<string, string>;
    }>;

    let resolvedUploadedUrl = uploadedFileUrl;
    if (uploadedFile && !resolvedUploadedUrl) {
      try {
        const uploaded = await uploadPrintFile(uploadedFile);
        resolvedUploadedUrl = uploaded.url;
      } catch (error) {
        setCartMessage(error instanceof Error ? error.message : "Datei-Upload fehlgeschlagen.");
        return false;
      }
    }

    const merged = [...existing];
    const authoritativeConfig: Record<string, string> = {
      ...normalizedConfig,
      ...(finalizedEmbossing?.cartConfig ?? {}),
      resolvedEmbossingLineCount: finalizedEmbossing ? String(finalizedEmbossing.lineCount) : normalizedConfig.resolvedEmbossingLineCount
    };
    const authoritativeBindingResolution = resolveBindingConfigurationForProduct({
      product,
      categoryProperties,
      config: authoritativeConfig,
      quantity: currentQuantity,
      bindingSystems: bindingConfig?.bindingSystems,
      bindingVariants: bindingConfig?.bindingVariants
    });
    if (authoritativeBindingResolution?.status === "resolved") {
      authoritativeConfig.resolvedBindingSystem = authoritativeBindingResolution.bindingSystemId;
      authoritativeConfig.resolvedBindingSize = authoritativeBindingResolution.sizeLabel ?? "";
      authoritativeConfig.resolvedBindingDiameterMm = String(authoritativeBindingResolution.diameterMm ?? "");
      authoritativeConfig.resolvedBindingRingCount = String(authoritativeBindingResolution.ringCount ?? "");
      authoritativeConfig.resolvedBindingSheetCount = String(authoritativeBindingResolution.sheetCount);
      authoritativeConfig.resolvedBindingBlockThicknessMm = String(authoritativeBindingResolution.blockThicknessMm);
    }
    if (pdfAnalysisRequired && !pdfAnalysis?.valid) {
      setCartMessage("Bitte laden Sie zuerst eine gültige PDF hoch. Die PDF-Analyse ist für dieses Produkt erforderlich.");
      return false;
    }
    if (pdfAnalysis?.valid) {
      authoritativeConfig.pdfAnalysisStatus = "success";
      authoritativeConfig.pdfAnalysisFileUrl = pdfAnalysis.fileUrl ?? "";
      authoritativeConfig.pdfAnalysisFileName = pdfAnalysis.fileName;
      authoritativeConfig.pdfAnalysisPageCount = String(pdfAnalysis.pages);
      authoritativeConfig.pdfAnalysisWidthMm = String(pdfAnalysis.widthMm ?? "");
      authoritativeConfig.pdfAnalysisHeightMm = String(pdfAnalysis.heightMm ?? "");
      authoritativeConfig.pdfAnalysisOrientation = pdfAnalysis.orientation ?? "";
      authoritativeConfig.pdfAnalysisFormat = pdfAnalysis.dominantFormat ?? "";
      authoritativeConfig.pdfAnalysisColorPageCount = String(pdfAnalysis.colorPages.length);
      authoritativeConfig.pdfAnalysisBwPageCount = String(pdfAnalysis.bwPages.length);
      authoritativeConfig.pdfAnalysisColorPages = pdfAnalysis.colorPages.join(",");
      authoritativeConfig.pdfAnalysisBwPages = pdfAnalysis.bwPages.join(",");
    }
    if (isBrochure) {
      authoritativeConfig.brochureProductionPageCount = String(brochureProductionPageCount);
      authoritativeConfig.brochureBlankProductionPages = String(brochureBlankProductionPages);
      authoritativeConfig.brochureInnerPageCount = String(documentProduction.pagesPerCopy);
      authoritativeConfig.brochurePrintedCoverSides = "printedCoverSidesPerCopy" in documentProduction ? String(documentProduction.printedCoverSidesPerCopy) : "0";
      for (const slot of brochureCoverSlots) {
        authoritativeConfig[`brochureResolved${slot}`] = brochureCoverMapping[slot];
      }
    }
    const authoritativePricingQuantities = pdfAnalysisEnabled ? pricingQuantitiesForProductDocument(product, categoryProperties, authoritativeConfig, currentQuantity) : undefined;
    const priceSnapshot = calculateConfiguredProductPrice(product, currentQuantity, authoritativeConfig, authoritativePricingQuantities);
    const authoritativeDiscount = applyStudentDiscount({
      subtotal: priceSnapshot.total,
      product,
      user: studentVerified ? { studentVerification: { status: "approved" } } : null,
      percent: studentDiscountPercent
    });
    const authoritativeDisplayedTotal = authoritativeDiscount.total;
    const baseBreakdown = product.pricingType === "tiered"
      ? (() => {
        try {
          const tier = calculateTierPrice(authoritativePricingQuantities?.baseQuantity ?? currentQuantity, product.priceTiers);
          return `${tier.quantity} Stück × ${formatEuro(tier.unitPrice)} / Stück = ${formatEuro(tier.totalPrice)}`;
        } catch {
          return formatEuro(priceSnapshot.basePrice);
        }
      })()
      : formatEuro(priceSnapshot.basePrice);
    const selectedConfig = Object.fromEntries([
      ["Menge", String(currentQuantity)],
      ...(isBrochure ? [
        ["Auflage", String(currentQuantity)],
        ["Produktionsformat", selectedFormat === "pdf" ? detectedFormatLabel(pdfAnalysis) : selectedFormat],
        ["PDF-Seiten", String(pdfAnalysis?.pages ?? ("pdfPagesPerCopy" in documentProduction ? documentProduction.pdfPagesPerCopy : documentProduction.pagesPerCopy))],
        ["Umschlag", brochureSeparateCover ? "Separater Umschlag" : "Kein separater Umschlag"],
        ...(brochureSeparateCover ? brochureCoverSlots.map((slot) => [`${slot}`, brochureCoverMapping[slot] === "blank" ? "Leer" : `PDF Seite ${brochureCoverMapping[slot]}`] as [string, string]) : []),
        ["Innenteil", `${documentProduction.pagesPerCopy} Seiten`],
        ["Produktionsseiten", String(brochureProductionPageCount)],
        ["Automatisch ergänzte Leerseiten", String(brochureBlankProductionPages)]
      ] as Array<[string, string]> : []),
      ...(pdfAnalysisEnabled && documentProduction.pagesPerCopy > 0 ? [
        ["Seiten pro Exemplar", String(documentProduction.pagesPerCopy)],
        ["Druckseiten gesamt", String(documentProduction.totalPrintedPages)],
        ["Druckart", printColorModeLabel(documentProduction.printColorMode)],
        ["SW-Seiten gesamt", String(documentProduction.totalBlackWhitePages)],
        ["Farbseiten gesamt", String(documentProduction.totalColorPages)],
        ["Blätter pro Exemplar", String(documentProduction.sheetsPerCopy)],
        ["Blätter gesamt", String(documentProduction.totalSheets)]
      ] as Array<[string, string]> : []),
      ["Grundpreis", baseBreakdown],
      ...(finalizedEmbossing ? [
        ["Prägezeilen", String(finalizedEmbossing.lineCount)],
        ["Prägung gespeichert", "✓"],
        ["Produktions-PDF", finalizedEmbossing.productionPdfUrl ?? "-"],
        ["Prägetext", finalizedEmbossing.cartConfig.PraegungText ?? "-"]
      ] as Array<[string, string]> : []),
      ...(authoritativeBindingResolution?.status === "resolved" ? [
        ["Bindungssystem", authoritativeBindingResolution.bindingSystemLabel],
        ["Bindungsgröße", authoritativeBindingResolution.sizeLabel ?? "-"],
        ["Bindungs-Blattzahl", String(authoritativeBindingResolution.sheetCount)],
        ["Blockstärke", `${authoritativeBindingResolution.blockThicknessMm.toLocaleString("de-DE")} mm`],
        ...(authoritativeBindingResolution.ringCount ? [["Ringe", String(authoritativeBindingResolution.ringCount)] as [string, string]] : [])
      ] as Array<[string, string]> : []),
      ...priceSnapshot.lines.map((line) => [line.label, `${line.value}${line.price ? ` (+${formatEuro(line.price)})` : ""}`])
    ]);
    const found = merged.find((entry) => entry.slug === product.slug && JSON.stringify(entry.pricingConfig ?? {}) === JSON.stringify(authoritativeConfig));
    if (found) {
      found.quantity += 1;
      found.unitPrice = authoritativeDisplayedTotal;
      found.normalUnitPrice = priceSnapshot.total;
      found.config = selectedConfig;
      found.pricingConfig = authoritativeConfig;
      found.studentDiscountEligible = product.studentDiscountEligible !== false;
      if (uploadedFile) {
        found.printCheckFileName = uploadedFile.name;
        found.printCheckFileUrl = resolvedUploadedUrl ?? found.printCheckFileUrl;
      }
    } else {
      merged.push({
        slug: product.slug,
        name: product.name,
        quantity: 1,
        category: product.category,
        unitPrice: authoritativeDisplayedTotal,
        normalUnitPrice: priceSnapshot.total,
        pricingConfig: authoritativeConfig,
        studentDiscountEligible: product.studentDiscountEligible !== false,
        printCheckRequested: false,
        printCheckFee: 0,
        printCheckFileName: uploadedFile?.name,
        printCheckFileUrl: resolvedUploadedUrl,
        config: selectedConfig
      });
    }
    localStorage.setItem("dud_cart", JSON.stringify(merged));
    window.dispatchEvent(new Event("dud-cart-updated"));
    setCartMessage("Produkt wurde in den Warenkorb gelegt.");
    return true;
  }

  function renderBrochurePropertySelect(property: ProductPricingProperty | null, label: string, fallbackOptions: Array<{ value: string; label: string }>, hidden = false) {
    if (hidden) return null;
    const options = property
      ? (property.values ?? []).filter((value) => value.enabled !== false).map((value) => ({
        value: value.value,
        label: value.labelOverride || value.label || value.value
      }))
      : fallbackOptions;
    if (!options.length) return null;
    const key = property ? `eigenschaft:${property.name}` : `brochureFallback:${label}`;
    const value = property ? (config[key] ?? options[0]?.value ?? "") : (config[key] ?? options[0]?.value ?? "");
    return (
      <label className="grid gap-2" key={key}>
        <span className="text-sm font-bold">{label}</span>
        <select
          suppressHydrationWarning
          value={value}
          onChange={(event) => {
            if (property) setConfig({ ...config, [key]: event.target.value });
            else setConfig({ ...config, [key]: event.target.value });
          }}
          className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  }

  function renderPropertyControl(property: ProductPricingProperty) {
    if (!propertyVisibleInProduct(property, pricingProperties, config)) return null;
    const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
    if (!enabledValues.length) return null;
    const key = `eigenschaft:${property.name}`;
    const value = config[key] ?? enabledValues.find((entry) => entry.defaultSelected)?.value ?? enabledValues[0]?.value ?? "";
    const setValue = (nextValue: string) => setConfig({ ...config, [key]: nextValue });
    const control = property.display?.control ?? "select";
    const labelFor = (option: ProductPropertyValue) => option.labelOverride || option.label || option.value;
    const shortChoices = enabledValues.length <= 8 && enabledValues.every((option) => labelFor(option).length <= 28);
    const choiceButton = (option: ProductPropertyValue, card = false) => {
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => setValue(option.value)}
          className={selected
            ? card
              ? "grid gap-2 rounded-md border border-brand-blue bg-brand-mist p-3 text-left text-sm font-bold text-brand-blue"
              : "rounded-md border border-brand-blue bg-brand-mist px-3 py-2 text-sm font-bold text-brand-blue"
            : card
              ? "grid gap-2 rounded-md border border-slate-200 bg-white p-3 text-left text-sm font-bold text-slate-700 hover:border-brand-blue"
              : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-brand-blue"}
        >
          {card && option.image ? (
            <span className="block overflow-hidden rounded border border-slate-200 bg-slate-50">
              <img src={option.image} alt="" className="aspect-[4/3] w-full object-cover" />
            </span>
          ) : null}
          <span>{labelFor(option)}</span>
          {card && option.description ? <span className="text-xs font-semibold text-slate-500">{option.description}</span> : null}
        </button>
      );
    };

    return (
      <div className="grid gap-2" key={`product-property-${property.name}`}>
        <span className="text-sm font-bold">{property.name}</span>
        {property.display?.helpText ? <span className="text-xs font-semibold text-slate-500">{property.display.helpText}</span> : null}
        {control === "buttons" && shortChoices ? (
          <div className="flex flex-wrap gap-2">{enabledValues.map((option) => choiceButton(option))}</div>
        ) : control === "cards" ? (
          <div className="grid gap-2 sm:grid-cols-2">{enabledValues.map((option) => choiceButton(option, true))}</div>
        ) : control === "radio" && shortChoices ? (
          <div className="grid gap-2">{enabledValues.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <input type="radio" checked={value === option.value} onChange={() => setValue(option.value)} />
              {labelFor(option)}
            </label>
          ))}</div>
        ) : (
          <select
            suppressHydrationWarning
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {enabledValues.map((option) => (
              <option key={option.value} value={option.value}>
                {labelFor(option)}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  const visibleStandardProperties = isBrochure ? [] : pricingProperties.filter((property) => !property.display?.advanced);
  const visibleAdvancedProperties = isBrochure ? [] : pricingProperties.filter((property) => property.display?.advanced);
  const selectedSummary = [
    ...pricingProperties.filter((property) => propertyVisibleInProduct(property, pricingProperties, config)).map((property) => {
      const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
      const selected = config[`eigenschaft:${property.name}`] || enabledValues.find((value) => value.defaultSelected)?.value || enabledValues[0]?.value || "";
      const match = enabledValues.find((value) => value.value === selected);
      return match ? { label: property.name, value: match.labelOverride || match.label || match.value } : null;
    }).filter(Boolean) as Array<{ label: string; value: string }>,
    { label: "Auflage", value: currentQuantity.toLocaleString("de-DE") }
  ];

  return (
    <aside className="sticky top-24 rounded-lg border bg-white p-5 shadow-premium lg:block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Ihr Produkt</p>
          <h2 className="text-2xl font-black">{authenticated ? formatEuro(displayedTotal) : "Preis nach Anmeldung"}</h2>
          <p className="text-sm text-muted-foreground">Konfiguration mit optionalem Datei-Upload</p>
          {authenticated && studentDiscountAmount > 0 ? (
            <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800">
              <p>✓ Studentenstatus verifiziert</p>
              <p>Normalpreis: {formatEuro(currentPrice)}</p>
              <p>Studentenpreis: {formatEuro(displayedTotal)}</p>
            </div>
          ) : null}
          {authenticated && tierBreakdown ? <p className="text-xs font-semibold text-muted-foreground">{tierBreakdown.quantity} Stück × {formatEuro(tierBreakdown.unitPrice)} / Stück = {formatEuro(tierBreakdown.totalPrice)}</p> : null}

        </div>
        <div className="rounded-md bg-muted px-3 py-2 text-right text-xs font-semibold">
          <CalendarCheck className="ml-auto h-4 w-4 text-primary" />
          {formatProductDeliveryText(product.deliveryText, config.lieferzeit)}
        </div>
      </div>
      {selectedSummary.length ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Zusammenfassung</p>
          <div className="mt-2 grid gap-1 text-sm">
            {selectedSummary.slice(0, 7).map((entry) => (
              <div key={`${entry.label}-${entry.value}`} className="flex justify-between gap-3">
                <span className="text-slate-500">{entry.label}</span>
                <span className="text-right font-bold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {productOptions.map(({ label, key, options }) => (
          <label className="grid gap-2" key={label}>
            <span className="text-sm font-bold">{label}</span>
            <select
              suppressHydrationWarning
              value={config[key]}
              onChange={(event) => setConfig({ ...config, [key]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
            </select>
          </label>
        ))}
        {pdfAnalysisEnabled ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dokument</p>
            {isAnalyzingPdf ? (
              <div className="mt-2 rounded-md border border-blue-100 bg-white p-3 text-sm font-semibold text-brand-blue">
                PDF wird gelesen. Seitenanzahl, Format und Ausrichtung werden automatisch übernommen.
              </div>
            ) : null}
            {pdfAnalysisRequired && !pdfAnalysis ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                Für dieses Produkt ist eine erfolgreiche PDF-Analyse erforderlich.
              </div>
            ) : null}
            {pdfAnalysis ? (
              <div className="mt-2 space-y-1 text-sm font-semibold text-slate-800">
                <p className="break-all text-xs text-slate-500">{pdfAnalysis.fileName}</p>
                <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {pdfAnalysis.pages} PDF-Seiten erkannt</p>
                <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {pdfAnalysis.widthMm && pdfAnalysis.heightMm ? `${pdfAnalysis.widthMm} x ${pdfAnalysis.heightMm} mm` : pdfAnalysis.dominantFormat ?? "Format erkannt"}</p>
                <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {pdfAnalysis.orientation === "landscape" ? "Querformat" : pdfAnalysis.orientation === "portrait" ? "Hochformat" : "Ausrichtung erkannt"}</p>
                {pdfConfig.showColorAnalysis ? (
                  <p className="pt-1 text-xs text-slate-500">{pdfAnalysis.colorPages.length} Farbe · {pdfAnalysis.bwPages.length} Schwarz-Weiß · Analysewerte für die Preisberechnung. Bei Bedarf bitte Druckart manuell prüfen.</p>
                ) : null}
                {pdfAnalysis.warnings.map((warning, index) => (
                  <p key={`${warning.type}-${index}`} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">{warning.message}</p>
                ))}
              </div>
            ) : null}
            <label className="mt-3 grid gap-2">
              <span className="text-sm font-bold">Seitenanzahl</span>
              <input
                suppressHydrationWarning
                type="number"
                min="1"
                step="1"
                value={config.seitenanzahl ?? ""}
                onChange={(event) => {
                  if (pdfAnalysis) return;
                  setConfig({
                    ...config,
                    seitenanzahl: event.target.value,
                    Seitenanzahl: event.target.value,
                    "Seiten pro Exemplar": event.target.value,
                    "PDF-Seiten": event.target.value
                  });
                }}
                placeholder="z.B. 26"
                readOnly={Boolean(pdfAnalysis)}
                className={pdfAnalysis ? "h-11 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-900 outline-none" : "h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"}
              />
              <span className="text-xs text-slate-500">
                {pdfAnalysis ? "Automatisch aus der PDF übernommen. Entferne die Datei, wenn du manuell ändern möchtest." : "Fallback ohne PDF. Nach PDF-Upload ist die erkannte Seitenanzahl verbindlich."}
              </span>
            </label>
          </div>
        ) : null}
        {pdfAnalysisEnabled ? <PdfPreviewPanel session={pdfSession} pdfConfig={pdfConfig} totalPages={pdfAnalysis?.pages ?? pdfSession.document?.numPages ?? 0} /> : null}
        {pdfAnalysisEnabled && !hasConfiguredPrintColorProperty ? (
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Druckart</p>
            <div className="mt-3 grid gap-2">
              {[
                { value: "black_white", label: "Alles Schwarz-Weiß" },
                { value: "full_color", label: "Alles Farbe" },
                ...(pdfAnalysis && pdfAnalysis.colorPages.length > 0 ? [{ value: "auto", label: "Farbe/SW laut PDF" }] : [])
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setConfig({ ...config, printColorMode: option.value })}
                  className={printColorMode === option.value ? "rounded-md border border-brand-blue bg-brand-mist px-3 py-2 text-left text-sm font-bold text-brand-blue" : "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-700 hover:border-brand-blue"}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <label className="grid gap-2">
          <span className="text-sm font-bold">Auflage</span>
          {product.pricingType === "tiered" ? (
            <input
              suppressHydrationWarning
              type="number"
              min="1"
              step="1"
              value={config.auflage ?? "1"}
              onChange={(event) => setConfig({ ...config, auflage: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <select
              suppressHydrationWarning
              value={config.auflage}
              onChange={(event) => setConfig({ ...config, auflage: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {quantityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>
        {isBrochure ? (
          <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Broschüre</p>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Format</span>
              <select
                suppressHydrationWarning
                value={selectedFormat}
                onChange={(event) => setConfig({
                  ...config,
                  brochureProductionFormat: event.target.value,
                  ...(brochureFormatKey ? { [brochureFormatKey]: event.target.value } : {}),
                  brochureFormatScalingConfirmed: "false"
                })}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="pdf">{detectedFormatLabel(pdfAnalysis)}</option>
                {(brochureProperties.format?.values?.filter((value) => value.enabled !== false).map((value) => ({ value: value.value, label: value.labelOverride || value.label || value.value })) ?? brochureFallbackFormats.slice(1)).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            {productionFormatMismatch ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                Das gewählte Produktionsformat weicht vom erkannten PDF-Format ab. Wir skalieren proportional, wenn Sie dies bestätigen.
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setConfig({ ...config, brochureFormatScalingConfirmed: "true" })}>Skalierung bestätigen</Button>
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => setConfig({ ...config, brochureProductionFormat: "pdf", brochureFormatScalingConfirmed: "false" })}>PDF-Format</Button>
                </div>
              </div>
            ) : null}
            <label className="grid gap-2">
              <span className="text-sm font-bold">Umschlag</span>
              <select
                suppressHydrationWarning
                value={brochureCoverOptionKey ? config[brochureCoverOptionKey] ?? (normalizedConfig.brochureSeparateCover === "yes" ? "yes" : "no") : normalizedConfig.brochureSeparateCover === "yes" ? "yes" : "no"}
                onChange={(event) => setConfig({
                  ...config,
                  brochureSeparateCover: brochureOptionMeansSeparate(event.target.value) ? "yes" : "no",
                  ...(brochureCoverOptionKey ? { [brochureCoverOptionKey]: event.target.value } : {})
                })}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {(brochureProperties.coverOption?.values?.filter((value) => value.enabled !== false).map((value) => ({ value: value.value, label: value.labelOverride || value.label || value.value })) ?? [
                  { value: "no", label: "Kein separater Umschlag" },
                  { value: "yes", label: "Separater Umschlag" }
                ]).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            {brochureSeparateCover ? (
              <>
                {pdfSession.status === "ready" ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Umschlag</p>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {brochureCoverSlots.map((slot) => {
                        const mapped = brochureCoverMapping[slot];
                        const pageNumber = Number(mapped);
                        const label = slot === "U1" ? "U1 - Außenseite vorne" : slot === "U2" ? "U2 - Innenseite vorne" : slot === "U3" ? "U3 - Innenseite hinten" : "U4 - Außenseite hinten";
                        return Number.isFinite(pageNumber) && pageNumber > 0 ? (
                          <PdfPageThumbnail key={slot} pageNumber={pageNumber} getThumbnail={pdfSession.getThumbnail} label={label} />
                        ) : (
                          <div key={slot} className="overflow-hidden rounded-md border border-dashed bg-white opacity-60">
                            <div className="flex aspect-[3/4] items-center justify-center bg-slate-100 text-xs font-bold text-slate-400">Leer</div>
                            <div className="border-t px-2 py-1 text-center text-[11px] font-bold text-slate-600">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Innenteil</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{documentProduction.pagesPerCopy} Seiten</p>
                    {"innerPages" in documentProduction ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {documentProduction.innerPages.slice(0, 40).map((page) => <span key={page} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">{page}</span>)}
                        {documentProduction.innerPages.length > 40 ? <span className="px-2 py-1 text-xs font-bold text-slate-500">...</span> : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-slate-800">Seitenzuordnung ändern</summary>
                  <div className="mt-3 grid gap-2">
                    {[
                      ["U1", "U1 Außenseite vorne"],
                      ["U2", "U2 Innenseite vorne"],
                      ["U3", "U3 Innenseite hinten"],
                      ["U4", "U4 Außenseite hinten"]
                    ].map(([slot, label]) => (
                      <label className="grid gap-1" key={slot}>
                        <span className="text-xs font-bold text-slate-600">{label}</span>
                        <select
                          suppressHydrationWarning
                          value={brochureCoverMapping[slot as BrochureCoverSlot]}
                          onChange={(event) => setConfig({ ...config, [`brochureCover${slot}`]: event.target.value })}
                          className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="blank">Leer</option>
                          {Array.from({ length: pdfAnalysis?.pages ?? 0 }, (_, index) => String(index + 1)).map((page) => (
                            <option key={page} value={page}>PDF Seite {page}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </details>
                {renderBrochurePropertySelect(brochureProperties.coverMaterial, "Umschlagmaterial", [{ value: "standard", label: "Standard" }])}
                {renderBrochurePropertySelect(brochureProperties.coverFinishing, "Umschlagveredelung", [{ value: "keine", label: "Keine Veredelung" }])}
                <label className="grid gap-2">
                  <span className="text-sm font-bold">Umschlag-Farbe</span>
                  <select suppressHydrationWarning value={config.brochureCoverColorMode ?? "auto"} onChange={(event) => setConfig({ ...config, brochureCoverColorMode: event.target.value })} className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="auto">Automatisch aus PDF</option>
                    <option value="full_color">Farbe</option>
                    <option value="black_white">Schwarz-Weiß</option>
                  </select>
                </label>
              </>
            ) : null}
            {renderBrochurePropertySelect(brochureProperties.innerMaterial, "Innenteilmaterial", [{ value: "standard", label: "Standard" }])}
            <label className="grid gap-2">
              <span className="text-sm font-bold">Innenteil-Farbe</span>
              <select suppressHydrationWarning value={normalizedConfig.brochureInnerColorMode ?? "auto"} onChange={(event) => setConfig({ ...config, brochureInnerColorMode: event.target.value, printColorMode: event.target.value })} className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="auto">Automatisch aus PDF</option>
                <option value="full_color">Alles Farbe</option>
                <option value="black_white">Alles Schwarz-Weiß</option>
              </select>
            </label>
            {renderBrochurePropertySelect(brochureProperties.binding, "Bindung", [{ value: "rueckstichheftung", label: "Rückstichheftung" }, { value: "klebebindung", label: "Klebebindung" }])}
            {renderBrochurePropertySelect(brochureProperties.corners, "Ecken", [{ value: "keine", label: "Keine abgerundeten Ecken" }, { value: "abgerundet", label: "Abgerundete Ecken" }])}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              Innenteil: {documentProduction.pagesPerCopy} Seiten
            </div>
            {pdfAnalysis?.valid ? (
              <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dateiprüfung</p>
                <div className="mt-2 grid gap-1 font-semibold">
                  <p>✓ PDF erkannt</p>
                  <p>✓ {brochureTotalPages} Seiten</p>
                  <p>✓ {detectedFormatLabel(pdfAnalysis)}</p>
                  <p>{pdfPageSizesConsistent ? "✓" : "⚠"} Seitengrößen {pdfPageSizesConsistent ? "einheitlich" : "abweichend"}</p>
                  {brochureBlankProductionPages > 0 ? (
                    <p className="text-amber-800">⚠ Für die Rückstichheftung wird ein Seitenumfang in 4er-Schritten benötigt.</p>
                  ) : (
                    <p>✓ Seitenzahl für Rückstich geeignet</p>
                  )}
                </div>
                {brochureSeparateCover ? (
                  <div className="mt-3 grid gap-1">
                    <p className="font-black">Umschlag</p>
                    {brochureCoverSlots.map((slot) => (
                      <p key={slot}>{slot}: {brochureCoverMapping[slot] === "blank" ? "Leer" : `Seite ${brochureCoverMapping[slot]}`}</p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-1">
                  <p className="font-black">Innenteil</p>
                  <p>{documentProduction.pagesPerCopy} Seiten</p>
                </div>
                <div className="mt-3 grid gap-1">
                  <p className="font-black">Produktionsumfang</p>
                  <p>{brochureProductionPageCount} Seiten</p>
                  <p>{brochureBlankProductionPages} zusätzliche Leerseiten</p>
                </div>
              </div>
            ) : null}
            {brochurePageMinimumInvalid ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
                Broschüren benötigen mindestens {pdfConfig.minPages ?? 4} PDF-Seiten.
              </div>
            ) : null}
            {brochureValidation.errors.map((error) => (
              <div key={error} className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
                {error}
              </div>
            ))}
            {brochureBlankProductionPages > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                Für die Rückstichheftung werden {brochureBlankProductionPages} zusätzliche Leerseite{brochureBlankProductionPages === 1 ? "" : "n"} benötigt. Wir ergänzen diese automatisch in der Produktionskonfiguration, ohne die hochgeladene PDF zu verändern.
              </div>
            ) : null}
          </div>
        ) : null}
        {product.pricingType === "area" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">Breite (cm)</span>
              <input
                suppressHydrationWarning
                type="number"
                min={minAreaWidthCm}
                max={product.areaPricing?.maxWidthCm && product.areaPricing.maxWidthCm > 0 ? product.areaPricing.maxWidthCm : undefined}
                step="0.1"
                value={config.areaWidthCm ?? ""}
                onChange={(event) => setConfig({ ...config, areaWidthCm: event.target.value })}
                onBlur={() => commitAreaDimension("areaWidthCm")}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">Höhe (cm)</span>
              <input
                suppressHydrationWarning
                type="number"
                min={minAreaHeightCm}
                max={product.areaPricing?.maxHeightCm && product.areaPricing.maxHeightCm > 0 ? product.areaPricing.maxHeightCm : undefined}
                step="0.1"
                value={config.areaHeightCm ?? ""}
                onChange={(event) => setConfig({ ...config, areaHeightCm: event.target.value })}
                onBlur={() => commitAreaDimension("areaHeightCm")}
                className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {areaBelowMinimum ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 sm:col-span-2">
                Die Mindestgröße für dieses Produkt beträgt {formatCm(minAreaWidthCm)} cm Breite × {formatCm(minAreaHeightCm)} cm Höhe. Kleinere Werte werden automatisch auf diese Mindestgröße korrigiert.
              </div>
            ) : null}
          </div>
        ) : null}
        {visibleStandardProperties.map((property) => renderPropertyControl(property))}
        {visibleAdvancedProperties.length ? (
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">Weitere Optionen</summary>
            <div className="mt-3 grid gap-4">
              {visibleAdvancedProperties.map((property) => renderPropertyControl(property))}
            </div>
          </details>
        ) : null}
        {enabledProperties.map((property) => (
          <label className="grid gap-2" key={`category-property-${property.name}`}>
            <span className="text-sm font-bold">{property.name}</span>
            <select
              suppressHydrationWarning
              value={config[`eigenschaft:${property.name}`] ?? normalizePropertyValue(property.values[0]).value}
              onChange={(event) => setConfig({ ...config, [`eigenschaft:${property.name}`]: event.target.value })}
              className="h-11 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {property.values.map((entry) => {
                const option = normalizePropertyValue(entry);
                return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
                );
              })}
            </select>
          </label>
        ))}
        <BindingConfigurationSummary result={bindingResolution} />
        {embossingActive ? (
          authenticated ? (
            <EmbossingConfigurator
              productId={product.slug}
              embossingColor={embossingColor}
              authenticated={authenticated}
              currentEmbossingPrice={embossingOptionPrice}
              onFinalized={handleEmbossingFinalized}
            />
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-black text-amber-950">Präge-Cover-Generator</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">Für die Gestaltung der Prägung ist ein Kundenkonto erforderlich.</p>
              <Button
                type="button"
                size="sm"
                className="mt-3 bg-amber-700 hover:bg-amber-800"
                onClick={() => {
                  sessionStorage.setItem(`dud_pending_config:${product.slug}`, JSON.stringify(config));
                  window.location.href = `/login?next=${encodeURIComponent(`/produkt/${product.slug}`)}`;
                }}
              >
                Prägung konfigurieren
              </Button>
            </div>
          )
        ) : null}
      </div>
      {pdfAnalysisEnabled && documentProduction.pagesPerCopy > 0 ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-white p-3 text-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Deine Konfiguration</p>
          <div className="mt-3 grid gap-2 text-slate-700">
            <SummaryLine label="PDF" value={`${isBrochure && "pdfPagesPerCopy" in documentProduction ? documentProduction.pdfPagesPerCopy : documentProduction.pagesPerCopy} Seiten`} />
            <SummaryLine label="Auflage" value={`${documentProduction.quantity} ${documentProduction.quantity === 1 ? "Exemplar" : "Exemplare"}`} />
            {isBrochure ? (
              <>
                <SummaryLine label="Produktionsformat" value={selectedFormat === "pdf" ? "PDF-Format übernehmen" : selectedFormat} />
                <SummaryLine label="Umschlag" value={brochureSeparateCover ? "Separater Umschlag" : "Kein separater Umschlag"} />
                {brochureSeparateCover ? brochureCoverSlots.map((slot) => (
                  <SummaryLine key={slot} label={slot} value={brochureCoverMapping[slot] === "blank" ? "Leer" : `PDF Seite ${brochureCoverMapping[slot]}`} />
                )) : null}
                <SummaryLine label="Innenteil" value={`${documentProduction.pagesPerCopy} Seiten`} />
                {brochureBlankProductionPages > 0 ? <SummaryLine label="Leerseiten" value={`${brochureBlankProductionPages} automatisch`} /> : null}
              </>
            ) : null}
            <SummaryLine label="Druckart" value={printColorModeLabel(documentProduction.printColorMode)} />
            {documentProduction.printColorMode === "auto" ? (
              <>
                <SummaryLine label="Pro Exemplar" value={`${documentProduction.blackWhitePagesPerCopy} SW · ${documentProduction.colorPagesPerCopy} Farbe`} />
                <SummaryLine label="Gesamt" value={`${documentProduction.totalBlackWhitePages} SW · ${documentProduction.totalColorPages} Farbe`} />
              </>
            ) : (
              <SummaryLine label="Druck" value={documentProduction.printColorMode === "full_color" ? `${documentProduction.totalColorPages} Farbseiten gesamt` : `${documentProduction.totalBlackWhitePages} SW-Seiten gesamt`} />
            )}
            <SummaryLine
              label={documentProduction.printSides === "duplex" ? "Beidseitig" : "Einseitig"}
              value={`${documentProduction.sheetsPerCopy} Blatt / Exemplar · ${documentProduction.totalSheets} gesamt`}
            />
            {finalizedEmbossing ? (
              <SummaryLine label="Goldprägung" value={`${finalizedEmbossing.lineCount} Prägezeilen / Exemplar · ${documentProduction.quantity} Hardcover`} />
            ) : null}
          </div>
        </div>
      ) : null}
      <label
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          validateAndSetFile(event.dataTransfer.files[0]);
        }}
        className={isDragging ? "mt-6 block cursor-pointer rounded-lg border border-dashed border-brand-blue bg-brand-mist p-5 text-center ring-2 ring-brand-blue/20" : "mt-6 block cursor-pointer rounded-lg border border-dashed bg-muted/40 p-5 text-center transition hover:border-brand-blue hover:bg-brand-mist"}
      >
        <input
          suppressHydrationWarning
          type="file"
          className="sr-only"
          accept=".pdf,.ai,.psd,.png,.jpg,.jpeg,.tif,.tiff,.heic,.heif,application/pdf,image/png,image/jpeg,image/tiff,image/heic,image/heif,image/x-adobe-photoshop,application/postscript"
          onChange={(event) => validateAndSetFile(event.target.files?.[0])}
        />
        <UploadCloud className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-2 text-sm font-bold">{uploadedFile ? uploadedFile.name : "Druckdaten / Dokument hochladen"}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {pdfAnalysisEnabled ? "PDF hochladen: Seitenanzahl, Format und Ausrichtung werden automatisch erkannt." : "Klicken oder Datei hier ablegen. Upload ist auch ohne Profi Print-Check möglich."}
        </p>
        {uploadedFile && (
          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] uppercase tracking-wider"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUploadedFile(null);
                setUploadedFileUrl(undefined);
                setPdfAnalysis(null);
                setIsAnalyzingPdf(false);
                if (mockupUrl) URL.revokeObjectURL(mockupUrl);
                setMockupUrl("");
              }}
            >
              Datei entfernen
            </Button>
          </div>
        )}
      </label>
      {(uploadError) && (
        <div className="mt-4 flex flex-col gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {uploadError}
          </div>
        </div>
      )}
      {mockupUrl ? (
        <div className="mt-4 overflow-hidden rounded-md border bg-slate-50">
          <img src={mockupUrl} alt="Live Mockup Vorschau" className="h-44 w-full object-cover" />
          <div className="border-t p-2 text-xs font-semibold text-slate-700">Live Mockup Vorschau</div>
        </div>
      ) : uploadedFile ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
          <FileImage className="h-4 w-4" />
          Dateityp ohne Bildvorschau ({uploadedFile.name})
        </div>
      ) : null}
      {uploadedFile ? (
        <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Datei wird mit der Bestellung hochgeladen
          </div>
          <Badge variant="outline">UPLOAD</Badge>
        </div>
      ) : null}
      {pdfAnalysisBlocking ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          Bitte laden Sie zuerst eine gültige PDF hoch. Danach können Sie das Produkt in den Warenkorb legen.
        </p>
      ) : null}
      {isBrochure && !productionFormatConfirmed ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          Bitte bestätigen Sie die proportionale Skalierung oder wechseln Sie zurück zum PDF-Format.
        </p>
      ) : null}
      {brochurePageMinimumInvalid ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900">
          Bitte laden Sie eine Broschüren-PDF mit gültiger Seitenanzahl hoch.
        </p>
      ) : null}
      {authenticated ? <Button className="mt-6 w-full bg-brand-blue hover:bg-[#2c70b8]" size="lg" type="button" onClick={addToCart} disabled={configuratorBlocking || isAnalyzingPdf}>
        In den Warenkorb
      </Button> : <Button asChild className="mt-6 w-full" size="lg"><a href="/login">Anmelden und Preise sehen</a></Button>}
      {authenticated ? <Button
        className="mt-3 w-full"
        size="lg"
        variant="outline"
        type="button"
        disabled={configuratorBlocking || isAnalyzingPdf}
        onClick={() => {
          void (async () => {
            const ok = await addToCart();
            if (ok) router.push("/warenkorb");
          })();
        }}
      >
        Jetzt kaufen
      </Button> : null}
      {cartMessage ? <p className="mt-3 text-center text-xs text-fuchsia-700">{cartMessage}</p> : null}
      <p className="mt-3 text-center text-xs text-muted-foreground">Wir beraten Sie gerne zu Materialien und Veredelungen.</p>
    </aside>
  );
}

function normalizePropertyValue(value: ProductCategoryProperty["values"][number]) {
  if (typeof value === "string") return { value, label: value };
  return { value: value.value, label: value.label || value.value };
}

function applyStudentProductPreset(
  product: ProductCatalogItem,
  categoryProperties: ProductCategoryProperty[],
  current: Record<string, string>,
  preset: string
) {
  const next = { ...current };

  if (preset === "hardcover" || preset === "hardcover-praegung") {
    applyMatchingProperty(next, product, categoryProperties, /bindung|bind/i, /hardcover|hard.?cover/i);
  }

  if (preset === "hardcover-praegung") {
    applyMatchingProperty(
      next,
      product,
      categoryProperties,
      /prägung|praegung|veredelung/i,
      /gold|silber|prägung|praegung/i,
      /keine|ohne|nein/i
    );
  }

  return next;
}

function applyMatchingProperty(
  config: Record<string, string>,
  product: ProductCatalogItem,
  categoryProperties: ProductCategoryProperty[],
  propertyPattern: RegExp,
  valuePattern: RegExp,
  excludePattern?: RegExp
) {
  const productProperty = (product.pricingProperties ?? []).find((property) => propertyPattern.test(property.name));
  if (productProperty) {
    const match = productProperty.values
      .filter((value) => value.enabled !== false)
      .find((value) => {
        const searchable = `${value.value} ${value.label ?? ""} ${value.labelOverride ?? ""}`;
        return valuePattern.test(searchable) && (!excludePattern || !excludePattern.test(searchable));
      });
    if (match) {
      config[`eigenschaft:${productProperty.name}`] = match.value;
      return;
    }
  }

  const categoryProperty = categoryProperties.find((property) => propertyPattern.test(property.name));
  if (!categoryProperty) return;
  const match = categoryProperty.values
    .map(normalizePropertyValue)
    .find((value) => {
      const searchable = `${value.value} ${value.label}`;
      return valuePattern.test(searchable) && (!excludePattern || !excludePattern.test(searchable));
    });
  if (match) config[`eigenschaft:${categoryProperty.name}`] = match.value;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">{value}</span>
    </div>
  );
}

function printColorModeLabel(mode: PrintColorMode) {
  if (mode === "full_color") return "Alles Farbe";
  if (mode === "auto") return "Farbe/SW laut PDF";
  return "Alles Schwarz-Weiß";
}

function resolveEmbossingSelection(config: Record<string, string>) {
  const entry = Object.entries(config).find(([key]) => /prägung|praegung/i.test(key));
  if (!entry) return null;
  return { key: entry[0], value: entry[1] };
}

function embossingColorFromValue(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("silber")) return "silber" as const;
  if (normalized.includes("blind")) return "blind" as const;
  return "gold" as const;
}

async function getImageDimensions(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}
