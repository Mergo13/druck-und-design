"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, User, Heart, Sparkles, ChevronDown, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigationItems } from "@/data/navigation";
import { useCartStore } from "@/store/cart-store";
import type { ProductCategory } from "@/types/print-platform";

export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const items = useCartStore((state) => state.items);
  const wishlist = useCartStore((state) => state.wishlist);
  const primaryItem = navigationItems.find((item) => item.featured);
  const secondaryItems = navigationItems.filter((item) => !item.featured);

  useEffect(() => {
    fetch("/api/catalog/categories").then((res) => res.json()).then((data: ProductCategory[]) => setCategories(data)).catch(() => setCategories([]));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/78 text-brand-ink shadow-[0_16px_55px_rgba(15,23,42,.08)] backdrop-blur-2xl">
      <div className="hidden border-b border-slate-200/70 bg-white/55 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-6">
            <span>Premium Druck & Design Studio</span>
            <span>Same-Day Produktion für ausgewählte Produkte</span>
          </div>
          <Link href="/kontakt" className="inline-flex items-center gap-2 hover:text-brand-blue"><PhoneCall className="h-3.5 w-3.5 text-brand-blue" /> Beratung: +49 30 120 88 44</Link>
        </div>
      </div>
      <div className="container-page flex min-h-[82px] items-center gap-5 py-3">
        <Link href="/" className="flex min-w-[210px] items-center gap-3">
          <span className="brand-text text-[1.05rem] font-black uppercase leading-none tracking-[0.18em] text-brand-ink">
            druck<span className="text-brand-blue">&</span>design
            <span className="mt-1 block text-[0.68rem] font-semibold tracking-[0.52em] text-slate-500">studio</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white/70 px-2 py-2 shadow-sm xl:flex">
          {primaryItem && (
            <button onMouseEnter={() => setOpen(true)} className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist hover:text-brand-blue">
              {primaryItem.label} <ChevronDown className="h-4 w-4" />
            </button>
          )}
          {secondaryItems.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-mist hover:text-brand-blue">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden w-64 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 shadow-sm lg:flex">
          <Search className="h-4 w-4 text-brand-blue" />
          <input className="h-11 flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-slate-400" placeholder="Suche" />
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
        <Button asChild className="hidden bg-brand-blue shadow-[0_14px_34px_rgba(35,92,153,.38)] hover:bg-[#2c70b8] xl:inline-flex"><Link href="/shop"><Sparkles className="h-4 w-4" /> Projekt starten</Link></Button>
        <Button variant="ghost" size="icon" aria-expanded={mobileOpen} aria-label="Menü öffnen" className="text-brand-ink hover:bg-brand-mist hover:text-brand-blue xl:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu className="h-5 w-5" /></Button>
      </div>
      {open && (
        <div onMouseLeave={() => setOpen(false)} className="border-t border-slate-200 bg-white/96 shadow-premium backdrop-blur-xl">
          <div className="container-page grid gap-7 py-7 lg:grid-cols-[1.05fr_2fr]">
            <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#eef4f8,#ffffff)] p-7 text-brand-ink">
              <p className="text-sm font-semibold text-brand-cyan">Web-to-Print Suite</p>
              <h3 className="mt-2 text-3xl font-black leading-tight">Druckprodukte schneller konfigurieren, prüfen und nachbestellen.</h3>
              <Button asChild className="mt-6 bg-brand-blue text-white hover:bg-[#2c70b8]"><Link href="/ki-design-assistent">AI Design Assistant</Link></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link key={category.slug} href={`/${category.slug}`} className="rounded-xl border border-slate-200 bg-white p-5 text-brand-ink transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-soft">
                  <strong>{category.name}</strong>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="container-page pb-5 xl:hidden"><Input placeholder="Produkte, Vorlagen oder Druckideen suchen" /></div>
        </div>
      )}
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
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-brand-ink shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-mist"
                >
                  {item.label}
                  <ChevronDown className="-rotate-90 h-4 w-4 text-brand-blue" />
                </Link>
              ))}
            </nav>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
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
