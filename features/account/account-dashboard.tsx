"use client";

import { FileText, Heart, MapPin, Package, RotateCcw, Settings, Upload, Wand2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const items: Array<[LucideIcon, string, string]> = [
  [Package, "Bestellungen", "Status, Tracking und Nachbestellung"],
  [FileText, "Rechnungen", "Belege und Zahlungsstatus"],
  [Upload, "Uploads", "Druckdaten und Preflight-Protokolle"],
  [Wand2, "Gespeicherte Designs", "Vorlagen, Entwürfe und Mockups"],
  [MapPin, "Adressen", "Liefer- und Rechnungsadressen"],
  [Heart, "Wunschliste", "Gemerkte Produkte"],
  [Settings, "Kontoeinstellungen", "Team, Sicherheit und Benachrichtigungen"]
];

export function AccountDashboard() {
  const orders = useCartStore((state) => state.orders);
  const reorder = useCartStore((state) => state.reorder);

  return (
    <section className="container-page py-10">
      <p className="font-bold text-primary">Kundenkonto</p>
      <h1 className="mt-2 text-4xl font-black">Dashboard</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(([Icon, title, text]) => (
          <div className="rounded-lg border p-6 shadow-soft" key={title}>
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-5 text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-black">Nachbestellung mit einem Klick</h2>
        <div className="mt-4 grid gap-3">
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Bestellungen vorhanden.</p> : null}
          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-bold">{order.id}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString("de-DE")} · {order.items.length} Positionen</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{formatEuro(order.total)}</span>
                <Button size="sm" onClick={() => reorder(order.id)}><RotateCcw className="h-4 w-4" /> Nachbestellen</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
