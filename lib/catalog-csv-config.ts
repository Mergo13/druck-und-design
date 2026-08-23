import type { ProductCatalogItem, ProductConfiguratorProfile, ProductPdfConfig, ProductPricingProperty } from "@/types/print-platform";

const configuratorProfiles = new Set<ProductConfiguratorProfile>(["standard", "simple-print", "front-back", "brochure", "document", "thesis", "poster", "plan", "werbetechnik", "custom"]);
const pricingProfiles = new Set(["digital-document", "digital-sheet", "sheet-print", "business-card", "brochure", "booklet", "thesis", "document-binding", "large-format", "plan-print", "area-print", "area-finishing", "sticker", "textile-print", "signage", "design-service", "custom-formula"]);
const experienceProfiles = new Set(["standard", "document", "book", "cards", "folded", "large-format", "textile", "signage"]);
const previewModes = new Set<NonNullable<ProductPdfConfig["previewMode"]>>(["none", "first-page", "front-back", "thumbnails", "page-list"]);
const displayControls = new Set<NonNullable<ProductPricingProperty["display"]>["control"]>(["select", "buttons", "cards", "radio", "swatches"]);
const displaySections = new Set<NonNullable<ProductPricingProperty["display"]>["section"]>(["general", "format", "print", "material", "cover", "finishing", "binding"]);

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

function cell(row: Record<string, string>, ...keys: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  for (const key of keys) {
    const value = normalized.get(normalizeKey(key));
    if (value !== undefined && value !== "") return value.trim();
  }
  return undefined;
}

function csvBool(value: string | undefined) {
  if (value === undefined) return undefined;
  if (/^(true|1|yes|ja|y)$/i.test(value)) return true;
  if (/^(false|0|no|nein|n)$/i.test(value)) return false;
  return undefined;
}

