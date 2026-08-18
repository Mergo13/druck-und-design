import { strict as assert } from "assert";
import { calculateConfiguredProductPrice, calculateTierPrice } from "@/lib/print-workflow";
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

// ---------------------------------------------------------------------------
// Tests for CSV Product Import with pricingProperties and Flyer Verification
// ---------------------------------------------------------------------------
import { productPropertyFromGlobal } from "@/lib/product-property-pricing";

const globalPropertiesList: GlobalProperty[] = [
  {
    slug: "format",
    name: "Format",
    active: true,
    sortOrder: 1,
    values: [
      { id: "format-a6", value: "A6", active: true, sortOrder: 0, pricingMode: "multiplier", multiplier: 1.0 },
      { id: "format-a5", value: "A5", active: true, sortOrder: 1, pricingMode: "multiplier", multiplier: 1.5 },
      { id: "format-a4", value: "A4", active: true, sortOrder: 2, pricingMode: "multiplier", multiplier: 2.0 }
    ]
  },
  {
    slug: "druckart",
    name: "Druckart",
    active: true,
    sortOrder: 2,
    values: [
      { id: "druckart-digital", value: "Digitaldruck", active: true, sortOrder: 0, pricingMode: "multiplier", multiplier: 1.0 },
      { id: "druckart-offset", value: "Offsetdruck", active: true, sortOrder: 1, pricingMode: "multiplier", multiplier: 1.2 }
    ]
  },
  {
    slug: "druckseiten",
    name: "Druckseiten",
    active: true,
    sortOrder: 3,
    values: [
      { id: "druckseiten-1-seitig", value: "1-seitig", active: true, sortOrder: 0, pricingMode: "multiplier", multiplier: 1.0 },
      { id: "druckseiten-2-seitig", value: "2-seitig", active: true, sortOrder: 1, pricingMode: "multiplier", multiplier: 1.4 }
    ]
  },
  {
    slug: "papier",
    name: "Papier",
    active: true,
    sortOrder: 4,
    values: [
      { id: "papier-135g", value: "135g Bilderdruck", active: true, sortOrder: 0, pricingMode: "included" },
      { id: "papier-250g", value: "250g Bilderdruck", active: true, sortOrder: 1, pricingMode: "fixed", fixedPrice: 0.05 },
      {
        id: "papier-300g",
        value: "300g Bilderdruck",
        active: true,
        sortOrder: 2,
        pricingMode: "tiered",
        tierPrices: [
          { quantity: 25, fromQuantity: 25, toQuantity: 49, price: 0.10, unitPrice: 0.10 },
          { quantity: 50, fromQuantity: 50, toQuantity: 99, price: 0.08, unitPrice: 0.08 }
        ]
      }
    ]
  },
  {
    slug: "veredelung",
    name: "Veredelung",
    active: true,
    sortOrder: 5,
    values: [
      { id: "veredelung-ohne", value: "Ohne", active: true, sortOrder: 0, pricingMode: "included" },
      { id: "veredelung-mattlack", value: "Mattlack", active: true, sortOrder: 1, pricingMode: "fixed", fixedPrice: 0.15 },
      { id: "veredelung-glanzlack", value: "Glanzlack", active: true, sortOrder: 2, pricingMode: "flat", fixedPrice: 20 }
    ]
  }
];

// Helper to simulate CSV import mapping function
function simulateCsvProductImport(csvRow: { priceTiers?: string; pricingProperties?: string; basePrice?: string }, globals: GlobalProperty[]) {
  const basePrice = Number(csvRow.basePrice ?? 0);
  const tiers = (csvRow.priceTiers ?? "").split("|").map((entry) => {
    const [range, price] = entry.split(":");
    const [from, to] = range.split("-");
    const fromQuantity = Number(from);
    const toQuantity = to ? Number(to) : undefined;
    const unitPrice = Number(price);
    return { quantity: fromQuantity, fromQuantity, toQuantity, unitPrice, price: unitPrice };
  }).filter((t) => t.quantity > 0);

  const rawPricingProperties = csvRow.pricingProperties ?? "";
  const propertySlugs = rawPricingProperties.split("|").map((s) => s.trim()).filter(Boolean);
  const pricingProperties = [];

  if (propertySlugs.length > 0) {
    for (const propertySlug of propertySlugs) {
      const globalProperty = globals.find(
        (item) => item.slug.toLowerCase() === propertySlug.toLowerCase() || item.name.toLowerCase() === propertySlug.toLowerCase()
      );
      if (!globalProperty) {
        throw new Error(`Unbekannte globale Eigenschaft: ${propertySlug}`);
      }
      pricingProperties.push(productPropertyFromGlobal(globalProperty, tiers));
    }
  }

  return {
    slug: "flyer",
    name: "Flyer",
    category: "druck",
    basePrice,
    pricingType: "tiered" as const,
    priceTiers: tiers,
    pricingProperties
  } as ProductCatalogItem;
}

// 1. Verify unknown global property error
assert.throws(
  () => simulateCsvProductImport({ pricingProperties: "format|druckxyz" }, globalPropertiesList),
  /Unbekannte globale Eigenschaft: druckxyz/
);

