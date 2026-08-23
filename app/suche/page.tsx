import { ShopBrowser } from "@/features/shop/shop-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { shopCategoriesForProducts, shopProductsFromCatalog } from "@/lib/shop-products";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string; kategorie?: string }> }) {
  const params = await searchParams;
  const initialQuery = params?.q ?? "";
  const initialCategory = params?.kategorie;
  const [categories, rawProducts, session] = await Promise.all([getPublicCategories(), getPublicProducts(), getSessionUser()]);
  const authenticated = Boolean(session);
  const shopProducts = shopProductsFromCatalog(rawProducts);
  const shopCategories = shopCategoriesForProducts(categories, rawProducts);
  const products = authenticated ? shopProducts : shopProducts.map(withoutPrices);
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Suche</h1>
      <p className="mt-3 text-muted-foreground">Finden Sie Produkte, Materialien und passende Leistungen.</p>
      <div className="mt-8"><ShopBrowser initialCategory={initialCategory} initialQuery={initialQuery} categories={shopCategories} products={products} authenticated={authenticated} /></div>
    </section>
  );
}
