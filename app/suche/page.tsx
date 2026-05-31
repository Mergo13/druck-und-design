import { ShopBrowser } from "@/features/shop/shop-browser";
import { getCategories, getProducts } from "@/lib/catalog-repository";

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string; kategorie?: string }> }) {
  const params = await searchParams;
  const initialQuery = params?.q ?? "";
  const initialCategory = params?.kategorie;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Suche</h1>
      <p className="mt-3 text-muted-foreground">Finden Sie Produkte, Materialien und passende Leistungen.</p>
      <div className="mt-8"><ShopBrowser initialCategory={initialCategory} initialQuery={initialQuery} categories={categories} products={products} /></div>
    </section>
  );
}
