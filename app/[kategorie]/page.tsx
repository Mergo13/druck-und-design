import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopBrowser } from "@/features/shop/shop-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";
import { shopCategoriesForProducts, shopProductsFromCatalog } from "@/lib/shop-products";
import { ShowroomSection } from "@/components/showroom/showroom-section";
import { getCategoryShowroom } from "@/lib/showroom-content";
import { getSiteImageMap } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ kategorie: string }> }): Promise<Metadata> {
  const { kategorie } = await params;
  const category = (await getPublicCategories()).find((item) => item.slug === kategorie);
  return {
    title: category ? `${category.name} Wels` : "Kategorie",
    description: category ? `${category.description} Online konfigurieren und bei druck&design studio in Wels anfragen oder bestellen.` : undefined,
    alternates: { canonical: `/${kategorie}` },
    openGraph: category ? {
      title: `${category.name} Wels | druck&design studio`,
      description: category.description,
      url: `/${kategorie}`,
      type: "website",
      locale: "de_AT"
    } : undefined
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ kategorie: string }> }) {
  const { kategorie } = await params;
  const [categories, rawProducts, session, siteImages] = await Promise.all([getPublicCategories(), getPublicProducts(), getSessionUser(), getSiteImageMap()]);
  const authenticated = Boolean(session);
  const shopProducts = shopProductsFromCatalog(rawProducts);
  const shopCategories = shopCategoriesForProducts(categories, rawProducts);
  const products = authenticated ? shopProducts : shopProducts.map(withoutPrices);
  const category = shopCategories.find((item) => item.slug === kategorie);
  if (!category || ["druckservice", "werbetechnik", "werbeagentur", "kleidung-textilien", "leistungen"].includes(kategorie)) notFound();
  const showroomImages = getCategoryShowroom(category, siteImages);

  return (
    <section className="container-page py-10">
      <div className="mb-8 rounded-lg bg-slate-50 p-8">
        <p className="font-bold text-primary">Kategorie</p>
        <h1 className="mt-2 text-4xl font-black">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{category.description} Konfigurieren Sie Format, Papier, Auflage und Lieferzeit mit transparenten Preisen und professionellem Druckdatencheck.</p>
      </div>
      <ShowroomSection
        title={`${category.name} Showroom`}
        description="Typische Anwendungen und Umsetzungen für diese Produktgruppe."
        images={showroomImages}
      />
      <ShopBrowser initialCategory={category.slug} categories={shopCategories} products={products} authenticated={authenticated} />
    </section>
  );
}
