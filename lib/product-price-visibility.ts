import type { ProductCatalogItem } from "@/types/print-platform";

export function withoutPrices(product: ProductCatalogItem): ProductCatalogItem {
  return {
    ...product,
    basePrice: 0,
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
