"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { platformCategories, productCatalog } from "@/data/product-catalog";

export function ShopBrowser({ initialCategory }: { initialCategory?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "alle");
  const [sort, setSort] = useState("beliebt");

  const filtered = useMemo(() => {
    const result = productCatalog.filter((product) => {
      const matchesCategory = category === "alle" || product.category === category || category === "same-day" && product.production.expressAvailable;
      const matchesQuery = [product.name, product.short, product.seo].join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    return result.sort((a, b) => sort === "preis" ? a.basePrice - b.basePrice : b.rating - a.rating);
  }, [category, query, sort]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-lg border bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2 font-black"><SlidersHorizontal className="h-5 w-5" /> Filter</div>
        <div className="mt-5 grid gap-2">
          <button onClick={() => setCategory("alle")} className={category === "alle" ? "rounded-md bg-slate-950 px-3 py-2 text-left text-sm font-bold text-white" : "rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-muted"}>Alle Produkte</button>
          {platformCategories.map((item) => (
            <button onClick={() => setCategory(item.slug)} key={item.slug} className={category === item.slug ? "rounded-md bg-slate-950 px-3 py-2 text-left text-sm font-bold text-white" : "rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-muted"}>{item.name}</button>
          ))}
        </div>
        <div className="mt-6 rounded-lg bg-muted p-4">
          <p className="font-bold">Express verfügbar</p>
          <p className="mt-1 text-sm text-muted-foreground">Same-Day-Produkte sind in der Ergebnisliste markiert.</p>
        </div>
      </aside>
      <div>
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-soft md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-md border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 flex-1 text-sm outline-none" placeholder="Produkt, Material oder Anwendung suchen" />
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-md border bg-white px-3 text-sm">
            <option value="beliebt">Beliebtheit</option>
            <option value="preis">Preis aufsteigend</option>
          </select>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((page) => <button className={page === 1 ? "h-10 w-10 rounded-md bg-slate-950 text-white" : "h-10 w-10 rounded-md border"} key={page}>{page}</button>)}
        </div>
      </div>
    </div>
  );
}
