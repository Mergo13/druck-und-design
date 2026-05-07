"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CartView() {
  const { items, removeItem, total } = useCartStore();
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Warenkorb</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {items.length === 0 && <div className="rounded-lg border p-8 text-muted-foreground">Ihr Warenkorb ist aktuell leer.</div>}
          {items.map((item) => (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-5 shadow-soft" key={item.id}>
              <div>
                <h2 className="font-black">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{Object.entries(item.config).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>
                <p className={item.preflightPassed ? "mt-1 text-xs font-bold text-emerald-700" : "mt-1 text-xs font-bold text-amber-700"}>
                  {item.preflightPassed ? "Preflight: bestanden" : "Preflight: ausstehend"}
                </p>
              </div>
              {item.mockupUrl ? <img src={item.mockupUrl} alt="Mockup" className="h-16 w-16 rounded-md border object-cover" /> : null}
              <div className="text-right"><p className="font-black">{formatEuro(item.price)}</p><button onClick={() => removeItem(item.id)} className="mt-2 text-sm text-red-600"><Trash2 className="inline h-4 w-4" /> Entfernen</button></div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-lg border p-6 shadow-premium">
          <h2 className="text-xl font-black">Bestellübersicht</h2>
          <div className="mt-5 flex justify-between font-bold"><span>Zwischensumme</span><span>{formatEuro(total())}</span></div>
          <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Versand</span><span>wird im Checkout berechnet</span></div>
          <Button asChild className="mt-6 w-full" size="lg"><Link href="/checkout">Zum Checkout</Link></Button>
        </aside>
      </div>
    </section>
  );
}
