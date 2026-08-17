import { deriveDocumentProduction, resolvePrintSides, type PrintSideMode } from "@/lib/document-production";
import type { ProductCatalogItem, ProductCategoryProperty, ProductPropertyProductionMetadata, ProductPropertyValue } from "@/types/print-platform";

export type BindingPricingMetadata = {
  mode: "fixed" | "per-piece" | "tiered";
  amount?: number;
};

export type DocumentPhysicalLayer = {
  quantity: number;
  thicknessMm: number;
  includeInBindingThickness: boolean;
};

export type DocumentMetrics = {
  pageCount: number;
  printMode: PrintSideMode;
  sheetCount: number;
  blockThicknessMm?: number;
  equivalentReferenceSheets?: number;
  estimated?: boolean;
};

export type BindingReferenceCapacity = {
  minSheets?: number;
  maxSheets?: number;
  referenceGrammageGsm?: number;
  referencePaperCaliperMm?: number;
  source: "richter-menzel" | "manufacturer" | "supplier" | "shop-measured";
  sourceUrl?: string;
  articleNumber?: string;
  checkedAt?: string;
};

export type BindingSize = {
  id?: string;
  bindingSystemId?: string;
  value: string;
  label: string;
  sizeCode?: string;
  diameterMm?: number;
  spineWidthMm?: number;
  minBlockThicknessMm?: number;
  maxBlockThicknessMm?: number;
  minSheets?: number;
  maxSheets?: number;
  referenceCapacity?: BindingReferenceCapacity;
  ringCount?: number;
  availableColors?: string[];
  pricing?: BindingPricingMetadata;
  active?: boolean;
  sortOrder?: number;
};

export type BindingSystem = {
  id: string;
  slug: string;
  label: string;
  type?: "wire" | "comb" | "clamp-hardcover" | "adhesive" | "thermal" | "other";
  resolutionStrategy?: "physical-thickness" | "reference-paper-capacity" | "sheet-count" | "manual";
  pitch?: string;
  format?: string;
  safetyMarginMm?: number;
  colors?: string[];
  formatConfig?: Record<string, { ringCount?: number }>;
  sizes: BindingSize[];
};

export type BindingVariant = {
  id: string;
  bindingSystemId: string;
  bindingSizeId: string;
  seriesValue?: string;
  colorValue?: string;
  materialValue?: string;
  sku?: string;
  active: boolean;
  supplier?: string;
  supplierArticleNumber?: string;
  sourceUrl?: string;
  checkedAt?: string;
  pricing?: BindingPricingMetadata;
};

export type BindingResolutionInput = {
  bindingSystem: BindingSystem;
  pageCount: number;
  printMode: PrintSideMode;
  paper: {
    thicknessMm?: number;
    caliperMm?: number;
    grammageGsm?: number;
  };
  physicalLayers?: DocumentPhysicalLayer[];
  frontCoverThicknessMm?: number;
  backCoverThicknessMm?: number;
  format?: string;
  color?: string;
  series?: string;
  material?: string;
  variants?: BindingVariant[];
  blockThicknessMm?: number;
};

export type BindingResolutionResult = {
  status: "resolved" | "unsupported";
  reason?: "missing-document" | "missing-paper-thickness" | "block-too-thick" | "color-unavailable";
  bindingSystemId: string;
  bindingSystemLabel: string;
  sizeValue?: string;
  sizeLabel?: string;
  diameterMm?: number;
  spineWidthMm?: number;
  sizeCode?: string;
  pitch?: string;
  blockThicknessMm: number;
  requiredThicknessMm: number;
  sheetCount: number;
  equivalentReferenceSheets?: number;
  estimated?: boolean;
  ringCount?: number;
  color?: string;
  series?: string;
  variantId?: string;
  sku?: string;
  supplier?: string;
  supplierArticleNumber?: string;
  sourceUrl?: string;
  checkedAt?: string;
  automaticallyResolved: boolean;
};

