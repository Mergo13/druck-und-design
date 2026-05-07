import { ShopBrowser } from "@/features/shop/shop-browser";
import { getCategories, getProducts } from "@/lib/catalog-repository";

export default async function SearchPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Suche</h1>
      <p className="mt-3 text-muted-foreground">Finden Sie Produkte, Materialien und passende Drucklösungen.</p>
      <div className="mt-8"><ShopBrowser categories={categories} products={products} /></div>
    </section>
  );
}
