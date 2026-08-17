import type { ProductCatalogItem, ProductCategoryProperty, ProductPropertyValue } from "@/types/print-platform";

export type PrintSideMode = "simplex" | "duplex";
export type PrintColorMode = "black_white" | "full_color" | "auto";

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
      perOrder: 1
    }
    : undefined;
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
