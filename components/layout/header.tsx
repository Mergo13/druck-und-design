"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, User, ShoppingCart, X, ArrowRight, Store, Newspaper, MessageCircle, Palette, PanelsTopLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { createElement, type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEuro } from "@/lib/utils";
import { navigationItems } from "@/data/navigation";
import type { ProductCatalogItem } from "@/types/print-platform";

const navIconByHref: Record<string, ComponentType<{ className?: string }>> = {
  "/leistungen": Store,
  "/werbeagentur": Palette,
  "/werbetechnik": PanelsTopLeft,
  "/news": Newspaper,
  "/kontakt": MessageCircle
};

export function Header({ logoSrc = "/brand/logo-dud.png" }: { logoSrc?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [flyItems, setFlyItems] = useState<Array<{ id: string; x: number; y: number; tx: number; ty: number }>>([]);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((item) => [item.name, item.short, item.seo, item.category].join(" ").toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, searchText]);

  useEffect(() => {
    const syncCartCount = () => {
      const raw = localStorage.getItem("dud_cart");
      if (!raw) {
        setCartCount(0);
        return;
      }
      const entries = JSON.parse(raw) as Array<{ quantity: number }>;
      setCartCount(entries.reduce((sum, item) => sum + (item.quantity || 0), 0));
    };

    fetch("/api/catalog/products").then((res) => res.json()).then((data: ProductCatalogItem[]) => setProducts(data)).catch(() => setProducts([]));
    fetch("/api/auth/session").then((res) => res.json()).then((data: { authenticated: boolean }) => setAuthenticated(Boolean(data.authenticated))).catch(() => setAuthenticated(false));
    syncCartCount();

    window.addEventListener("storage", syncCartCount);
    window.addEventListener("dud-cart-updated", syncCartCount as EventListener);
    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener("dud-cart-updated", syncCartCount as EventListener);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(event.target as Node)) setSearchOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("dud_recent_searches");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 6));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onFlyToCart = (event: Event) => {
      const custom = event as CustomEvent<{ x?: number; y?: number }>;
      const cartTarget = document.getElementById("global-cart-button");
      if (!cartTarget) return;
      const x = custom.detail?.x ?? window.innerWidth * 0.5;
      const y = custom.detail?.y ?? window.innerHeight * 0.5;
      const rect = cartTarget.getBoundingClientRect();
      const tx = rect.left + rect.width / 2;
      const ty = rect.top + rect.height / 2;
      const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setFlyItems((prev) => [...prev, { id, x, y, tx, ty }]);
      setCartPulse(true);
      window.setTimeout(() => setCartPulse(false), 450);
      window.setTimeout(() => {
        setFlyItems((prev) => prev.filter((item) => item.id !== id));
      }, 750);
    };
    window.addEventListener("dud-fly-to-cart", onFlyToCart as EventListener);
    return () => window.removeEventListener("dud-fly-to-cart", onFlyToCart as EventListener);
  }, []);

  const saveRecentSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    const next = [normalized, ...recentSearches.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    localStorage.setItem("dud_recent_searches", JSON.stringify(next));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/88 text-brand-ink shadow-[0_10px_35px_rgba(17,34,68,0.08)] backdrop-blur-2xl">
      <div className="container-page">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src={logoSrc} alt="druck&design" width={320} height={65} className="h-9 w-auto md:h-10" priority />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {isAdmin ? (
              <Link href="/admin" className="rounded-lg px-4 py-2 text-sm font-bold text-brand-blue">
                Admin Dashboard
              </Link>
            ) : navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={isActive ? "group relative rounded-md bg-brand-mist px-4 py-2 text-sm font-bold text-brand-blue" : "group relative rounded-md px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-mist hover:text-brand-blue"}
                >
                  <span className="inline-flex items-center gap-2">
                    {navIconByHref[item.href] ? createElement(navIconByHref[item.href], { className: "h-4 w-4" }) : null}
                    {item.label}
                  </span>
                  <span className={isActive ? "absolute bottom-0 left-4 right-4 h-0.5 rounded bg-brand-coral" : "absolute bottom-0 left-4 right-4 h-0.5 origin-left scale-x-0 rounded bg-brand-coral transition-transform duration-300 group-hover:scale-x-100"} />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <div ref={searchBoxRef} className="relative hidden lg:block">
              <form
                action="/suche"
                className="h-11 w-44 items-center gap-2 rounded-full border border-slate-200 bg-white shadow-[0_4px_14px_rgba(17,34,68,.06)] transition focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/10 lg:flex xl:w-56"
                onSubmit={() => saveRecentSearch(searchText)}
              >
                <div className="flex h-full w-full items-center gap-2 rounded-full bg-white px-3">
                <Search className="h-4 w-4 text-brand-blue" />
                <input
                  ref={searchInputRef}
                  suppressHydrationWarning
                  name="q"
                  value={searchText}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => {
                    setSearchText(event.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                    if (event.key === "Enter") saveRecentSearch(searchText);
                  }}
                  className="h-full flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-slate-400"
                  placeholder="Suche"
                />
                <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">⌘K</span>
                </div>
              </form>
              {searchOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-xl border border-white/70 bg-white/92 shadow-premium backdrop-blur-xl"
                >
                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {searchText.trim() && suggestions.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">Keine Treffer zu Ihrer Suche.</p>
                    ) : null}
                    {searchText.trim() ? suggestions.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/produkt/${item.slug}`}
                        onClick={() => {
                          saveRecentSearch(item.name);
                          setSearchOpen(false);
                        }}
                        className="block rounded-md p-3 transition hover:bg-brand-mist"
                      >
                        <p className="text-sm font-bold text-brand-ink">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.short}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.category}</span>
                          <span className="font-semibold text-brand-blue">{authenticated ? `ab ${formatEuro(item.basePrice)}` : "Preis nach Anmeldung"}</span>
                        </div>
                      </Link>
                    )) : null}
                    {!searchText.trim() ? (
                      <div className="p-2">
                        <div className="mb-2 flex items-center justify-between px-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent search</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRecentSearches([]);
                              localStorage.removeItem("dud_recent_searches");
                            }}
                            className="text-xs font-semibold text-brand-blue"
                          >
                            Clear all
                          </button>
                        </div>
                        {recentSearches.length === 0 ? (
                          <p className="rounded-md p-2 text-sm text-muted-foreground">Keine letzten Suchen.</p>
                        ) : recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchText(term);
                              setSearchOpen(true);
                              searchInputRef.current?.focus();
                            }}
                            className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm transition hover:bg-brand-mist"
                          >
                            <span>{term}</span>
                            <Search className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {searchText.trim() ? (
                    <div className="border-t p-2">
                      <Link href={`/suche?q=${encodeURIComponent(searchText)}`} onClick={() => {
                        saveRecentSearch(searchText);
                        setSearchOpen(false);
                      }} className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold text-brand-blue hover:bg-brand-mist">
                        Alle Ergebnisse anzeigen
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </div>
            {!isAdmin && (
              <>
                <Link href="/konto" className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-brand-blue/30 hover:bg-brand-mist hover:text-brand-blue sm:flex"><User className="h-4.5 w-4.5" /></Link>
                <Link href="/warenkorb" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-brand-blue/30 hover:bg-brand-mist hover:text-brand-blue">
                  <motion.span
                    id="global-cart-button"
                    animate={cartPulse ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <ShoppingCart className="h-4.5 w-4.5" />
                  </motion.span>
                  {cartCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">{cartCount}</span> : null}
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" aria-expanded={mobileOpen} aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"} className="text-brand-ink hover:bg-brand-mist hover:text-brand-blue md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="border-t border-white/70 bg-white/90 shadow-premium backdrop-blur-xl md:hidden"
        >
          <div className="container-page grid gap-5 py-5">
            <Input placeholder="Produkte, Vorlagen oder Druckideen suchen" />
            <nav className="grid gap-2">
              {!isAdmin && navigationItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                    ? "flex items-center justify-between rounded-lg border border-brand-blue/25 bg-brand-mist px-4 py-3 text-sm font-semibold text-brand-blue shadow-sm"
                    : "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist"}
                >
                  <span className="inline-flex items-center gap-2">
                    {navIconByHref[item.href] ? createElement(navIconByHref[item.href], { className: "h-4 w-4" }) : null}
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-brand-blue" />
                </Link>
              ))}
              {!isAdmin && (
                <>
                  <Link
                    href="/warenkorb"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist"
                  >
                    Warenkorb
                    <ShoppingCart className="h-4 w-4 text-brand-blue" />
                  </Link>
                  <Link
                    href="/konto"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist sm:hidden"
                  >
                    Mein Konto
                    <User className="h-4 w-4 text-brand-blue" />
                  </Link>
                </>
              )}
            </nav>
            <div>
              {!authenticated ? (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg bg-slate-900 p-4 text-sm font-bold text-white">
                  Einloggen
                </Link>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      <div className="pointer-events-none fixed inset-0 z-[70]">
        <AnimatePresence>
          {flyItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ x: item.x, y: item.y, opacity: 1, scale: 1 }}
              animate={{ x: item.tx, y: item.ty, opacity: 0.2, scale: 0.28 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
            >
              <div className="h-3.5 w-3.5 rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0f766e)] shadow-[0_8px_18px_rgba(29,78,216,.35)]" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </header>
  );
}
