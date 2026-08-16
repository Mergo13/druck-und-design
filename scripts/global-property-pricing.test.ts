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

console.log("global-property-pricing tests passed");
