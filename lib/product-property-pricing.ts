import type { GlobalProperty, ProductCatalogItem, ProductPropertyTierPrice } from "@/types/print-platform";

function normalizeTierPrices(tiers: ProductPropertyTierPrice[] | undefined) {
  return (tiers ?? []).map((tier) => {
    const quantity = Number(tier.fromQuantity ?? tier.quantity);
    const unitPrice = Number(tier.unitPrice ?? tier.price) || 0;
    return {
      quantity,
      fromQuantity: quantity,
      toQuantity: tier.toQuantity,
      price: unitPrice,
      unitPrice
    };
  });
}

export function resolveGlobalPropertyPricing(product: ProductCatalogItem, globalProperties: GlobalProperty[]) {
  if (!product.pricingProperties?.length || !globalProperties.length) return product;
  const globalBySlug = new Map(globalProperties.map((property) => [property.slug, property]));

  return {
    ...product,
    pricingProperties: product.pricingProperties.map((property) => {
      const global = property.propertyId ? globalBySlug.get(property.propertyId) : undefined;
      if (!global) return property;
      const globalValues = new Map((global.values ?? []).map((value) => [value.id, value]));
      return {
        ...property,
        name: global.name || property.name,
        values: (property.values ?? []).map((value) => {
          if (value.pricingMode !== "global") return value;
          const globalValue = value.propertyValueId ? globalValues.get(value.propertyValueId) : undefined;
          if (!globalValue) return { ...value, pricingMode: "included" as const };
          const pricingMode = globalValue.pricingMode ?? "included";
          return {
            ...value,
            value: globalValue.value || value.value,
            label: globalValue.label ?? value.label,
            pricingMode,
            fixedPrice: pricingMode === "fixed" || pricingMode === "flat" ? Number(globalValue.fixedPrice ?? 0) || 0 : value.fixedPrice,
            multiplier: pricingMode === "multiplier" ? Number(globalValue.multiplier ?? 1) || 1 : value.multiplier,
            tierPrices: pricingMode === "tiered" ? normalizeTierPrices(globalValue.tierPrices) : value.tierPrices
          };
        })
      };
    })
  };
}
