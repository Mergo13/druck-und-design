"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export function ShopBrowser({ initialCategory, initialQuery, categories, products, authenticated }: { initialCategory?: string; initialQuery?: string; categories: ProductCategory[]; products: ProductCatalogItem[]; authenticated: boolean }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState(initialCategory ?? "alle");
  const [sort, setSort] = useState("beliebt");

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory = category === "alle" || product.category === category;
      const matchesQuery = [product.name, product.short, product.seo].join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    if (sort === "preis-auf") return result.sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "preis-ab") return result.sort((a, b) => b.basePrice - a.basePrice);
    if (sort === "name") return result.sort((a, b) => a.name.localeCompare(b.name, "de"));
    return result.sort((a, b) => b.rating - a.rating);
  }, [category, products, query, sort]);

  return (
    <div>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px [scrollbar-width:none]" aria-label="Produktkategorien">
        <button
          type="button"
          aria-pressed={category === "alle"}
          onClick={() => setCategory("alle")}
          className={category === "alle" ? "shrink-0 border-b-2 border-brand-blue px-4 py-3 text-sm font-black text-brand-blue" : "shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-bold text-slate-600 transition hover:text-brand-blue"}
        >
          Alle Produkte
        </button>
        {categories.map((item) => (
          <button
            type="button"
            aria-pressed={category === item.slug}
            onClick={() => setCategory(item.slug)}
            key={item.slug}
            className={category === item.slug ? "shrink-0 border-b-2 border-brand-blue px-4 py-3 text-sm font-black text-brand-blue" : "shrink-0 border-b-2 border-transparent px-4 py-3 text-sm font-bold text-slate-600 transition hover:text-brand-blue"}
          >
            {item.name}
          </button>
        ))}
      </nav>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 transition focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/10">
            <Search className="h-4 w-4 text-brand-blue" />
            <input suppressHydrationWarning value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 text-sm outline-none" placeholder="Produkte durchsuchen" aria-label="Produkte durchsuchen" />
          </div>
          <select suppressHydrationWarning value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10" aria-label="Produkte sortieren">
            <option value="beliebt">Beliebtheit</option>
            {authenticated ? <option value="preis-auf">Preis: niedrig zuerst</option> : null}
            {authenticated ? <option value="preis-ab">Preis: hoch zuerst</option> : null}
            <option value="name">Name A-Z</option>
          </select>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, idx) => (
            <motion.div
              key={product.slug}
              className="h-full"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: Math.min(idx * 0.02, 0.2) }}
            >
              <ProductCard
                product={product}
                showPrices={authenticated}
              />
            </motion.div>
          ))}
      </div>
      {!filtered.length ? (
        <p className="mt-10 border-y border-slate-200 py-10 text-center text-sm text-muted-foreground">Keine passenden Produkte gefunden.</p>
      ) : null}
    </div>
  );
}
