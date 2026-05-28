"use client";

import Link from "next/link";
import { Menu, Search, User, ShoppingCart, ChevronDown, PhoneCall, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigationItems } from "@/data/navigation";
import type { ProductCategory } from "@/types/print-platform";

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch("/api/catalog/categories").then((res) => res.json()).then((data: ProductCategory[]) => setCategories(data)).catch(() => setCategories([]));
    fetch("/api/auth/session").then((res) => res.json()).then((data: { authenticated: boolean }) => setAuthenticated(Boolean(data.authenticated))).catch(() => setAuthenticated(false));
    const raw = localStorage.getItem("dud_cart");
    if (raw) {
      const entries = JSON.parse(raw) as Array<{ quantity: number }>;
      setCartCount(entries.reduce((sum, item) => sum + (item.quantity || 0), 0));
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/78 text-brand-ink shadow-[0_16px_55px_rgba(15,23,42,.08)] backdrop-blur-2xl">
      <div className="hidden border-b border-slate-200/70 bg-white/55 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs font-medium tracking-[0.01em] text-slate-500">
          <div className="flex items-center gap-6">
            <span>Vision L&T e.U. – Ihr Partner für Print & Werbeagentur</span>
            <span>Fachberatung in Wels</span>
          </div>
          <Link href="/kontakt" className="inline-flex items-center gap-2 font-semibold tracking-[0.01em] hover:text-brand-blue"><PhoneCall className="h-3.5 w-3.5 text-brand-blue" /> Beratung: +43 (0) 7242 63 2 39</Link>
        </div>
      </div>
      <div className="container-page flex min-h-[82px] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-text text-[1.25rem] font-black uppercase leading-none tracking-[0.05em] text-brand-ink">
            Vision<span className="text-brand-blue">L&T</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-3 py-2 shadow-sm xl:flex">
          {isAdmin ? (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-[0.92rem] font-bold tracking-[0.01em] text-brand-blue">
              Admin Dashboard
            </Link>
          ) : navigationItems.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="rounded-lg px-3 py-2 text-[0.92rem] font-medium tracking-[0.01em] text-slate-700 transition hover:bg-brand-mist hover:text-brand-blue">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden w-40 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 shadow-sm lg:flex xl:w-64">
            <Search className="h-4 w-4 text-brand-blue" />
            <input suppressHydrationWarning className="h-11 flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-slate-400" placeholder="Suche" />
          </div>
          {!isAdmin && (
            <>
              <Link href="/konto" className="hidden rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm transition hover:bg-brand-mist hover:text-brand-blue sm:block"><User className="h-5 w-5" /></Link>
              <Link href="/warenkorb" className="hidden rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm transition hover:bg-brand-mist hover:text-brand-blue sm:block relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">{cartCount}</span> : null}
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" aria-expanded={mobileOpen} aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"} className="text-brand-ink hover:bg-brand-mist hover:text-brand-blue xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white/98 shadow-premium backdrop-blur-xl xl:hidden">
          <div className="container-page grid gap-5 py-5">
            <Input placeholder="Produkte, Vorlagen oder Druckideen suchen" />
            <nav className="grid gap-2">
              {!isAdmin && navigationItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist"
                >
                  {item.label}
                  <ChevronDown className="-rotate-90 h-4 w-4 text-brand-blue" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              {!authenticated ? (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-lg bg-slate-900 p-4 text-sm font-bold text-white">
                  Einloggen
                </Link>
              ) : null}
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.slug}
                  href={`/${category.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-brand-mist p-4 text-sm"
                >
                  <strong>{category.name}</strong>
                  <p className="mt-1 leading-5 text-muted-foreground">{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
