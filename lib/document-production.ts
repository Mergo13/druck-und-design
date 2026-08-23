import { resolvedEmbossingLineCountFromConfig } from "@/lib/embossing/pricing-adapter";
import type { ProductCatalogItem, ProductCategoryProperty, ProductPropertyValue } from "@/types/print-platform";

export type PrintSideMode = "simplex" | "duplex";
export type PrintColorMode = "black_white" | "full_color" | "auto";
export type BrochureCoverSlot = "U1" | "U2" | "U3" | "U4";
export type BrochureProductionValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const brochureCoverSlots: BrochureCoverSlot[] = ["U1", "U2", "U3", "U4"];

export function numericConfigValue(config: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const raw = config[key];
    if (!raw) continue;
    const match = String(raw).replace(",", ".").match(/\d+(\.\d+)?/);
    const value = Number(match?.[0] ?? NaN);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 0;
}

export function resolvePrintSides(config: Record<string, string>): PrintSideMode {
  const joined = Object.entries(config)
    .filter(([key]) => /druckseiten|druckseite|print|seite/i.test(key))
    .map(([, value]) => value)
    .join(" ")
    .toLowerCase();
  return /beidseitig|duplex|doppelseitig/.test(joined) ? "duplex" : "simplex";
}

export function resolvePrintColorMode(config: Record<string, string>): PrintColorMode {
  const joined = Object.entries(config)
    .filter(([key]) => /druckart|farbmodus|farbe|color/i.test(key))
    .map(([, value]) => value)
    .join(" ")
    .toLowerCase();
  if (/alles.*farbe|full.?color|vollfarbe|farbig|color/.test(joined)) return "full_color";
  if (/laut.*pdf|auto|automatisch|farbe\/sw|farbe.*sw|gemischt/.test(joined)) return "auto";
  return "black_white";
}

function numericListCount(config: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const raw = config[key];
    if (!raw) continue;
    const numbers = String(raw).match(/\d+/g);
    if (numbers?.length) return numbers.length;
  }
  return 0;
}

export function deriveDocumentProduction(config: Record<string, string>, quantity: number) {
  if (config.brochureConfig === "true") return deriveBrochureProduction(config, quantity);
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
  const pagesPerCopy = numericConfigValue(config, ["seitenanzahl", "Seitenanzahl", "Seiten pro Exemplar", "PDF-Seiten", "manualPageCount"]);
  const printSides = resolvePrintSides(config);
  const printColorMode = resolvePrintColorMode(config);
  const sheetsPerCopy = pagesPerCopy > 0
    ? printSides === "duplex" ? Math.ceil(pagesPerCopy / 2) : pagesPerCopy
    : 0;
  const analyzedColorPages = numericConfigValue(config, ["pdfAnalysisColorPageCount", "Farbseiten pro Exemplar", "Farbseiten"]) || numericListCount(config, ["pdfAnalysisColorPages"]);
  const analyzedBwPages = numericConfigValue(config, ["pdfAnalysisBwPageCount", "SW-Seiten pro Exemplar", "SW-Seiten"]) || Math.max(0, pagesPerCopy - analyzedColorPages);
  const colorPagesPerCopy = printColorMode === "full_color"
    ? pagesPerCopy
    : printColorMode === "auto"
      ? Math.min(pagesPerCopy, analyzedColorPages)
      : 0;
  const blackWhitePagesPerCopy = printColorMode === "full_color"
    ? 0
    : printColorMode === "auto"
      ? Math.max(0, Math.min(pagesPerCopy, analyzedBwPages))
      : pagesPerCopy;
  return {
    pagesPerCopy,
    quantity: safeQuantity,
    printSides,
    printColorMode,
    totalPrintedPages: pagesPerCopy * safeQuantity,
    colorPagesPerCopy,
    blackWhitePagesPerCopy,
    totalColorPages: colorPagesPerCopy * safeQuantity,
    totalBlackWhitePages: blackWhitePagesPerCopy * safeQuantity,
    sheetsPerCopy,
    totalSheets: sheetsPerCopy * safeQuantity
  };
}

