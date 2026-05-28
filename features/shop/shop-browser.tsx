"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export function ShopBrowser({ initialCategory, categories, products }: { initialCategory?: string; categories: ProductCategory[]; products: ProductCatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "alle");
  const [sort, setSort] = useState("beliebt");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "ok" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { authenticated: boolean }) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory = category === "alle" || product.category === category || category === "same-day" && product.production.expressAvailable;
      const matchesQuery = [product.name, product.short, product.seo].join(" ").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
    return result.sort((a, b) => b.rating - a.rating);
  }, [category, products, query, sort]);

  function toggleSelected(slug: string) {
    setSelectedProducts((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  function submitSelection() {
    if (!isAuthenticated) {
      setSubmitState("error");
      setSubmitMessage("Bitte zuerst einloggen.");
      return;
    }
    if (selectedProducts.length === 0) {
      setSubmitState("error");
      setSubmitMessage("Bitte mindestens ein Produkt auswählen.");
      return;
    }
    const selected = products
      .filter((product) => selectedProducts.includes(product.slug))
      .map((product) => ({ slug: product.slug, name: product.name, quantity: 1, category: product.category }));
    const existing = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dud_cart") || "[]") as Array<{ slug: string; name: string; quantity: number; category: string }> : [];
    const merged = [...existing];
    for (const item of selected) {
      const found = merged.find((entry) => entry.slug === item.slug);
      if (found) {
        found.quantity += 1;
      } else {
        merged.push(item);
      }
    }
    localStorage.setItem("dud_cart", JSON.stringify(merged));
    setSubmitState("ok");
    setSubmitMessage("Produkte wurden in den Warenkorb gelegt.");
    setSelectedProducts([]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-lg border bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2 font-black"><SlidersHorizontal className="h-5 w-5" /> Filter</div>
        <div className="mt-5 grid gap-2">
          <button onClick={() => setCategory("alle")} className={category === "alle" ? "rounded-md bg-slate-950 px-3 py-2 text-left text-sm font-bold text-white" : "rounded-md px-3 py-2 text-left text-sm font-bold hover:bg-muted"}>Alle Produkte</button>
          {categories.map((item) => (
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
            <input suppressHydrationWarning value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 flex-1 text-sm outline-none" placeholder="Produkt, Material oder Anwendung suchen" />
          </div>
          <select suppressHydrationWarning value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-md border bg-white px-3 text-sm">
            <option value="beliebt">Beliebtheit</option>
          </select>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              isSelected={selectedProducts.includes(product.slug)}
              onToggleSelect={isAuthenticated ? toggleSelected : undefined}
            />
          ))}
        </div>
        <div className="mt-8 rounded-lg border bg-white p-4 shadow-soft">
          <p className="text-sm font-bold">Produkte auswählen</p>
          <p className="mt-1 text-xs text-muted-foreground">{selectedProducts.length} Produkt(e) ausgewählt</p>
          {isAuthenticated ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={submitSelection}>
                In den Warenkorb
              </Button>
              <Button asChild variant="outline">
                <Link href="/warenkorb">Zum Warenkorb</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Einloggen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/registrierung">Registrieren</Link>
              </Button>
            </div>
          )}
          {submitMessage ? (
            <p className={submitState === "error" ? "mt-2 text-xs text-red-600" : "mt-2 text-xs text-emerald-700"}>{submitMessage}</p>
          ) : null}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((page) => <button className={page === 1 ? "h-10 w-10 rounded-md bg-slate-950 text-white" : "h-10 w-10 rounded-md border"} key={page}>{page}</button>)}
        </div>
      </div>
    </div>
  );
}
