import { ShopBrowser } from "@/features/shop/shop-browser";

export default function SearchPage() {
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Suche</h1>
      <p className="mt-3 text-muted-foreground">Finden Sie Produkte, Materialien und passende Drucklösungen.</p>
      <div className="mt-8"><ShopBrowser /></div>
    </section>
  );
}
