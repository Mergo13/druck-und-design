import { strict as assert } from "assert";
import { moduleCreateSchemas } from "@/lib/admin-schemas";
import { pricingQuantitiesForProductDocument } from "@/lib/document-production";
import { calculateConfiguredProductPrice } from "@/lib/print-workflow";
import { calculateProductPricingResult } from "@/lib/universal-pricing";
import type { GlobalProperty, ProductCatalogItem } from "@/types/print-platform";

const baseProduct: ProductCatalogItem = {
  slug: "test",
  name: "Test product",
  category: "druck",
  short: "",
  description: "",
  seo: "",
  heroImage: "",
  gallery: [],
  rating: 0,
  basePrice: 10,
  pricingType: "fixed",
  deliveryText: "1 Tag",
  tags: [],
  variants: [],
  production: { baseProductionDays: 1, expressAvailable: false, preflightProfile: "standard-print", renderPipeline: "pdf-x4" }
};

assert.equal(calculateProductPricingResult({
  product: { ...baseProduct, basePrice: 12 },
  quantity: 2,
  configuration: {}
}).total, 24);

assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingType: "tiered",
    priceTiers: [
      { quantity: 1, fromQuantity: 1, toQuantity: 49, price: 1, unitPrice: 1 },
      { quantity: 50, fromQuantity: 50, toQuantity: 999, price: 0.8, unitPrice: 0.8 }
    ]
  },
  quantity: 60,
  configuration: {}
}).total, 48);

assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "digital-document",
    pricingComponents: [
      { id: "print", label: "Druck", kind: "print", quantitySource: "printed_pages", sellingPrice: 0.1, costPrice: 0.03 }
    ]
  },
  quantity: 2,
  configuration: {},
  productionContext: { printedPages: 20, copies: 2 }
}).total, 2);

assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "digital-document",
    pricingComponents: [
      { id: "bw", label: "SW", kind: "print", quantitySource: "black_white_pages", sellingPrice: 0.08, costPrice: 0.02 },
      { id: "color", label: "Farbe", kind: "print", quantitySource: "color_pages", sellingPrice: 0.45, costPrice: 0.16 }
    ]
  },
  quantity: 1,
  configuration: {},
  productionContext: { blackWhitePages: 88, colorPages: 6 }
}).total, 9.74);

const thesis = calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "thesis",
    pricingComponents: [
      { id: "bw", label: "SW Druck", kind: "print", quantitySource: "black_white_pages", sellingPrice: 0.08, costPrice: 0.02 },
      { id: "color", label: "Farbdruck", kind: "print", quantitySource: "color_pages", sellingPrice: 0.45, costPrice: 0.16 },
      { id: "paper", label: "Papier", kind: "paper", quantitySource: "sheets", sellingPrice: 0.03, costPrice: 0.012 },
      { id: "binding", label: "Hardcover", kind: "binding", quantitySource: "copies", sellingPrice: 18, costPrice: 10 },
      { id: "embossing", label: "Prägung", kind: "embossing", quantitySource: "embossing_lines", sellingPrice: 4, costPrice: 1.2 },
      { id: "setup", label: "Setup", kind: "setup", quantitySource: "per_order", sellingPrice: 5, costPrice: 2 }
    ]
  },
  quantity: 1,
  configuration: {},
  productionContext: { blackWhitePages: 80, colorPages: 4, sheets: 42, copies: 1, embossingLines: 3, perOrder: 1 }
});
assert.equal(thesis.customerPrice, 44.46);
assert.equal(thesis.productionCost, 18.34);

assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "area-print",
    pricingComponents: [
      { id: "area", label: "Poster", kind: "print", quantitySource: "area_m2", sellingPrice: 30, costPrice: 12 }
    ],
    areaPricing: { defaultWidthCm: 100, defaultHeightCm: 200 }
  },
  quantity: 1,
  configuration: { areaWidthCm: "100", areaHeightCm: "200" }
}).total, 60);

assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "large-format",
    pricingComponents: [
      { id: "area", label: "Banner", kind: "material", quantitySource: "area_m2", sellingPrice: 25, costPrice: 11 },
      { id: "hem", label: "Saum", kind: "finishing", quantitySource: "perimeter_m", sellingPrice: 3, costPrice: 1 }
    ]
  },
  quantity: 1,
  configuration: { areaWidthCm: "100", areaHeightCm: "200" }
}).total, 68);

const guarded = calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: "custom-formula",
    pricingComponents: [
      { id: "labor", label: "Arbeit", kind: "labor", quantitySource: "labor_minutes", sellingPrice: 20, costPrice: 29 }
    ],
    pricingGuards: { minimumMarginPercent: 30 }
  },
  quantity: 1,
  configuration: {},
  productionContext: { laborMinutes: 1 }
});
assert.equal(guarded.marginGuardApplied, true);
assert.equal(guarded.customerPrice, 41.43);

const globals: GlobalProperty[] = [{
  slug: "paper",
  name: "Papier",
  active: true,
  sortOrder: 0,
  values: [{ id: "premium", value: "Premium", active: true, sortOrder: 0, pricingMode: "fixed", fixedPrice: 0.025, costPrice: 0.01 }]
}];
assert.equal(calculateProductPricingResult({
  product: {
    ...baseProduct,
    pricingProfile: {
      key: "sheet-print",
      components: [{ id: "paper", label: "Papier", kind: "paper", quantitySource: "sheets", pricingSource: "global", propertyId: "paper", propertyValueId: "premium", priceOverride: 0.018, costOverride: 0.008 }]
    }
  },
  quantity: 1,
  configuration: {},
  productionContext: { sheets: 100 },
  globalProperties: globals
}).total, 1.8);

