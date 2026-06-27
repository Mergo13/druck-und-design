import type { Metadata } from "next";
import { ShopBrowser } from "@/features/shop/shop-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";

export const metadata: Metadata = {
  title: "Leistungen",
  description: "Unsere professionellen Druck- und Design-Dienstleistungen."
};

export default async function LeistungenPage({ searchParams }: { searchParams?: Promise<{ kategorie?: string; q?: string }> }) {
  const params = await searchParams;
  const initialCategory = params?.kategorie;
  const initialQuery = params?.q;
  const [categories, products] = await Promise.all([getPublicCategories(), getPublicProducts()]);

  return (
    <section className="container-page py-10">
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-soft md:p-8">
        <p className="font-bold text-primary">Shop</p>
        <h1 className="mt-2 text-4xl font-black">Leistungen & Produkte</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Minimal, schnell und direkt kaufbar. Wählen Sie Produkte, legen Sie sie in den Warenkorb und bestellen Sie bequem online.</p>
      </div>
      <ShopBrowser initialCategory={initialCategory} initialQuery={initialQuery} categories={categories} products={products} />
    </section>
  );
}