export const wireBinding31: BindingSystem = {
  id: "wire-3-1",
  slug: "drahtbindung-3-1",
  label: "Drahtbindung 3:1",
  type: "wire",
  resolutionStrategy: "physical-thickness",
  pitch: "3:1",
  safetyMarginMm: 0.3,
  colors: ["schwarz", "weiss", "silber", "nc-silber", "bronze"],
  formatConfig: {
    A4: { ringCount: 34 },
    A5: { ringCount: 24 }
  },
  sizes: [
    { value: "4.8", label: "4,8 mm", diameterMm: 4.8, maxBlockThicknessMm: 2.0 },
    { value: "6.4", label: "6,4 mm", diameterMm: 6.4, maxBlockThicknessMm: 3.5 },
    { value: "7.9", label: "7,9 mm", diameterMm: 7.9, maxBlockThicknessMm: 5.0 },
    { value: "9.5", label: "9,5 mm", diameterMm: 9.5, maxBlockThicknessMm: 6.5 },
    { value: "11.1", label: "11,1 mm", diameterMm: 11.1, maxBlockThicknessMm: 8.0 },
    { value: "12.7", label: "12,7 mm", diameterMm: 12.7, maxBlockThicknessMm: 10.0 },
    { value: "14.3", label: "14,3 mm", diameterMm: 14.3, maxBlockThicknessMm: 12.0 },
    { value: "15.9", label: "15,9 mm", diameterMm: 15.9, maxBlockThicknessMm: 13.5 }
  ]
};

const rmClassicSourceUrl = "https://www.richter-menzel.de/Bindesysteme/Klemmbindesysteme/OPUS-C-Bind-Hardcover-Buchbindemappen/";
const checkedAt = "2026-08-17";

