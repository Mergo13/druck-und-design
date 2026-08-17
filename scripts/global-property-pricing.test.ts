import { strict as assert } from "assert";
import { calculateConfiguredProductPrice } from "@/lib/print-workflow";
import { resolveGlobalPropertyPricing } from "@/lib/product-property-pricing";
import type { GlobalProperty, ProductCatalogItem } from "@/types/print-platform";

const paper: GlobalProperty = {
  slug: "papier",
  name: "Papier",
  active: true,
  sortOrder: 0,
  values: [
    { id: "papier-120g", value: "120g", label: "120 g Premium", active: true, sortOrder: 0, pricingMode: "fixed", fixedPrice: 25 }
  ]
};

const product = {
  slug: "digitaldruck-farbe",
  name: "Digitaldruck Farbe",
  category: "druckprodukte",
  short: "",
  description: "",
  seo: "",
  heroImage: "",
  gallery: [],
  rating: 5,
  basePrice: 100,
  pricingType: "fixed",
  deliveryText: "",
  tags: [],
  variants: [],
  production: { baseProductionDays: 3, expressAvailable: true, preflightProfile: "standard-print", renderPipeline: "pdf-x4" },
  pricingProperties: [{
    propertyId: "papier",
    name: "Papier",
    values: [{
      propertyValueId: "papier-120g",
      value: "120g",
      enabled: true,
      defaultSelected: true,
      pricingMode: "global"
    }]
  }]
} as ProductCatalogItem;

const resolved = resolveGlobalPropertyPricing(product, [paper]);
assert.equal(calculateConfiguredProductPrice(resolved, 1, { "eigenschaft:Papier": "120g" }).total, 125);
assert.equal(calculateConfiguredProductPrice(resolved, 3, { "eigenschaft:Papier": "120g" }).total, 375);

const override = {
  ...product,
  pricingProperties: [{
    ...product.pricingProperties![0],
    values: [{ ...product.pricingProperties![0].values[0], pricingMode: "fixed" as const, fixedPrice: 10 }]
  }]
};
assert.equal(calculateConfiguredProductPrice(resolveGlobalPropertyPricing(override, [paper]), 1, { "eigenschaft:Papier": "120g" }).total, 110);

const tieredProduct = {
  ...product,
  basePrice: 0,
  pricingType: "tiered" as const,
  priceTiers: [{ quantity: 100, fromQuantity: 100, toQuantity: 499, price: 0.36, unitPrice: 0.36 }],
  pricingProperties: [
    {
      propertyId: "format",
      name: "Format",
      values: [{ propertyValueId: "format-a3", value: "A3", enabled: true, defaultSelected: true, pricingMode: "global" as const }]
    },
    {
      propertyId: "papier",
      name: "Papier",
      values: [{ propertyValueId: "papier-250g", value: "250g", enabled: true, defaultSelected: true, pricingMode: "global" as const }]
    },
    {
      propertyId: "druckseiten",
      name: "Druckseiten",
      values: [{ propertyValueId: "druckseiten-beidseitig", value: "Beidseitig", enabled: true, defaultSelected: true, pricingMode: "global" as const }]
    }
  ]
} as ProductCatalogItem;

const tieredGlobals: GlobalProperty[] = [
  { slug: "format", name: "Format", active: true, sortOrder: 0, values: [{ id: "format-a3", value: "A3", active: true, sortOrder: 0, pricingMode: "tiered", tierPrices: [{ quantity: 100, fromQuantity: 100, toQuantity: 499, price: 0.36, unitPrice: 0.36 }] }] },
  { slug: "papier", name: "Papier", active: true, sortOrder: 0, values: [{ id: "papier-250g", value: "250g", active: true, sortOrder: 0, pricingMode: "tiered", tierPrices: [{ quantity: 100, fromQuantity: 100, toQuantity: 499, price: 0.24, unitPrice: 0.24 }] }] },
  { slug: "druckseiten", name: "Druckseiten", active: true, sortOrder: 0, values: [{ id: "druckseiten-beidseitig", value: "Beidseitig", active: true, sortOrder: 0, pricingMode: "tiered", tierPrices: [{ quantity: 100, fromQuantity: 100, toQuantity: 499, price: 0.30, unitPrice: 0.30 }] }] }
];
const tieredResolved = resolveGlobalPropertyPricing(tieredProduct, tieredGlobals);
assert.equal(calculateConfiguredProductPrice(tieredResolved, 100, {
  "eigenschaft:Format": "A3",
  "eigenschaft:Papier": "250g",
  "eigenschaft:Druckseiten": "Beidseitig"
}).total, 126);