export function pricingQuantitiesForDocument(config: Record<string, string>, quantity: number) {
  const production = deriveDocumentProduction(config, quantity);
  return production.pagesPerCopy > 0
    ? {
      baseQuantity: production.totalPrintedPages,
      propertyQuantity: production.quantity,
      copies: production.quantity,
      printedPages: production.totalPrintedPages,
      sheets: production.totalSheets,
      blackWhitePages: production.totalBlackWhitePages,
      colorPages: production.totalColorPages,
      frontCovers: production.quantity,
      backCovers: production.quantity,
      printedCoverSides: production.quantity * 2,
      embossingLines: resolvedEmbossingLineCountFromConfig(config) * production.quantity,
      perOrder: 1
    }
    : undefined;
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function pageRange(totalPages: number) {
  return Array.from({ length: Math.max(0, totalPages) }, (_, index) => index + 1);
}

function isBlankCoverValue(value: string | undefined) {
  return !value || /blank|leer|null|none/i.test(value);
}

export function defaultBrochureCoverMapping(totalPages: number) {
  return {
    U1: totalPages >= 1 ? "1" : "blank",
    U2: totalPages >= 2 ? "2" : "blank",
    U3: totalPages >= 4 ? String(totalPages - 1) : "blank",
    U4: totalPages >= 3 ? String(totalPages) : "blank"
  } satisfies Record<BrochureCoverSlot, string>;
}

export function deriveBrochureProduction(config: Record<string, string>, quantity: number) {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
  const totalPages = numericConfigValue(config, ["pdfAnalysisPageCount", "seitenanzahl", "Seitenanzahl", "Seiten pro Exemplar", "PDF-Seiten"]);
  const separateCover = /separat|separate|yes|true|mit/i.test(config.brochureSeparateCover ?? config["eigenschaft:Umschlag"] ?? "");
  const defaults = defaultBrochureCoverMapping(totalPages);
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  if (totalPages > 0 && totalPages < 4) {
    validationErrors.push("Broschüren benötigen mindestens 4 PDF-Seiten.");
  }
  const coverMapping = Object.fromEntries(brochureCoverSlots.map((slot) => {
    const raw = config[`brochureCover${slot}`] ?? defaults[slot];
    const page = positiveInteger(raw);
    if (separateCover && raw && !isBlankCoverValue(raw) && (page < 1 || page > totalPages)) {
      validationErrors.push(`${slot} verweist auf eine ungültige PDF-Seite.`);
    }
    return [slot, separateCover && page > 0 && page <= totalPages ? String(page) : "blank"];
  })) as Record<BrochureCoverSlot, string>;
  const mappedPages = brochureCoverSlots
    .map((slot) => positiveInteger(coverMapping[slot]))
    .filter((page) => page > 0);
  const duplicateMappedPages = mappedPages.filter((page, index) => mappedPages.indexOf(page) !== index);
  if (duplicateMappedPages.length) {
    validationErrors.push("Umschlagseiten dürfen nicht doppelt derselben PDF-Seite zugeordnet werden.");
  }
  const mappedCoverPages = new Set(
    separateCover
      ? brochureCoverSlots.map((slot) => positiveInteger(coverMapping[slot])).filter((page) => page > 0 && page <= totalPages)
      : []
  );
  const innerPages = separateCover
    ? pageRange(totalPages).filter((page) => !mappedCoverPages.has(page))
    : pageRange(totalPages);
  const innerPageCount = innerPages.length;
  const printColorMode = resolvePrintColorMode({ ...config, printColorMode: config.brochureInnerColorMode ?? config.printColorMode });
  const analyzedColorPages = new Set((config.pdfAnalysisColorPages ?? "").match(/\d+/g)?.map(Number) ?? []);
  const analyzedBwPages = new Set((config.pdfAnalysisBwPages ?? "").match(/\d+/g)?.map(Number) ?? []);
  const innerColorPagesPerCopy = printColorMode === "full_color"
    ? innerPageCount
    : printColorMode === "auto"
      ? innerPages.filter((page) => analyzedColorPages.has(page)).length
      : 0;
  const innerBlackWhitePagesPerCopy = printColorMode === "full_color"
    ? 0
    : printColorMode === "auto"
      ? analyzedBwPages.size
        ? innerPages.filter((page) => analyzedBwPages.has(page)).length
        : Math.max(0, innerPageCount - innerColorPagesPerCopy)
      : innerPageCount;
  const printedCoverSidesPerCopy = separateCover
    ? brochureCoverSlots.filter((slot) => !isBlankCoverValue(coverMapping[slot])).length
    : 0;
  const sheetsPerCopy = innerPageCount > 0 ? Math.ceil(innerPageCount / 2) : 0;
  const producedPageCount = innerPageCount + (separateCover ? 4 : 0);
  const saddleStitch = /rückstich|rueckstich|heft/i.test(config["eigenschaft:Broschüre Bindung"] ?? config["eigenschaft:Bindung"] ?? config.brochureBinding ?? "");
  const blankProductionPages = saddleStitch && producedPageCount > 0 ? (4 - (producedPageCount % 4)) % 4 : 0;
  if (blankProductionPages > 0) {
    validationWarnings.push(`Für die Rückstichheftung werden ${blankProductionPages} zusätzliche Leerseite${blankProductionPages === 1 ? "" : "n"} benötigt.`);
  }
  const validation: BrochureProductionValidation = {
    valid: validationErrors.length === 0,
    errors: validationErrors,
    warnings: validationWarnings
  };

  return {
    pagesPerCopy: innerPageCount,
    pdfPagesPerCopy: totalPages,
    quantity: safeQuantity,
    printSides: "duplex" as const,
    printColorMode,
    separateCover,
    coverMapping,
    innerPages,
    innerPagesPerCopy: innerPageCount,
    producedPageCount,
    blankProductionPages,
    productionPageCount: producedPageCount + blankProductionPages,
    printedCoverSidesPerCopy,
    totalPrintedCoverSides: printedCoverSidesPerCopy * safeQuantity,
    totalPrintedPages: innerPageCount * safeQuantity,
    colorPagesPerCopy: innerColorPagesPerCopy,
    blackWhitePagesPerCopy: innerBlackWhitePagesPerCopy,
    totalColorPages: innerColorPagesPerCopy * safeQuantity,
    totalBlackWhitePages: innerBlackWhitePagesPerCopy * safeQuantity,
    sheetsPerCopy,
    totalSheets: sheetsPerCopy * safeQuantity,
    validation
  };
}

export function deriveProductDocumentProduction(
  product: ProductCatalogItem,
  categoryProperties: ProductCategoryProperty[],
  config: Record<string, string>,
  quantity: number
) {
  const printColorMode = selectedPrintColorMode(product, categoryProperties, config);
  return deriveDocumentProduction(printColorMode ? { ...config, printColorMode } : config, quantity);
}

export function pricingQuantitiesForProductDocument(
  product: ProductCatalogItem,
  categoryProperties: ProductCategoryProperty[],
  config: Record<string, string>,
  quantity: number
) {
  const production = deriveProductDocumentProduction(product, categoryProperties, config, quantity);
  return production.pagesPerCopy > 0
    ? {
      baseQuantity: production.totalPrintedPages,
      propertyQuantity: production.quantity,
      copies: production.quantity,
      printedPages: production.totalPrintedPages,
      sheets: production.totalSheets,
      blackWhitePages: production.totalBlackWhitePages,
      colorPages: production.totalColorPages,
      frontCovers: production.quantity,
      backCovers: production.quantity,
      printedCoverSides: "totalPrintedCoverSides" in production ? production.totalPrintedCoverSides : production.quantity * 2,
      embossingLines: resolvedEmbossingLineCountFromConfig(config) * production.quantity,
      perOrder: 1
    }
    : undefined;
}

function selectedPrintColorMode(product: ProductCatalogItem, categoryProperties: ProductCategoryProperty[], config: Record<string, string>) {
  const productMode = (product.pricingProperties ?? [])
    .map((property) => selectedProductValue(property.name, property.values, config)?.production?.printColorMode)
    .find(Boolean);
  if (productMode) return productMode;
  return categoryProperties
    .map((property) => selectedCategoryValue(property.name, property.values, config)?.production?.printColorMode)
    .find(Boolean);
}

function selectedProductValue(name: string, values: ProductPropertyValue[], config: Record<string, string>) {
  const enabled = values.filter((value) => value.enabled !== false);
  const selected = config[`eigenschaft:${name}`] || enabled.find((value) => value.defaultSelected)?.value || enabled[0]?.value || "";
  return enabled.find((value) => value.value === selected);
}

function selectedCategoryValue(name: string, values: ProductCategoryProperty["values"], config: Record<string, string>) {
  const normalized = values.map((value) => typeof value === "string" ? { value, production: undefined } : value);
  const selected = config[`eigenschaft:${name}`] || normalized[0]?.value || "";
  return normalized.find((value) => value.value === selected);
}
