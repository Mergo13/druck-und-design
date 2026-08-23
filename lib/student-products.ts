import type { ProductCatalogItem } from "@/types/print-platform";

export function studentProductsFromCatalog(products: ProductCatalogItem[]) {
  return products
    .filter((product) => product.isStudentShop === true)
    .sort((a, b) => (a.studentShopSortOrder ?? 999) - (b.studentShopSortOrder ?? 999) || a.name.localeCompare(b.name, "de"));
}

export function studentProductHref(product: ProductCatalogItem) {
  return `/studenten/${product.slug}`;
}
