import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopBrowser } from "@/features/shop/shop-browser";
import { getCategories, getProducts } from "@/lib/catalog-repository";

export async function generateMetadata({ params }: { params: Promise<{ kategorie: string }> }): Promise<Metadata> {
  const { kategorie } = await params;
  const category = (await getCategories()).find((item) => item.slug === kategorie);
  return {
    title: category?.name ?? "Kategorie",
    description: category?.description
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ kategorie: string }> }) {
  const { kategorie } = await params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const category = categories.find((item) => item.slug === kategorie);
  if (!category) notFound();

  return (
    <section className="container-page py-10">
      <div className="mb-8 rounded-lg bg-slate-50 p-8">
        <p className="font-bold text-primary">Kategorie</p>
        <h1 className="mt-2 text-4xl font-black">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{category.description} Konfigurieren Sie Format, Papier, Auflage und Lieferzeit mit transparenten Preisen und professionellem Druckdatencheck.</p>
      </div>
      <ShopBrowser initialCategory={category.slug} categories={categories} products={products} />
    </section>
  );
}
