import type { Metadata } from "next";
import { ShopBrowser } from "@/features/shop/shop-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { shopCategoriesForProducts, shopProductsFromCatalog } from "@/lib/shop-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produkte",
  description: "Druckprodukte online konfigurieren und anfragen."
};

export default async function ProduktePage({ searchParams }: { searchParams?: Promise<{ kategorie?: string; q?: string }> }) {
  const params = await searchParams;
  const initialCategory = params?.kategorie;
  const initialQuery = params?.q;
  const [categories, rawProducts, session] = await Promise.all([getPublicCategories(), getPublicProducts(), getSessionUser()]);
  const authenticated = Boolean(session);
  const shopProducts = shopProductsFromCatalog(rawProducts);
  const shopCategories = shopCategoriesForProducts(categories, rawProducts);
  const products = authenticated ? shopProducts : shopProducts.map(withoutPrices);

  return (
    <section className="pb-14">
      <div className="relative overflow-hidden bg-brand-ink text-white">
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="container-page relative flex min-h-[240px] items-end py-12">
          <div>
            <p className="inline-flex border-l-4 border-brand-coral bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">Online Shop</p>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">Produkte</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">Produkt auswählen und anschließend konfigurieren.</p>
          </div>
        </div>
      </div>
      <div className="container-page py-10">
        <ShopBrowser initialCategory={initialCategory} initialQuery={initialQuery} categories={shopCategories} products={products} authenticated={authenticated} />
      </div>
    </section>
  );
}
