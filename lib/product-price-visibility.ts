import type { ProductCatalogItem } from "@/types/print-platform";

export function withoutPrices(product: ProductCatalogItem): ProductCatalogItem {
  return {
    ...product,
    basePrice: 0,
    priceTiers: product.priceTiers?.map((tier) => ({ ...tier, price: 0, unitPrice: 0 })),
    pricingProperties: product.pricingProperties?.map((property) => ({
      ...property,
      stepPrice: undefined,
      values: property.values.map((value) => ({
        ...value,
        fixedPrice: undefined,
        tierPrices: value.tierPrices?.map((tier) => ({ ...tier, price: 0, unitPrice: 0 }))
      }))
    })),
    variants: product.variants.map((variant) => ({
      ...variant,
      priceRules: variant.priceRules.map((rule) => ({ ...rule, amount: 0 })),
      attributes: variant.attributes.map((attribute) => ({
        ...attribute,
        options: attribute.options?.map((option) => ({ ...option, priceModifier: undefined }))
      }))
    }))
  };
}