const completeCopyProduct = {
  ...product,
  basePrice: 6.5,
  pricingProperties: [
    {
      name: "Papier",
      values: [{ value: "Standard", enabled: true, defaultSelected: true, pricingMode: "fixed" as const, fixedPrice: 1.3 }]
    },
    {
      name: "Bindung",
      values: [{ value: "Hardcover", enabled: true, defaultSelected: true, pricingMode: "fixed" as const, fixedPrice: 4 }]
    },
    {
      name: "Prägung",
      values: [{ value: "Gold", enabled: true, defaultSelected: true, pricingMode: "fixed" as const, fixedPrice: 7 }]
    }
  ]
} as ProductCatalogItem;
const completeCopyPrice = calculateConfiguredProductPrice(completeCopyProduct, 3, {
  "eigenschaft:Papier": "Standard",
  "eigenschaft:Bindung": "Hardcover",
  "eigenschaft:Prägung": "Gold"
});
assert.equal(completeCopyPrice.total, 56.4);

const oneTimeFeeProduct = {
  ...product,
  basePrice: 10,
  pricingProperties: [{
    name: "Datenaufbereitung",
    values: [{ value: "Einmalig", enabled: true, defaultSelected: true, pricingMode: "flat" as const, fixedPrice: 5 }]
  }]
} as ProductCatalogItem;
assert.equal(calculateConfiguredProductPrice(oneTimeFeeProduct, 3, { "eigenschaft:Datenaufbereitung": "Einmalig" }).total, 35);

const pagePricedStudentProduct = {
  ...product,
  basePrice: 0.25,
  pricingProperties: [
    {
      name: "Bindung",
      values: [{ value: "Hardcover", enabled: true, defaultSelected: true, pricingMode: "fixed" as const, fixedPrice: 4 }]
    },
    {
      name: "Prägung",
      values: [{ value: "Gold", enabled: true, defaultSelected: true, pricingMode: "fixed" as const, fixedPrice: 19 }]
    }
  ]
} as ProductCatalogItem;
const pagePricedStudentPrice = calculateConfiguredProductPrice(pagePricedStudentProduct, 3, {
  "eigenschaft:Bindung": "Hardcover",
  "eigenschaft:Prägung": "Gold"
}, {
  baseQuantity: 78,
  propertyQuantity: 3
});
assert.equal(pagePricedStudentPrice.basePrice, 19.5);
assert.equal(pagePricedStudentPrice.total, 88.5);

const documentQuantityProduct = {
  ...product,
  basePrice: 0,
  pricingType: "fixed" as const,
  pricingProperties: [
    {
      name: "SW Druck",
      values: [{
        value: "sw",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 0.1,
        production: { pricingQuantitySource: "black_white_pages" as const }
      }]
    },
    {
      name: "Farbdruck",
      values: [{
        value: "farbe",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 0.45,
        production: { pricingQuantitySource: "color_pages" as const }
      }]
    },
    {
      name: "Innenpapier",
      values: [{
        value: "120g",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 0.02,
        production: { pricingQuantitySource: "sheets" as const }
      }]
    },
    {
      name: "Deckblatt",
      values: [{
        value: "250g",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 0.5,
        production: { pricingQuantitySource: "front_covers" as const }
      }]
    },
    {
      name: "Klarsichtfolie",
      values: [{
        value: "mit",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 0.25,
        production: { pricingQuantitySource: "copies" as const }
      }]
    },
    {
      name: "Einrichtung",
      values: [{
        value: "standard",
        enabled: true,
        defaultSelected: true,
        pricingMode: "fixed" as const,
        fixedPrice: 5,
        production: { pricingQuantitySource: "per_order" as const }
      }]
    }
  ]
} as ProductCatalogItem;
const documentQuantityPrice = calculateConfiguredProductPrice(documentQuantityProduct, 5, {}, {
  baseQuantity: 90,
  propertyQuantity: 5,
  copies: 5,
  printedPages: 90,
  sheets: 45,
  blackWhitePages: 70,
  colorPages: 20,
  frontCovers: 5,
  backCovers: 5,
  perOrder: 1
});
assert.equal(documentQuantityPrice.total, 25.65);

console.log("global-property-pricing tests passed");
