import type { Metadata } from "next";
import { ShopBrowser } from "@/features/shop/shop-browser";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog-repository";
import { getSessionUser } from "@/lib/auth";
import { withoutPrices } from "@/lib/product-price-visibility";

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
  const products = authenticated ? rawProducts : rawProducts.map(withoutPrices);

  return (
    <section className="pb-14">
      <div className="relative overflow-hidden bg-brand-ink text-white">
        <div className="grid-bg absolute inset-0 opacity-20" />
        <div className="container-page relative grid min-h-[370px] items-end gap-8 py-14 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="inline-flex border-l-4 border-brand-coral bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">Online Shop</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">Druckprodukte, die Eindruck machen.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">Hochwertig produziert, klar konfiguriert und zuverlässig geliefert. Für Unternehmen, Marken und Menschen mit Anspruch.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-[380px]">
            {[["Online", "Konfigurator"], ["DB", "Preise"], ["Wels", "Beratung"]].map(([value, label]) => (
              <div className="border-t-2 border-brand-coral pt-3" key={label}>
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase text-white/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="container-page py-10">
        <ShopBrowser initialCategory={initialCategory} initialQuery={initialQuery} categories={categories} products={products} authenticated={authenticated} />
      </div>
    </section>
  );
}