const legacyProduct = {
  ...baseProduct,
  pricingType: "tiered" as const,
  priceTiers: [{ quantity: 10, fromQuantity: 10, toQuantity: 99, price: 0.5, unitPrice: 0.5 }]
};
assert.equal(
  calculateProductPricingResult({ product: legacyProduct, quantity: 10, configuration: {} }).total,
  calculateConfiguredProductPrice(legacyProduct, 10, {}).total
);

const flyerQuantitySourceProduct: ProductCatalogItem = {
  ...baseProduct,
  slug: "flyer-quantity-source",
  pricingType: "tiered",
  priceTiers: [{ quantity: 500, fromQuantity: 500, toQuantity: 999, price: 0.11, unitPrice: 0.11 }],
  pricingProperties: [
    {
      name: "Format",
      values: [{ value: "A5", enabled: true, defaultSelected: true, pricingMode: "multiplier", multiplier: 1.4 }]
    },
    {
      name: "Druckseiten",
      values: [{ value: "Beidseitig", enabled: true, defaultSelected: true, pricingMode: "multiplier", multiplier: 1.55 }]
    },
    {
      name: "Papier",
      values: [{ value: "Standard", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 0.02, production: { pricingQuantitySource: "copies" } }]
    },
    {
      name: "Laminierung",
      values: [{ value: "Matt", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 0.05, production: { pricingQuantitySource: "copies" } }]
    }
  ]
};
const flyerQuantitySource = calculateConfiguredProductPrice(flyerQuantitySourceProduct, 500, {});
assert.equal(flyerQuantitySource.basePrice, 55);
assert.equal(flyerQuantitySource.total, 154.35);
assert.equal(flyerQuantitySource.lines.find((line) => line.label === "Papier")?.quantitySource, "copies");
assert.equal(flyerQuantitySource.lines.find((line) => line.label === "Papier")?.quantity, 500);
assert.equal(flyerQuantitySource.lines.find((line) => line.label === "Papier")?.lineTotal, 10);
assert.equal(flyerQuantitySource.lines.find((line) => line.label === "Format")?.monetaryEffect, 22);
assert.equal(flyerQuantitySource.lines.find((line) => line.label === "Druckseiten")?.monetaryEffect, 42.35);

const hardcoverQuantitySourceProduct: ProductCatalogItem = {
  ...baseProduct,
  slug: "hardcover-quantity-source",
  pricingType: "fixed",
  basePrice: 15,
  configuratorProfile: "thesis",
  pricingProperties: [
    {
      name: "SW Druck",
      values: [{ value: "sw", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 0.08, production: { pricingQuantitySource: "black_white_pages" } }]
    },
    {
      name: "Farbdruck",
      values: [{ value: "farbe", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 0.45, production: { pricingQuantitySource: "color_pages" } }]
    },
    {
      name: "Papier",
      values: [{ value: "papier", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 0.02, production: { pricingQuantitySource: "sheets" } }]
    },
    {
      name: "Bindung",
      values: [{ value: "hardcover", enabled: true, defaultSelected: true, pricingMode: "fixed", fixedPrice: 5, production: { pricingQuantitySource: "copies" } }]
    }
  ]
};
const hardcoverConfig = {
  "Seiten pro Exemplar": "66",
  Druckseiten: "Beidseitig",
  printColorMode: "auto",
  pdfAnalysisColorPageCount: "10",
  pdfAnalysisBwPageCount: "56"
};
const hardcoverProduction = pricingQuantitiesForProductDocument(hardcoverQuantitySourceProduct, [], hardcoverConfig, 2);
assert.deepEqual(hardcoverProduction, {
  baseQuantity: 2,
  propertyQuantity: 2,
  copies: 2,
  printedPages: 132,
  sheets: 66,
  blackWhitePages: 112,
  colorPages: 20,
  frontCovers: 2,
  backCovers: 2,
  printedCoverSides: 4,
  embossingLines: 0,
  perOrder: 1
});
const hardcoverPrice = calculateConfiguredProductPrice(hardcoverQuantitySourceProduct, 2, hardcoverConfig, hardcoverProduction);
assert.equal(hardcoverPrice.baseQuantity, 2);
assert.equal(hardcoverPrice.basePrice, 30);
assert.equal(hardcoverPrice.lines.find((line) => line.label === "SW Druck")?.quantity, 112);
assert.equal(hardcoverPrice.lines.find((line) => line.label === "Farbdruck")?.quantity, 20);
assert.equal(hardcoverPrice.lines.find((line) => line.label === "Papier")?.quantity, 66);
assert.equal(hardcoverPrice.lines.find((line) => line.label === "Bindung")?.quantity, 2);
assert.equal(hardcoverPrice.total, 59.28);

const bannerQuantitySourceProduct: ProductCatalogItem = {
  ...baseProduct,
  slug: "banner-quantity-source",
  pricingType: "area",
  basePrice: 34.9,
  pricingProperties: [
    {
      name: "Material",
      values: [{ value: "premium", enabled: true, defaultSelected: true, pricingMode: "multiplier", multiplier: 1.08 }]
    }
  ]
};
const bannerPrice = calculateConfiguredProductPrice(bannerQuantitySourceProduct, 1, {
  areaWidthCm: "200",
  areaHeightCm: "100"
});
assert.equal(bannerPrice.basePrice, 69.8);
assert.equal(bannerPrice.total, 75.38);
assert.equal(bannerPrice.unitNet, 75.38);

const parsedProduct = moduleCreateSchemas.products.parse(flyerQuantitySourceProduct);
assert.equal(parsedProduct.pricingProperties?.[2]?.values[0]?.production?.pricingQuantitySource, "copies");

console.log("universal-pricing tests passed");