// 2. Backward compatibility: CSV without pricingProperties
const backwardCompatibleProduct = simulateCsvProductImport(
  { basePrice: "0.50", priceTiers: "25-49:0.50|50-99:0.40" },
  globalPropertiesList
);
assert.equal(backwardCompatibleProduct.pricingProperties?.length, 0);

// 3. Import Flyer with format|druckart|druckseiten|papier|veredelung
const importedFlyer = simulateCsvProductImport(
  {
    basePrice: "0.716",
    priceTiers: "25-49:0.716|50-99:0.438",
    pricingProperties: "format|druckart|druckseiten|papier|veredelung"
  },
  globalPropertiesList
);

// Confirm all 5 Eigenschaften are attached
assert.equal(importedFlyer.pricingProperties?.length, 5);
assert.deepEqual(
  importedFlyer.pricingProperties?.map((p) => p.propertyId),
  ["format", "druckart", "druckseiten", "papier", "veredelung"]
);

// Confirm every value has pricingMode: "global"
for (const prop of importedFlyer.pricingProperties ?? []) {
  for (const val of prop.values) {
    assert.equal(val.pricingMode, "global");
  }
}

// Resolve global property pricing
const resolvedFlyer = resolveGlobalPropertyPricing(importedFlyer, globalPropertiesList);

// Test 1: Base Tier 25-49 (unit price rounded to 0.72) with all defaults (A6 mult 1.0, Digital mult 1.0, 1-seitig mult 1.0, 135g included, Ohne included)
const basePriceResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 25 * 0.72 = 18.00
assert.equal(basePriceResult.total, 18);

// Test 2: Format Multiplier (A5 = 1.5)
const formatMultResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A5",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 18.00 * 1.5 = 27.00
assert.equal(formatMultResult.total, 27);

// Test 3: Druckart Multiplier (Offset = 1.2) + Format Multiplier (A5 = 1.5)
const druckartMultResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A5",
  "eigenschaft:Druckart": "Offsetdruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 18.00 * 1.5 * 1.2 = 32.40
assert.equal(druckartMultResult.total, 32.4);

// Test 4: Druckseiten Multiplier (2-seitig = 1.4) + Format A5 (1.5) + Offset (1.2)
const druckseitenMultResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A5",
  "eigenschaft:Druckart": "Offsetdruck",
  "eigenschaft:Druckseiten": "2-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 18.00 * 1.5 * 1.2 * 1.4 = 45.36
assert.equal(druckseitenMultResult.total, 45.36);

// Test 5: Papier Fixed Surcharge (250g = +0.05 / Stk)
const papierFixedResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "250g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 18.00 + (25 * 0.05) = 19.25
assert.equal(papierFixedResult.total, 19.25);

// Test 6: Papier Tiered Surcharge (300g at quantity 50 = +0.08 / Stk, tier base = 50 * 0.44 = 22.00)
const papierTieredResult = calculateConfiguredProductPrice(resolvedFlyer, 50, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "300g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 22.00 + (50 * 0.08) = 26.00
assert.equal(papierTieredResult.total, 26);

// Test 7: Veredelung Surcharge (Mattlack fixed +0.15 / Stk, Glanzlack flat +20 EUR)
const veredelungFixedResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Mattlack"
});
// 18.00 + (25 * 0.15) = 21.75
assert.equal(veredelungFixedResult.total, 21.75);

const veredelungFlatResult = calculateConfiguredProductPrice(resolvedFlyer, 25, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Glanzlack"
});
// 18.00 + 20 = 38.00
assert.equal(veredelungFlatResult.total, 38);

// Test 8: Out-of-range quantities when typing auflage (e.g. quantity 1 when lowest tier is 25, or quantity 200 when highest is 99)
const qty1Result = calculateConfiguredProductPrice(resolvedFlyer, 1, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 1 * 0.72 = 0.72
assert.equal(qty1Result.total, 0.72);

const qty200Result = calculateConfiguredProductPrice(resolvedFlyer, 200, {
  "eigenschaft:Format": "A6",
  "eigenschaft:Druckart": "Digitaldruck",
  "eigenschaft:Druckseiten": "1-seitig",
  "eigenschaft:Papier": "135g Bilderdruck",
  "eigenschaft:Veredelung": "Ohne"
});
// 200 * 0.44 = 88.00
assert.equal(qty200Result.total, 88);

// Direct calculateTierPrice tests
const directBelowTier = calculateTierPrice(1, [{ quantity: 25, fromQuantity: 25, toQuantity: 49, price: 0.72 }]);
assert.equal(directBelowTier.unitPrice, 0.72);
assert.equal(directBelowTier.totalPrice, 0.72);

const directAboveTier = calculateTierPrice(500, [{ quantity: 25, fromQuantity: 25, toQuantity: 49, price: 0.72 }, { quantity: 50, fromQuantity: 50, toQuantity: 99, price: 0.44 }]);
assert.equal(directAboveTier.unitPrice, 0.44);
assert.equal(directAboveTier.totalPrice, 220);

const directEmptyTier = calculateTierPrice(5, []);
assert.equal(directEmptyTier.unitPrice, 0);
assert.equal(directEmptyTier.totalPrice, 0);

console.log("global-property-pricing tests passed");
