import { strict as assert } from "assert";
import { applyPropertyDisplayCsvRows, hasProductConfigCsvColumns, mergeProductConfigFromCsv, productConfigFromCsvRow } from "@/lib/catalog-csv-config";
import type { ProductCatalogItem } from "@/types/print-platform";

const product = {
  slug: "broschueren",
  name: "Broschüren",
  category: "druck",
  short: "",
  description: "",
  seo: "",
  heroImage: "/keep-image.webp",
  gallery: [],
  rating: 4.8,
  basePrice: 0,
  deliveryText: "3-5 Werktage",
  tags: [],
  variants: [],
  production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" },
  pricingProperties: [
    { propertyId: "broschuere-format", name: "Broschüre Format", values: [{ value: "A5", enabled: true, pricingMode: "included" }] },
    { propertyId: "umschlag-option", name: "Umschlag", values: [{ value: "Separater Umschlag", enabled: true, pricingMode: "included" }] }
  ]
} satisfies ProductCatalogItem;

assert.equal(hasProductConfigCsvColumns({ slug: "flyer", name: "Flyer" }), false);
assert.deepEqual(productConfigFromCsvRow({ slug: "flyer", name: "Flyer" }), {});

const configOnly = mergeProductConfigFromCsv(product, {
  slug: "broschueren",
  configuratorProfile: "brochure",
  pdfAnalysisMode: "required",
  previewMode: "thumbnails",
  minPages: "4",
  pageMultiple: "4",
  allowPageMapping: "true",
  formatCheck: "true",
  allowFormatOverride: "true"
});
assert.equal(configOnly.name, product.name);
assert.equal(configOnly.heroImage, product.heroImage);
assert.equal(configOnly.configuratorProfile, "brochure");
assert.equal(configOnly.pdfAnalysisMode, "required");
assert.equal(configOnly.pdfConfig?.previewMode, "thumbnails");
assert.equal(configOnly.pdfConfig?.minPages, 4);
assert.equal(configOnly.pdfConfig?.pageMultiple, 4);
assert.equal(configOnly.pdfConfig?.allowPageMapping, true);
assert.equal(configOnly.pdfConfig?.formatCheck, true);
assert.equal(configOnly.pdfConfig?.allowFormatOverride, true);

const display = applyPropertyDisplayCsvRows([product], [
  { productSlug: "broschueren", propertySlug: "broschuere-format", control: "buttons", section: "format", advanced: "false", sortOrder: "10" },
  { productSlug: "broschueren", propertySlug: "umschlag-option", control: "cards", section: "cover", advanced: "true", sortOrder: "20" }
]);
assert.deepEqual(display.skipped, []);
assert.equal(display.products.length, 1);
assert.equal(display.products[0].pricingProperties?.[0].display?.control, "buttons");
assert.equal(display.products[0].pricingProperties?.[0].display?.section, "format");
assert.equal(display.products[0].pricingProperties?.[0].display?.advanced, false);
assert.equal(display.products[0].pricingProperties?.[0].sortOrder, 10);
assert.equal(display.products[0].pricingProperties?.[1].display?.control, "cards");
assert.equal(display.products[0].pricingProperties?.[1].display?.advanced, true);

console.log("catalog-csv-config tests passed");
