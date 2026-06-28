"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export function ShopBrowser({ initialCategory, initialQuery, categories, products, authenticated }: { initialCategory?: string; initialQuery?: string; categories: ProductCategory[]; products: ProductCatalogItem[]; authenticated: boolean }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState(initialCategory ?? "alle");
  const [sort, setSort] = useState("beliebt");
  const [submitState, setSubmitState] = useState<"idle" | "ok" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory = category === "alle" || product.category === category || category === "same-day" && product.production.expressAvailable;
      const matchesQuery = [product.name, product.short, product.seo].join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    if (sort === "preis-auf") return result.sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "preis-ab") return result.sort((a, b) => b.basePrice - a.basePrice);
    if (sort === "name") return result.sort((a, b) => a.name.localeCompare(b.name, "de"));
    return result.sort((a, b) => b.rating - a.rating);
  }, [category, products, query, sort]);

  function addToCart(slug: string) {
    const product = products.find((item) => item.slug === slug);
    if (!product) return;
    const existing = JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<{ slug: string; name: string; quantity: number; category: string; unitPrice?: number }>;
    const merged = [...existing];
    const found = merged.find((entry) => entry.slug === product.slug);
    if (found) found.quantity += 1;
    else merged.push({ slug: product.slug, name: product.name, quantity: 1, category: product.category, unitPrice: product.basePrice });
    localStorage.setItem("dud_cart", JSON.stringify(merged));
    window.dispatchEvent(new Event("dud-cart-updated"));
    setSubmitState("ok");
    setSubmitMessage(`${product.name} wurde in den Warenkorb gelegt.`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="glass-panel h-fit rounded-lg border-slate-200/80 p-5 shadow-[0_14px_35px_rgba(17,34,68,.07)]">
        <div className="flex items-center gap-2 font-black text-brand-ink"><span className="grid h-9 w-9 place-items-center rounded-md bg-brand-blue text-white"><SlidersHorizontal className="h-4 w-4" /></span> Kategorien</div>
        <div className="mt-5 grid gap-2">
          <button onClick={() => setCategory("alle")} className={category === "alle" ? "rounded-md border border-brand-blue bg-brand-blue px-3 py-2.5 text-left text-sm font-bold text-white shadow-[0_8px_18px_rgba(17,85,204,.2)]" : "rounded-md border border-transparent px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:border-slate-200 hover:bg-brand-mist hover:text-brand-blue"}>Alle Produkte</button>
          {categories.map((item) => (
            <button onClick={() => setCategory(item.slug)} key={item.slug} className={category === item.slug ? "rounded-md border border-brand-blue bg-brand-blue px-3 py-2.5 text-left text-sm font-bold text-white shadow-[0_8px_18px_rgba(17,85,204,.2)]" : "rounded-md border border-transparent px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:border-slate-200 hover:bg-brand-mist hover:text-brand-blue"}>{item.name}</button>
          ))}
        </div>
        <div className="mt-6 rounded-md border-l-4 border-brand-coral bg-[#fff5f2] p-4">
          <p className="font-black text-brand-ink">Express verfügbar</p>
          <p className="mt-1 text-sm text-muted-foreground">Same-Day-Produkte sind in der Ergebnisliste markiert.</p>
        </div>
      </aside>
      <div>
        <div className="glass-panel flex flex-col gap-3 rounded-lg border-slate-200/80 p-4 shadow-[0_14px_35px_rgba(17,34,68,.07)] md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 transition focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/10">
            <Search className="h-4 w-4 text-brand-blue" />
            <input suppressHydrationWarning value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 flex-1 text-sm outline-none" placeholder="Produkt, Material oder Anwendung suchen" />
          </div>
          <select suppressHydrationWarning value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10">
            <option value="beliebt">Beliebtheit</option>
            {authenticated ? <option value="preis-auf">Preis: niedrig zuerst</option> : null}
            {authenticated ? <option value="preis-ab">Preis: hoch zuerst</option> : null}
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product, idx) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: Math.min(idx * 0.02, 0.2) }}
            >
              <ProductCard
                product={product}
                showPrices={authenticated}
                onAddToCart={authenticated ? addToCart : undefined}
              />
            </motion.div>
          ))}
        </div>
        <div className="glass-panel mt-8 rounded-lg border-slate-200/80 p-5">
          <p className="text-sm font-bold">Ihr Einkauf</p>
          <p className="mt-1 text-xs text-muted-foreground">Produkte direkt in den Warenkorb legen und danach im Checkout bestellen.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/warenkorb">Zum Warenkorb</Link>
            </Button>
          </div>
          {submitMessage ? (
            <p className={submitState === "error" ? "mt-2 text-xs text-red-600" : "mt-2 text-xs font-bold text-brand-blue"}>{submitMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
