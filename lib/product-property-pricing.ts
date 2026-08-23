import type { GlobalProperty, ProductCatalogItem, ProductPriceTier, ProductPricingProperty, ProductPropertyTierPrice } from "@/types/print-platform";

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

export function productPropertyFromGlobal(property: GlobalProperty, tiers: ProductPriceTier[] = []): ProductPricingProperty {
  const tierRows = tiers.length ? tiers : [{ quantity: 1, price: 0 }];
  return {
    propertyId: property.slug,
    name: property.name,
    required: true,
    sortOrder: property.sortOrder ?? 0,
    values: (property.values ?? [])
      .filter((value) => value.active !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((value, index) => ({
        propertyValueId: value.id,
        value: value.value,
        label: value.label,
        image: value.image,
        description: value.description,
        enabled: true,
        defaultSelected: index === 0,
        sortOrder: index,
        pricingMode: "global" as const,
        tierPrices: tierRows.map((tier) => ({
          quantity: Number(tier.fromQuantity ?? tier.quantity),
          fromQuantity: Number(tier.fromQuantity ?? tier.quantity),
          toQuantity: tier.toQuantity,
          price: 0
        }))
      }))
  };
}

export function resolveGlobalPropertyPricing(product: ProductCatalogItem, globalProperties: GlobalProperty[]) {
  if (!product.pricingProperties?.length || !globalProperties.length) return product;
  const globalBySlug = new Map(globalProperties.map((property) => [property.slug.toLowerCase(), property]));
  const globalByName = new Map(globalProperties.map((property) => [property.name.toLowerCase(), property]));

  return {
    ...product,
    pricingProperties: product.pricingProperties.map((property) => {
      const global = (property.propertyId ? globalBySlug.get(property.propertyId.toLowerCase()) : undefined)
        ?? globalByName.get(property.name.toLowerCase());
      if (!global) return property;
      const globalValuesById = new Map((global.values ?? []).map((value) => [value.id.toLowerCase(), value]));
      const globalValuesByVal = new Map((global.values ?? []).map((value) => [value.value.toLowerCase(), value]));
      return {
        ...property,
        name: global.name || property.name,
        values: (property.values ?? []).map((value) => {
          if (value.pricingMode !== "global") return value;
          const globalValue = (value.propertyValueId ? globalValuesById.get(value.propertyValueId.toLowerCase()) : undefined)
            ?? globalValuesByVal.get(value.value.toLowerCase());
          if (!globalValue) return { ...value, pricingMode: "included" as const };
          const pricingMode = globalValue.pricingMode ?? "included";
          return {
            ...value,
            value: globalValue.value || value.value,
            label: globalValue.label ?? value.label,
            image: value.image ?? globalValue.image,
            description: value.description ?? globalValue.description,
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
