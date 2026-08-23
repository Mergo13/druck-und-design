import type { ExperienceProfileKey, PdfAnalysisMode, ProductCatalogItem, ProductConfiguratorProfile, ProductPdfConfig } from "@/types/print-platform";

export const configuratorProfileLabels: Record<ProductConfiguratorProfile, string> = {
  standard: "Standard",
  "simple-print": "Einfaches Druckprodukt",
  "front-back": "Vorder-/Rückseite",
  brochure: "Broschüre",
  document: "Dokument",
  thesis: "Abschlussarbeit",
  poster: "Poster",
  plan: "Architekturplan / CAD",
  werbetechnik: "Werbetechnik",
  custom: "Individuell"
};

export const pdfPreviewModeLabels: Record<NonNullable<ProductPdfConfig["previewMode"]>, string> = {
  none: "Keine",
  "first-page": "Erste Seite",
  "front-back": "Vorder-/Rückseite",
  thumbnails: "Seitenvorschau",
  "page-list": "Seitenliste"
};

export const experienceProfileLabels: Record<ExperienceProfileKey, string> = {
  standard: "Standard",
  document: "Dokument",
  book: "Buch / Broschüre",
  cards: "Karten",
  folded: "Gefalzt",
  "large-format": "Großformat",
  textile: "Textil",
  signage: "Beschilderung"
};

const profilePdfDefaults: Record<ProductConfiguratorProfile, ProductPdfConfig> = {
  standard: { previewMode: "none" },
  "simple-print": { previewMode: "first-page", formatCheck: true, allowPageMapping: false, bindingCheck: false },
  "front-back": { previewMode: "front-back", formatCheck: true, allowPageMapping: false },
  brochure: {
    previewMode: "thumbnails",
    formatCheck: true,
    allowFormatOverride: true,
    allowPageMapping: true,
    bindingCheck: true,
    minPages: 4,
    pageMultiple: 4
  },
  document: { previewMode: "page-list", formatCheck: true, showColorAnalysis: true, bindingCheck: true, allowPageMapping: false },
  thesis: { previewMode: "thumbnails", formatCheck: true, showColorAnalysis: true, bindingCheck: true, allowPageMapping: false },
  poster: { previewMode: "first-page", formatCheck: true, allowFormatOverride: true, allowPageMapping: false },
  plan: { previewMode: "page-list", formatCheck: true, allowPageMapping: false },
  werbetechnik: { previewMode: "first-page", formatCheck: true, allowFormatOverride: true, allowPageMapping: false },
  custom: { previewMode: "none" }
};

export function resolveConfiguratorProfile(product: Pick<ProductCatalogItem, "configuratorProfile" | "slug">): ProductConfiguratorProfile {
  if (product.configuratorProfile) return product.configuratorProfile;
  return product.slug === "broschueren" ? "brochure" : "standard";
}

export function isBrochureProduct(product: Pick<ProductCatalogItem, "configuratorProfile" | "slug">) {
  return resolveConfiguratorProfile(product) === "brochure";
}

export function resolveProductPdfConfig(product: Pick<ProductCatalogItem, "configuratorProfile" | "slug" | "pdfConfig">): ProductPdfConfig {
  const profile = resolveConfiguratorProfile(product);
  return { ...profilePdfDefaults[profile], ...(product.pdfConfig ?? {}) };
}

export function resolvePdfAnalysisMode(product: Pick<ProductCatalogItem, "configuratorProfile" | "slug" | "pdfAnalysisMode">): PdfAnalysisMode {
  return product.pdfAnalysisMode ?? (isBrochureProduct(product) ? "required" : "disabled");
}

export function resolveExperienceProfile(product: Pick<ProductCatalogItem, "experienceProfile" | "configuratorProfile" | "slug">): ExperienceProfileKey {
  if (product.experienceProfile) return product.experienceProfile;
  const configuratorProfile = resolveConfiguratorProfile(product);
  if (configuratorProfile === "thesis" || configuratorProfile === "brochure") return "book";
  if (configuratorProfile === "document" || configuratorProfile === "simple-print") return "document";
  if (configuratorProfile === "poster" || configuratorProfile === "plan" || configuratorProfile === "werbetechnik") return "large-format";
  return "standard";
}

export function applyConfiguratorProfileDefaults(product: ProductCatalogItem): ProductCatalogItem {
  const profile = resolveConfiguratorProfile(product);
  const defaults = profilePdfDefaults[profile];
  return {
    ...product,
    experienceProfile: product.experienceProfile ?? resolveExperienceProfile(product),
    pdfAnalysisMode: product.pdfAnalysisMode ?? (profile === "brochure" ? "required" : "disabled"),
    pdfConfig: { ...defaults, ...(product.pdfConfig ?? {}) }
  };
}
