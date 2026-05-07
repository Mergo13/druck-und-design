"use client";

import { CreditCard, FileCheck, Package, Truck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { formatEuro } from "@/lib/utils";

export function CheckoutFlow() {
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const placeOrder = useCartStore((state) => state.placeOrder);
  const [orderResult, setOrderResult] = useState<string>("");
  const steps: Array<[LucideIcon, string]> = [[Package, "Warenkorb"], [Truck, "Versand"], [CreditCard, "Zahlung"], [FileCheck, "Prüfung"]];

  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Checkout</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {steps.map(([Icon, label]) => (
          <div className="rounded-lg border p-4 text-sm font-bold" key={label}><Icon className="mb-2 h-5 w-5 text-primary" />{label}</div>
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <section className="rounded-lg border p-6 shadow-soft"><h2 className="text-xl font-black">Lieferadresse</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="h-11 rounded-md border px-3" placeholder="Firma" /><input className="h-11 rounded-md border px-3" placeholder="Ansprechpartner" /><input className="h-11 rounded-md border px-3" placeholder="Straße und Hausnummer" /><input className="h-11 rounded-md border px-3" placeholder="PLZ und Ort" /></div></section>
          <section className="rounded-lg border p-6 shadow-soft"><h2 className="text-xl font-black">Versandart</h2><div className="mt-4 grid gap-3"><label className="rounded-md border p-4 font-bold"><input name="shipping" type="radio" defaultChecked /> Standardversand</label><label className="rounded-md border p-4 font-bold"><input name="shipping" type="radio" /> Express Kurier</label></div></section>
          <section className="rounded-lg border p-6 shadow-soft"><h2 className="text-xl font-black">Zahlung</h2><div className="mt-4 grid gap-3"><label className="rounded-md border p-4 font-bold"><input name="payment" type="radio" defaultChecked /> Rechnung</label><label className="rounded-md border p-4 font-bold"><input name="payment" type="radio" /> Kreditkarte</label></div></section>
        </div>
        <aside className="h-fit rounded-lg border p-6 shadow-premium">
          <h2 className="text-xl font-black">Zusammenfassung</h2>
          <div className="mt-5 flex justify-between font-bold"><span>Produkte</span><span>{formatEuro(total())}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>Preflight bestanden</span><span>{items.filter((item) => item.preflightPassed).length}/{items.length}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>Datencheck</span><span>inklusive</span></div>
          <Button className="mt-6 w-full" size="lg" onClick={() => {
            const orderId = placeOrder();
            if (orderId) setOrderResult(`Bestellung erfolgreich: ${orderId}`);
          }}>Zahlungspflichtig bestellen</Button>
          {orderResult ? <p className="mt-3 text-sm font-bold text-emerald-700">{orderResult}</p> : null}
        </aside>
      </div>
    </section>
  );
}
