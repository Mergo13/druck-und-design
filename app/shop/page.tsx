import type { Metadata } from "next";
import { ShopBrowser } from "@/features/shop/shop-browser";

export const metadata: Metadata = {
  title: "Shop",
  description: "Online-Druckprodukte suchen, filtern und direkt mit Live-Preis konfigurieren."
};

export default async function ShopPage({ searchParams }: { searchParams?: Promise<{ kategorie?: string }> }) {
  const params = await searchParams;
  const initialCategory = params?.kategorie;

  return (
    <section className="container-page py-10">
      <div className="mb-8">
        <p className="font-bold text-primary">Online-Shop</p>
        <h1 className="mt-2 text-4xl font-black">Druckprodukte für jede Kampagne</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Filtern Sie nach Kategorie, prüfen Sie Express-Optionen und starten Sie direkt in die Konfiguration.</p>
      </div>
      <ShopBrowser initialCategory={initialCategory} />
    </section>
  );
}