export const opusCBind: BindingSystem = {
  id: "opus-c-bind",
  slug: "opus-c-bind",
  label: "OPUS C-Bind Hardcover",
  type: "clamp-hardcover",
  resolutionStrategy: "reference-paper-capacity",
  safetyMarginMm: 0,
  format: "A4",
  sizes: [
    { id: "opus-aa", bindingSystemId: "opus-c-bind", value: "AA", label: "Größe AA - 5 mm", sizeCode: "AA", spineWidthMm: 5, referenceCapacity: { minSheets: 1, maxSheets: 40, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-a", bindingSystemId: "opus-c-bind", value: "A", label: "Größe A - 10 mm", sizeCode: "A", spineWidthMm: 10, referenceCapacity: { minSheets: 41, maxSheets: 80, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-b", bindingSystemId: "opus-c-bind", value: "B", label: "Größe B - 13 mm", sizeCode: "B", spineWidthMm: 13, referenceCapacity: { minSheets: 81, maxSheets: 120, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-c", bindingSystemId: "opus-c-bind", value: "C", label: "Größe C - 16 mm", sizeCode: "C", spineWidthMm: 16, referenceCapacity: { minSheets: 121, maxSheets: 150, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-d", bindingSystemId: "opus-c-bind", value: "D", label: "Größe D - 20 mm", sizeCode: "D", spineWidthMm: 20, referenceCapacity: { minSheets: 151, maxSheets: 190, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-e", bindingSystemId: "opus-c-bind", value: "E", label: "Größe E - 24 mm", sizeCode: "E", spineWidthMm: 24, referenceCapacity: { minSheets: 191, maxSheets: 230, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-f", bindingSystemId: "opus-c-bind", value: "F", label: "Größe F - 28 mm", sizeCode: "F", spineWidthMm: 28, referenceCapacity: { minSheets: 231, maxSheets: 265, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } },
    { id: "opus-g", bindingSystemId: "opus-c-bind", value: "G", label: "Größe G - 32 mm", sizeCode: "G", spineWidthMm: 32, referenceCapacity: { minSheets: 266, maxSheets: 300, referenceGrammageGsm: 80, referencePaperCaliperMm: 0.1, source: "richter-menzel", sourceUrl: rmClassicSourceUrl, checkedAt } }
  ]
};

export const defaultBindingVariants: BindingVariant[] = [
  ...["AA", "A", "B", "C", "D", "E", "F", "G"].flatMap((size) => ["schwarz", "blau", "gruen", "grau"].map((color) => ({
    id: `opus-classic-${size.toLowerCase()}-${color}`,
    bindingSystemId: "opus-c-bind",
    bindingSizeId: `opus-${size.toLowerCase()}`,
    seriesValue: "classic",
    colorValue: color,
    active: true,
    supplier: "Richter & Menzel",
    supplierArticleNumber: `RM-OPUS-CLASSIC-${size}-${color.toUpperCase()}`,
    sourceUrl: rmClassicSourceUrl,
    checkedAt
  }))),
  { id: "opus-classic-c-bordeaux", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-c", seriesValue: "classic", colorValue: "bordeaux", active: true, supplier: "Richter & Menzel", supplierArticleNumber: "09833406S", sourceUrl: rmClassicSourceUrl, checkedAt },
  { id: "opus-classic-aa-bordeaux", bindingSystemId: "opus-c-bind", bindingSizeId: "opus-aa", seriesValue: "classic", colorValue: "bordeaux", active: true, supplier: "Richter & Menzel", supplierArticleNumber: "09833106S", sourceUrl: rmClassicSourceUrl, checkedAt }
];

export const defaultBindingSystems = [wireBinding31, opusCBind];

export function calculateSheetCount(pageCount: number, printMode: PrintSideMode) {
  const pages = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  return printMode === "duplex" ? Math.ceil(pages / 2) : pages;
}

export function calculateBlockThickness(params: {
  sheetCount: number;
  paperThicknessMm: number;
  frontCoverThicknessMm?: number;
  backCoverThicknessMm?: number;
  physicalLayers?: DocumentPhysicalLayer[];
}) {
  const layerThickness = (params.physicalLayers ?? [])
    .filter((layer) => layer.includeInBindingThickness)
    .reduce((sum, layer) => sum + Math.max(0, layer.quantity) * Math.max(0, layer.thicknessMm), 0);
  return roundMm(
    Math.max(0, params.sheetCount) * Math.max(0, params.paperThicknessMm) +
    Math.max(0, params.frontCoverThicknessMm ?? 0) +
    Math.max(0, params.backCoverThicknessMm ?? 0) +
    layerThickness
  );
}

export function createDocumentMetrics(params: {
  pageCount: number;
  printMode: PrintSideMode;
  paperCaliperMm?: number;
  frontCoverThicknessMm?: number;
  backCoverThicknessMm?: number;
  physicalLayers?: DocumentPhysicalLayer[];
}): DocumentMetrics {
  const sheetCount = calculateSheetCount(params.pageCount, params.printMode);
  const blockThicknessMm = params.paperCaliperMm
    ? calculateBlockThickness({
      sheetCount,
      paperThicknessMm: params.paperCaliperMm,
      frontCoverThicknessMm: params.frontCoverThicknessMm,
      backCoverThicknessMm: params.backCoverThicknessMm,
      physicalLayers: params.physicalLayers
    })
    : undefined;
  return {
    pageCount: Math.max(0, Math.floor(params.pageCount)),
    printMode: params.printMode,
    sheetCount,
    blockThicknessMm
  };
}

export function resolveBindingSize(input: BindingResolutionInput): BindingResolutionResult {
  const paperCaliperMm = input.paper.caliperMm ?? input.paper.thicknessMm;
  const sheetCount = calculateSheetCount(input.pageCount, input.printMode);
  const blockThicknessMm = input.blockThicknessMm ?? calculateBlockThickness({
    sheetCount,
    paperThicknessMm: paperCaliperMm ?? 0,
    frontCoverThicknessMm: input.frontCoverThicknessMm,
    backCoverThicknessMm: input.backCoverThicknessMm,
    physicalLayers: input.physicalLayers
  });
  const base = {
    bindingSystemId: input.bindingSystem.id,
    bindingSystemLabel: input.bindingSystem.label,
    blockThicknessMm,
    requiredThicknessMm: roundMm(blockThicknessMm + Math.max(0, input.bindingSystem.safetyMarginMm ?? 0)),
    sheetCount,
    pitch: input.bindingSystem.pitch,
    color: input.color,
    series: input.series,
    automaticallyResolved: true
  };

  if (input.pageCount <= 0 || sheetCount <= 0) {
    return { ...base, status: "unsupported", reason: "missing-document" };
  }
  if (input.bindingSystem.resolutionStrategy !== "reference-paper-capacity" && !input.blockThicknessMm && (!Number.isFinite(paperCaliperMm) || !paperCaliperMm || paperCaliperMm <= 0)) {
    return { ...base, status: "unsupported", reason: "missing-paper-thickness" };
  }

  const candidates = input.bindingSystem.sizes
    .filter((size) => size.active !== false)
    .filter((size) => size.minSheets === undefined || sheetCount >= size.minSheets)
    .filter((size) => size.maxSheets === undefined || sheetCount <= size.maxSheets)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || comparableCapacity(a) - comparableCapacity(b));
  const reference = input.bindingSystem.resolutionStrategy === "reference-paper-capacity"
    ? equivalentReferenceSheetCount(candidates[0]?.referenceCapacity, sheetCount, input.paper)
    : undefined;
  const selected = candidates.find((size) => {
    if (input.bindingSystem.resolutionStrategy === "reference-paper-capacity") {
      const equivalentSheets = equivalentReferenceSheetCount(size.referenceCapacity, sheetCount, input.paper);
      if (!equivalentSheets) return false;
      return equivalentSheets.value >= (size.referenceCapacity?.minSheets ?? 0) && equivalentSheets.value <= (size.referenceCapacity?.maxSheets ?? Infinity);
    }
    return base.requiredThicknessMm >= (size.minBlockThicknessMm ?? 0) && base.requiredThicknessMm <= (size.maxBlockThicknessMm ?? Infinity);
  });

  if (!selected) {
    return { ...base, status: "unsupported", reason: "block-too-thick" };
  }

  const variant = selected ? selectCompatibleVariant({
    variants: input.variants ?? defaultBindingVariants,
    bindingSystemId: input.bindingSystem.id,
    bindingSizeId: selected.id ?? selected.value,
    color: input.color,
    series: input.series,
    material: input.material
  }) : undefined;

  if (input.color) {
    const allowedColors = selected.availableColors ?? input.bindingSystem.colors;
    if ((input.variants?.length || input.bindingSystem.id === "opus-c-bind") && !variant) {
      return { ...base, status: "unsupported", reason: "color-unavailable", equivalentReferenceSheets: reference?.value, estimated: reference?.estimated };
    }
    if (!variant && allowedColors?.length && !allowedColors.includes(input.color)) {
      return { ...base, status: "unsupported", reason: "color-unavailable" };
    }
  }

  return {
    ...base,
    status: "resolved",
    sizeValue: selected.value,
    sizeLabel: selected.label,
    diameterMm: selected.diameterMm,
    spineWidthMm: selected.spineWidthMm,
    sizeCode: selected.sizeCode,
    equivalentReferenceSheets: reference?.value,
    estimated: reference?.estimated,
    ringCount: selected.ringCount ?? (input.format ? input.bindingSystem.formatConfig?.[input.format]?.ringCount : undefined),
    variantId: variant?.id,
    sku: variant?.sku,
    supplier: variant?.supplier ?? (selected.referenceCapacity?.source === "richter-menzel" ? "Richter & Menzel" : selected.referenceCapacity?.source),
    supplierArticleNumber: variant?.supplierArticleNumber ?? selected.referenceCapacity?.articleNumber,
    sourceUrl: variant?.sourceUrl ?? selected.referenceCapacity?.sourceUrl,
    checkedAt: variant?.checkedAt ?? selected.referenceCapacity?.checkedAt
  };
}

export function getCompatibleBindingVariants(params: {
  variants?: BindingVariant[];
  bindingSystemId: string;
  bindingSizeId?: string;
  series?: string;
  color?: string;
  material?: string;
}) {
  return (params.variants ?? defaultBindingVariants).filter((variant) =>
    variant.active !== false &&
    variant.bindingSystemId === params.bindingSystemId &&
    (!params.bindingSizeId || variant.bindingSizeId === params.bindingSizeId) &&
    (!params.series || variant.seriesValue === params.series) &&
    (!params.color || variant.colorValue === params.color) &&
    (!params.material || variant.materialValue === params.material)
  );
}

export function getAvailableBindingColors(params: { variants?: BindingVariant[]; bindingSystemId: string; bindingSizeId?: string; series?: string }) {
  return unique(getCompatibleBindingVariants(params).map((variant) => variant.colorValue).filter(Boolean) as string[]);
}

export function getAvailableBindingSeries(params: { variants?: BindingVariant[]; bindingSystemId: string; bindingSizeId?: string; color?: string }) {
  return unique(getCompatibleBindingVariants(params).map((variant) => variant.seriesValue).filter(Boolean) as string[]);
}

export function getAvailableBindingMaterials(params: { variants?: BindingVariant[]; bindingSystemId: string; bindingSizeId?: string; color?: string; series?: string }) {
  return unique(getCompatibleBindingVariants(params).map((variant) => variant.materialValue).filter(Boolean) as string[]);
}

export function resolveBindingConfigurationForProduct(params: {
  product: ProductCatalogItem;
  categoryProperties?: ProductCategoryProperty[];
  config: Record<string, string>;
  quantity: number;
  bindingSystems?: BindingSystem[];
  bindingVariants?: BindingVariant[];
}) {
  const systems = params.bindingSystems ?? defaultBindingSystems;
  const selected = selectedProductionValues(params.product, params.categoryProperties ?? [], params.config);
  const bindingSystemId = selected.binding.production?.bindingSystemId ?? inferBindingSystemId(selected.binding.label, systems);
  if (!bindingSystemId) return null;
  const enabledSystems = params.product.productBindingConfig?.enabledSystems;
  if (enabledSystems?.length && !enabledSystems.includes(bindingSystemId)) return null;
  const bindingSystem = systems.find((system) => system.id === bindingSystemId || system.slug === bindingSystemId);
  if (!bindingSystem) return null;

  const production = deriveDocumentProduction(params.config, params.quantity);
  const paperThicknessMm = selected.paper.production?.caliperMm ?? selected.paper.production?.thicknessMm ?? 0;
  const frontCoverThicknessMm = selected.frontCover.production?.coverThicknessMm ?? selected.frontCover.production?.thicknessMm;
  const backCoverThicknessMm = selected.backCover.production?.coverThicknessMm ?? selected.backCover.production?.thicknessMm;
  const format = selected.format.production?.format ?? normalizeFormat(selected.format.value || params.config.PDFFormat || params.config.Format);
  const color = selected.bindingColor.production?.bindingColor ?? normalizeColor(selected.bindingColor.value || selected.bindingColor.label);

  return resolveBindingSize({
    bindingSystem,
    pageCount: production.pagesPerCopy,
    printMode: resolvePrintSides(params.config),
    paper: {
      thicknessMm: paperThicknessMm,
      caliperMm: selected.paper.production?.caliperMm,
      grammageGsm: selected.paper.production?.grammageGsm
    },
    frontCoverThicknessMm,
    backCoverThicknessMm,
    format,
    color,
    series: selected.binding.production?.bindingSeries,
    variants: params.bindingVariants
  });
}

function selectedProductionValues(product: ProductCatalogItem, categoryProperties: ProductCategoryProperty[], config: Record<string, string>) {
  const productValues = (product.pricingProperties ?? []).flatMap((property) => selectedValueForProperty(property.name, property.values, config));
  const categoryValues = categoryProperties.flatMap((property) => selectedCategoryValueForProperty(property.name, property.values, config));
  const values = [...productValues, ...categoryValues];
  return {
    paper: firstMatching(values, /papier|paper/),
    binding: firstMatching(values, /bindung|bind|wire|draht|spiral|hardcover|klebebindung/),
    bindingColor: firstMatching(values, /farbe|color/),
    frontCover: firstMatching(values, /front.*cover|deckblatt|umschlag.*vorn|cover.*vorn/),
    backCover: firstMatching(values, /back.*cover|rueckblatt|rückblatt|umschlag.*hinten|cover.*hinten/),
    format: firstMatching(values, /format|size/)
  };
}

function selectedValueForProperty(name: string, values: ProductPropertyValue[], config: Record<string, string>) {
  const enabled = values.filter((value) => value.enabled !== false);
  const selected = config[`eigenschaft:${name}`] || enabled.find((value) => value.defaultSelected)?.value || enabled[0]?.value || "";
  const match = enabled.find((value) => value.value === selected);
  return match ? [{ name, value: match.value, label: match.labelOverride || match.label || match.value, production: match.production }] : [];
}

function selectedCategoryValueForProperty(name: string, values: ProductCategoryProperty["values"], config: Record<string, string>) {
  const normalized = values.map((value) => typeof value === "string" ? { value, label: value, production: undefined } : { value: value.value, label: value.label || value.value, production: value.production });
  const selected = config[`eigenschaft:${name}`] || normalized[0]?.value || "";
  const match = normalized.find((value) => value.value === selected);
  return match ? [{ name, value: match.value, label: match.label, production: match.production }] : [];
}

function firstMatching(values: Array<{ name: string; value: string; label: string; production?: ProductPropertyProductionMetadata }>, pattern: RegExp) {
  return values.find((entry) => pattern.test(`${entry.name} ${entry.value} ${entry.label}`.toLowerCase())) ?? { name: "", value: "", label: "", production: undefined };
}

function inferBindingSystemId(label: string, systems: BindingSystem[]) {
  const normalized = label.toLowerCase();
  return systems.find((system) => normalized.includes(system.slug) || normalized.includes(system.label.toLowerCase()) || (
    normalized.includes("draht") && normalized.includes("3:1") && system.id === "wire-3-1"
  ) || (
    (normalized.includes("opus") || normalized.includes("c-bind") || normalized.includes("hardcover")) && system.id === "opus-c-bind"
  ))?.id;
}

function normalizeColor(value?: string) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("schwarz")) return "schwarz";
  if (normalized.includes("weiß") || normalized.includes("weiss")) return "weiss";
  if (normalized.includes("silber")) return normalized.includes("nc") ? "nc-silber" : "silber";
  if (normalized.includes("bronze")) return "bronze";
  return normalized;
}

function normalizeFormat(value?: string) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized.includes("A5")) return "A5";
  if (normalized.includes("A4")) return "A4";
  return normalized || undefined;
}

function equivalentReferenceSheetCount(capacity: BindingReferenceCapacity | undefined, sheetCount: number, paper: BindingResolutionInput["paper"]) {
  if (!capacity) return null;
  const paperCaliperMm = paper.caliperMm ?? paper.thicknessMm;
  if (paperCaliperMm && capacity.referencePaperCaliperMm) {
    return { value: roundMm(sheetCount * (paperCaliperMm / capacity.referencePaperCaliperMm)), estimated: false };
  }
  if (paper.grammageGsm && capacity.referenceGrammageGsm) {
    return { value: roundMm(sheetCount * (paper.grammageGsm / capacity.referenceGrammageGsm)), estimated: true };
  }
  return { value: sheetCount, estimated: true };
}

function selectCompatibleVariant(params: {
  variants: BindingVariant[];
  bindingSystemId: string;
  bindingSizeId: string;
  color?: string;
  series?: string;
  material?: string;
}) {
  return getCompatibleBindingVariants(params)[0];
}

function comparableCapacity(size: BindingSize) {
  return size.maxBlockThicknessMm ?? size.referenceCapacity?.maxSheets ?? size.maxSheets ?? Infinity;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function roundMm(value: number) {
  return Math.round(value * 100) / 100;
}
