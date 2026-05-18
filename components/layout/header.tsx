"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, User, Heart, Sparkles, ChevronDown, PhoneCall, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigationItems } from "@/data/navigation";
import { useCartStore } from "@/store/cart-store";
import type { ProductCategory } from "@/types/print-platform";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const items = useCartStore((state) => state.items);
  const wishlist = useCartStore((state) => state.wishlist);

  useEffect(() => {
    fetch("/api/catalog/categories").then((res) => res.json()).then((data: ProductCategory[]) => setCategories(data)).catch(() => setCategories([]));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/78 text-brand-ink shadow-[0_16px_55px_rgba(15,23,42,.08)] backdrop-blur-2xl">
      <div className="hidden border-b border-slate-200/70 bg-white/55 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs font-medium tracking-[0.01em] text-slate-500">
          <div className="flex items-center gap-6">
            <span>Druck & Design Studio</span>
            <span>Same-Day Produktion für ausgewählte Produkte</span>
          </div>
          <Link href="/kontakt" className="inline-flex items-center gap-2 font-semibold tracking-[0.01em] hover:text-brand-blue"><PhoneCall className="h-3.5 w-3.5 text-brand-blue" /> Beratung: +49 30 120 88 44</Link>
        </div>
      </div>
      <div className="container-page flex min-h-[82px] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-text text-[1.03rem] font-extrabold uppercase leading-none tracking-[0.11em] text-brand-ink">
            druck<span className="text-brand-blue">&</span>design
            <span className="mt-1 block text-[0.66rem] font-semibold tracking-[0.34em] text-slate-500">studio</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-3 py-2 shadow-sm xl:flex">
          {navigationItems.map((item) => (
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
          <Link href="/wunschliste" className="relative hidden rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm transition hover:bg-brand-mist hover:text-brand-blue sm:block">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-cyan" />}
          </Link>
          <Link href="/konto" className="hidden rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm transition hover:bg-brand-mist hover:text-brand-blue sm:block"><User className="h-5 w-5" /></Link>
          <Link href="/warenkorb" className="relative rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-700 shadow-sm transition hover:bg-brand-mist hover:text-brand-blue">
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-blue px-1 text-xs text-white">{items.length}</span>}
          </Link>
          <Button asChild className="hidden bg-brand-blue shadow-[0_14px_34px_rgba(35,92,153,.38)] hover:bg-[#2c70b8] sm:inline-flex lg:hidden xl:inline-flex"><Link href="/shop"><Sparkles className="h-4 w-4" /> Projekt starten</Link></Button>
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
              {navigationItems.map((item) => (
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
              <Link
                href="/konto"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist sm:hidden"
              >
                Mein Konto
                <User className="h-4 w-4 text-brand-blue" />
              </Link>
              <Link
                href="/wunschliste"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.01em] text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist sm:hidden"
              >
                Wunschliste
                <Heart className="h-4 w-4 text-brand-blue" />
              </Link>
            </nav>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <Button asChild className="bg-brand-blue hover:bg-[#2c70b8]"><Link href="/shop" onClick={() => setMobileOpen(false)}><Sparkles className="h-4 w-4" /> Projekt starten</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}
