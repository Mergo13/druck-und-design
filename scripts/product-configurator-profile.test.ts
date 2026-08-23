import { strict as assert } from "assert";
import { applyConfiguratorProfileDefaults, isBrochureProduct, resolveConfiguratorProfile, resolvePdfAnalysisMode, resolveProductPdfConfig } from "@/lib/product-configurator-profile";
import type { ProductCatalogItem } from "@/types/print-platform";

const baseProduct = {
  slug: "flyer",
  name: "Flyer",
  category: "druckprodukte",
  short: "",
  description: "",
  seo: "",
  heroImage: "",
  gallery: [],
  rating: 4.8,
  basePrice: 0,
  deliveryText: "",
  tags: [],
  variants: [],
  production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
} satisfies ProductCatalogItem;

assert.equal(resolveConfiguratorProfile(baseProduct), "standard");
assert.equal(isBrochureProduct({ ...baseProduct, slug: "broschueren" }), true);
assert.equal(resolveConfiguratorProfile({ ...baseProduct, slug: "katalog", configuratorProfile: "brochure" }), "brochure");
assert.equal(isBrochureProduct({ ...baseProduct, slug: "katalog", configuratorProfile: "brochure" }), true);

const brochure = applyConfiguratorProfileDefaults({ ...baseProduct, configuratorProfile: "brochure" });
assert.equal(brochure.pdfAnalysisMode, "required");
assert.equal(brochure.pdfConfig?.previewMode, "thumbnails");
assert.equal(brochure.pdfConfig?.minPages, 4);
assert.equal(brochure.pdfConfig?.pageMultiple, 4);

const custom = applyConfiguratorProfileDefaults({
  ...baseProduct,
  configuratorProfile: "brochure",
  pdfAnalysisMode: "optional",
  pdfConfig: { previewMode: "page-list", minPages: 12 }
});
assert.equal(resolvePdfAnalysisMode(custom), "optional");
assert.equal(resolveProductPdfConfig(custom).previewMode, "page-list");
assert.equal(resolveProductPdfConfig(custom).minPages, 12);
assert.equal(resolveProductPdfConfig(custom).allowPageMapping, true);

console.log("product-configurator-profile tests passed");