function csvNumber(value: string | undefined) {
  if (value === undefined) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productConfigFromCsvRow(row: Record<string, string>): Partial<ProductCatalogItem> {
  const profile = cell(row, "configuratorProfile", "configurator_profile");
  const pricingProfile = cell(row, "pricingProfile", "pricing_profile");
  const experienceProfile = cell(row, "experienceProfile", "experience_profile");
  const pdfAnalysisMode = cell(row, "pdfAnalysisMode", "pdf_analysis_mode");
  const previewMode = cell(row, "previewMode", "preview_mode");
  const minPages = csvNumber(cell(row, "minPages", "min_pages"));
  const pageMultiple = csvNumber(cell(row, "pageMultiple", "page_multiple"));
  const allowPageMapping = csvBool(cell(row, "allowPageMapping", "allow_page_mapping"));
  const formatCheck = csvBool(cell(row, "formatCheck", "format_check"));
  const allowFormatOverride = csvBool(cell(row, "allowFormatOverride", "allow_format_override"));

  const pdfConfig: ProductPdfConfig = {};
  if (previewMode && previewModes.has(previewMode as NonNullable<ProductPdfConfig["previewMode"]>)) {
    pdfConfig.previewMode = previewMode as NonNullable<ProductPdfConfig["previewMode"]>;
  }
  if (minPages !== undefined) pdfConfig.minPages = minPages;
  if (pageMultiple !== undefined) pdfConfig.pageMultiple = pageMultiple;
  if (allowPageMapping !== undefined) pdfConfig.allowPageMapping = allowPageMapping;
  if (formatCheck !== undefined) pdfConfig.formatCheck = formatCheck;
  if (allowFormatOverride !== undefined) pdfConfig.allowFormatOverride = allowFormatOverride;

  return {
    ...(profile && configuratorProfiles.has(profile as ProductConfiguratorProfile) ? { configuratorProfile: profile as ProductConfiguratorProfile } : {}),
    ...(pricingProfile && pricingProfiles.has(pricingProfile) ? { pricingProfile: pricingProfile as Partial<ProductCatalogItem>["pricingProfile"] } : {}),
    ...(experienceProfile && experienceProfiles.has(experienceProfile) ? { experienceProfile: experienceProfile as Partial<ProductCatalogItem>["experienceProfile"] } : {}),
    ...(pdfAnalysisMode === "disabled" || pdfAnalysisMode === "optional" || pdfAnalysisMode === "required" ? { pdfAnalysisMode } : {}),
    ...(Object.keys(pdfConfig).length ? { pdfConfig } : {})
  };
}

export function hasProductConfigCsvColumns(row: Record<string, string>) {
  return Boolean(
    cell(row, "configuratorProfile", "configurator_profile") ||
    cell(row, "pricingProfile", "pricing_profile") ||
    cell(row, "experienceProfile", "experience_profile") ||
    cell(row, "pdfAnalysisMode", "pdf_analysis_mode") ||
    cell(row, "previewMode", "preview_mode") ||
    cell(row, "minPages", "min_pages") ||
    cell(row, "pageMultiple", "page_multiple") ||
    cell(row, "allowPageMapping", "allow_page_mapping") ||
    cell(row, "formatCheck", "format_check") ||
    cell(row, "allowFormatOverride", "allow_format_override")
  );
}

export function hasFullProductCsvColumns(row: Record<string, string>) {
  return Boolean(cell(row, "name", "Name", "Produkt", "product", "label", "Label") || cell(row, "category", "kategorie") || cell(row, "basePrice", "preis") || cell(row, "pricingType", "preisart"));
}

export function productSlugFromConfigCsvRow(row: Record<string, string>) {
  return cell(row, "slug", "productSlug", "product_slug");
}

export function mergeProductConfigFromCsv(product: ProductCatalogItem, row: Record<string, string>): ProductCatalogItem {
  const update = productConfigFromCsvRow(row);
  return {
    ...product,
    ...update,
    pdfConfig: {
      ...(product.pdfConfig ?? {}),
      ...(update.pdfConfig ?? {})
    }
  };
}

export function applyPropertyDisplayCsvRows(products: ProductCatalogItem[], rows: Record<string, string>[]) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const updated = new Map<string, ProductCatalogItem>();
  const skipped: string[] = [];

  for (const [index, row] of rows.entries()) {
    const productSlug = cell(row, "productSlug", "product_slug", "slug");
    const propertySlug = cell(row, "propertySlug", "property_slug", "propertyId", "property_id");
    if (!productSlug || !propertySlug) {
      skipped.push(`Zeile ${index + 2}: productSlug/propertySlug fehlt`);
      continue;
    }
    const product = updated.get(productSlug) ?? bySlug.get(productSlug);
    if (!product) {
      skipped.push(`Zeile ${index + 2}: Produkt ${productSlug} nicht gefunden`);
      continue;
    }
    const properties = (product.pricingProperties ?? []).map((property) => ({ ...property, values: [...(property.values ?? [])] }));
    const propertyIndex = properties.findIndex((property) => {
      const ids = [property.propertyId, property.name].filter(Boolean).map((value) => slugify(String(value)));
      return ids.includes(slugify(propertySlug));
    });
    if (propertyIndex < 0) {
      skipped.push(`Zeile ${index + 2}: Eigenschaft ${propertySlug} in ${productSlug} nicht gefunden`);
      continue;
    }

    const control = cell(row, "control", "display", "darstellung");
    const section = cell(row, "section", "bereich");
    const advanced = csvBool(cell(row, "advanced", "erweitert"));
    const sortOrder = csvNumber(cell(row, "sortOrder", "sort_order", "reihenfolge"));
    const nextProperty = { ...properties[propertyIndex] };
    if (sortOrder !== undefined) nextProperty.sortOrder = sortOrder;
    nextProperty.display = {
      ...(nextProperty.display ?? {}),
      ...(control && displayControls.has(control as NonNullable<ProductPricingProperty["display"]>["control"]) ? { control: control as NonNullable<ProductPricingProperty["display"]>["control"] } : {}),
      ...(section && displaySections.has(section as NonNullable<ProductPricingProperty["display"]>["section"]) ? { section: section as NonNullable<ProductPricingProperty["display"]>["section"] } : {}),
      ...(advanced !== undefined ? { advanced } : {})
    };
    properties[propertyIndex] = nextProperty;
    updated.set(productSlug, { ...product, pricingProperties: properties });
  }

  return { products: Array.from(updated.values()), skipped };
}
