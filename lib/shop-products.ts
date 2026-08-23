import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export function shopProductsFromCatalog(products: ProductCatalogItem[]) {
  return products.filter((product) => product.isStudentShop !== true);
}

export function isShopProduct(product: ProductCatalogItem | null | undefined) {
  return Boolean(product && product.isStudentShop !== true);
}

export function shopCategoriesForProducts(categories: ProductCategory[], products: ProductCatalogItem[]) {
  const categorySlugs = new Set(shopProductsFromCatalog(products).map((product) => product.category));
  return categories.filter((category) => categorySlugs.has(category.slug));
}
