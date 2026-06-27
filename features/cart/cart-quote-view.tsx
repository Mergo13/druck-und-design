"use client";

import {
  ChevronRight,
  Truck,
  MapPin,
  CheckCircle2,
  ShoppingCart,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/utils";
import type { Order } from "@/types";

type CartEntry = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice?: number;
  printCheckRequested?: boolean;
  printCheckFee?: number;
  printCheckFileName?: string;
  printCheckFileUrl?: string;
  printCheckStatus?: "ok" | "error" | "idle";
};

const PRINT_CHECK_FEE = Number(process.env.NEXT_PUBLIC_PRINT_CHECK_FEE_EUR ?? "9.99");
const PROCESSING_FEE = 3.90;

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function CartQuoteView() {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [useSeparateShipping, setUseSeparateShipping] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"abholung" | "versand">("versand");
  const [postcode, setPostcode] = useState("");
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("dud_cart");
    setCart(raw ? JSON.parse(raw) as CartEntry[] : []);
    void (async () => {
      const profRes = await fetch("/api/user/profile");
      if (profRes.ok) {
        const prof = await profRes.json();
        setProfile(prof);
        if (prof.email) setCustomerEmail(prof.email);
        if (prof.fullName) setCustomerName(prof.fullName);
        else if (prof.company) setCustomerName(prof.company);
        if (prof.shippingAddress && prof.shippingAddress !== prof.billingAddress) {
          setUseSeparateShipping(true);
        }
        return;
      }

      const res = await fetch("/api/auth/session");
      if (!res.ok) return;
      const payload = await res.json() as { authenticated?: boolean; user?: { email?: string; fullName?: string; company?: string } };
      if (payload.user?.email) setCustomerEmail(payload.user.email);
      if (payload.user?.fullName) setCustomerName(payload.user.fullName);
      else if (payload.user?.company) setCustomerName(payload.user.company);
    })();
  }, []);

  const hasItems = useMemo(() => cart.length > 0, [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0), [cart]);
  const printCheckTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.printCheckRequested ? (item.printCheckFee ?? PRINT_CHECK_FEE) : 0), 0),
    [cart]
  );
  const shippingCost = useMemo(() => (deliveryMethod === "versand" && selectedRate ? selectedRate.price : 0), [deliveryMethod, selectedRate]);
  const grandTotal = subtotal + printCheckTotal + shippingCost + PROCESSING_FEE;

  function updateQuantity(slug: string, nextQuantity: number) {
    const next = cart.map((item) => item.slug === slug ? { ...item, quantity: Math.max(1, nextQuantity) } : item);
    setCart(next);
    localStorage.setItem("dud_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("dud-cart-updated"));
  }

  function removeItem(slug: string) {
    const next = cart.filter((item) => item.slug !== slug);
    setCart(next);
    localStorage.setItem("dud_cart", JSON.stringify(next));
    window.dispatchEvent(new Event("dud-cart-updated"));
  }

  useEffect(() => {
    if (deliveryMethod === "versand" && hasItems) {
      void (async () => {
        setLoadingRates(true);
        try {
          let toCountry = "AT";
          let currentPostcode = postcode;
          const addr = useSeparateShipping ? profile?.shippingAddress : profile?.billingAddress;

          if (addr) {
            if (addr.toLowerCase().includes("deutschland")) toCountry = "DE";
            if (!currentPostcode) {
              const pcMatch = addr.match(/\b\d{4,5}\b/);
              if (pcMatch) currentPostcode = pcMatch[0];
            }
          }

          const res = await fetch("/api/shipping/rates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart,
              toCountry,
              toPostcode: currentPostcode
            })
          });
          if (res.ok) {
            const data = await res.json();
            setShippingRates(data.rates || []);
            if (data.rates?.length > 0) {
              setSelectedRate(data.rates[0]);
            }
          }
        } catch (e) {
          console.error("Failed to fetch shipping rates", e);
        } finally {
          setLoadingRates(false);
        }
      })();
    } else {
      setShippingRates([]);
      setSelectedRate(null);
    }
  }, [deliveryMethod, cart, profile, useSeparateShipping, hasItems, postcode]);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [cartDrawerOpen]);

  async function startStripeCheckout() {
    if (!hasItems) {
      setState("error");
      setMessage("Der Warenkorb ist leer.");
      return;
    }
    setState("sending");
    setMessage("Weiterleitung zu Stripe...");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        notes,
        deliveryMethod,
        customerName,
        customerEmail,
        company: profile?.company,
        billingAddress: profile?.billingAddress,
        shippingAddress: useSeparateShipping ? profile?.shippingAddress : profile?.billingAddress,
        shippingCost,
        shippingName: selectedRate?.name,
        processingFee: PROCESSING_FEE
      })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: "Stripe-Checkout fehlgeschlagen." }));
      setState("error");
      setMessage(payload.message ?? "Stripe-Checkout fehlgeschlagen.");
      return;
    }
    const payload = await response.json() as { url?: string };
    if (!payload.url) {
      setState("error");
      setMessage("Stripe-Checkout URL fehlt.");
      return;
    }
    window.location.href = payload.url;
  }

  async function placeOrderWithoutPayment() {
    if (!hasItems) {
      setState("error");
      setMessage("Der Warenkorb ist leer.");
      return;
    }
    setState("sending");
    setMessage("Bestellung wird gespeichert...");

    const orderPayload: Order = {
      id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        id: createItemId(),
        productSlug: item.slug,
        name: item.name,
        quantity: item.quantity,
        price: (item.unitPrice ?? 0) * item.quantity + (item.printCheckRequested ? (item.printCheckFee ?? PRINT_CHECK_FEE) : 0),
        config: {
          Kategorie: item.category,
          Lieferung: deliveryMethod === "abholung" ? "Abholung" : "Versand",
          PrintCheck: item.printCheckRequested ? `Ja (+${formatEuro(item.printCheckFee ?? PRINT_CHECK_FEE)})` : "Nein",
          PrintDatei: item.printCheckFileUrl ?? "-",
          Hinweis: notes.trim() || "-"
        }
      })),
      total: grandTotal
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderPayload,
        customerEmail,
        customerName,
        billingAddress: profile?.billingAddress,
        shippingAddress: useSeparateShipping ? profile?.shippingAddress : profile?.billingAddress,
        shippingCost,
        shippingName: selectedRate?.name,
        processingFee: PROCESSING_FEE
      })
    });
    if (!response.ok) {
      setState("error");
      setMessage("Bestellung fehlgeschlagen.");
      return;
    }
    setState("ok");
    setMessage(`Bestellung gespeichert: ${orderPayload.id}`);
  }

  return (
    <section className="container-page py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-black text-gradient">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schneller Abschluss mit klarer Bestellübersicht.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setCartDrawerOpen(true)}>
          <ShoppingCart className="h-4 w-4" />
          Warenkorb ({cart.length})
        </Button>
      </div>

      {!hasItems ? <p className="mt-5 text-muted-foreground">Keine Produkte im Warenkorb.</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Versand & Rechnung</p>
                <p className="text-sm font-semibold text-slate-700">Bitte prüfen Sie Ihre Checkout-Daten.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="grid gap-2 text-sm font-black uppercase tracking-wider text-primary">
                  Liefermethode
                  <select
                    suppressHydrationWarning
                    value={deliveryMethod}
                    onChange={(event) => setDeliveryMethod(event.target.value as "abholung" | "versand")}
                    className="h-11 rounded-md border bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                  >
                    <option value="versand">🚚 Paketversand (Post AT, DPD, GLS)</option>
                    <option value="abholung">🏪 Selbstabholung (Druck & Design Studio)</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black uppercase tracking-wider text-primary">
                  Name / Firma für Rechnung
                  <input
                    suppressHydrationWarning
                    className="h-11 rounded-md border bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                    placeholder="z.B. Muster GmbH"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider text-primary">
                  Anmerkungen zur Bestellung
                </label>
                <textarea
                  suppressHydrationWarning
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional: Hinweise zu Ihrer Bestellung, Farbwünsche oder spezielle Anforderungen..."
                  className="h-[126px] w-full rounded-md border bg-white p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          {profile && deliveryMethod === "versand" && (
            <div className="glass-panel rounded-xl p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Lieferadresse & Versandart</h3>
                    <p className="text-xs font-bold uppercase text-muted-foreground mt-1">Konfigurieren Sie Ihre Zustellung</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white border p-2 shadow-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">PLZ für Berechnung:</span>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="PLZ"
                    className="h-8 w-20 rounded border-none bg-muted/50 px-2 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className={`group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${!useSeparateShipping ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-white hover:border-primary/50"}`}>
                  <div className="flex h-5 items-center">
                    <input
                      suppressHydrationWarning
                      type="radio"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                      checked={!useSeparateShipping}
                      onChange={() => setUseSeparateShipping(false)}
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-black uppercase text-[11px] tracking-wider text-primary mb-1">Rechnungsadresse</p>
                    <p className="font-bold text-foreground">An Standardadresse liefern</p>
                    <div className="mt-2 rounded bg-muted/40 p-2 text-xs font-medium text-muted-foreground whitespace-pre-wrap leading-relaxed border border-dashed">
                      {profile.billingAddress || "Keine Rechnungsadresse hinterlegt."}
                    </div>
                  </div>
                  {!useSeparateShipping && <div className="absolute top-4 right-4 text-primary"><CheckCircle2 className="h-5 w-5" /></div>}
                </label>

                {profile.shippingAddress && profile.shippingAddress !== profile.billingAddress ? (
                  <label className={`group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${useSeparateShipping ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-white hover:border-primary/50"}`}>
                    <div className="flex h-5 items-center">
                      <input
                        suppressHydrationWarning
                        type="radio"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                        checked={useSeparateShipping}
                        onChange={() => setUseSeparateShipping(true)}
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-black uppercase text-[11px] tracking-wider text-primary mb-1">Separate Lieferadresse</p>
                      <p className="font-bold text-foreground">An abweichende Adresse liefern</p>
                      <div className="mt-2 rounded bg-muted/40 p-2 text-xs font-medium text-muted-foreground whitespace-pre-wrap leading-relaxed border border-dashed">
                        {profile.shippingAddress}
                      </div>
                    </div>
                    {useSeparateShipping && <div className="absolute top-4 right-4 text-primary"><CheckCircle2 className="h-5 w-5" /></div>}
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center bg-white/50">
                    <p className="text-xs font-bold text-muted-foreground">Keine alternative Lieferadresse im Profil gefunden.</p>
                    <Button variant="outline" size="sm" className="mt-2 text-[10px] uppercase font-black" asChild>
                      <Link href="/konto#settings">Profil bearbeiten</Link>
                    </Button>
                  </div>
                )}
              </div>

              {!profile.billingAddress && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  Bitte hinterlegen Sie eine Adresse in Ihrem Profil, um den Versand zu nutzen.
                </div>
              )}

              {shippingRates.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Verfügbare Versandpartner</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shippingRates.map((rate) => (
                      <label key={rate.id} className={`group flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${selectedRate?.id === rate.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "bg-white hover:border-primary/50"}`}>
                        <div className="flex h-5 items-center">
                          <input
                            suppressHydrationWarning
                            type="radio"
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            checked={selectedRate?.id === rate.id}
                            onChange={() => setSelectedRate(rate)}
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">{rate.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">{rate.carrier}</span>
                              <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">Express Abwicklung</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-primary">{formatEuro(rate.price)}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-panel rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Bestellübersicht</p>
            <h3 className="mt-1 text-lg font-black">Ihre Zusammenfassung</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zwischensumme</span>
                <span className="font-semibold">{formatEuro(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Print-Check</span>
                <span className="font-semibold">{formatEuro(printCheckTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bearbeitung</span>
                <span className="font-semibold">{formatEuro(PROCESSING_FEE)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versand</span>
                <span className="font-semibold">{loadingRates ? "Berechne..." : formatEuro(shippingCost)}</span>
              </div>
            </div>
            <div className="my-4 h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Gesamt</span>
              <span className="text-xl font-black text-gradient">{formatEuro(grandTotal)}</span>
            </div>

            <Button className="mt-5 w-full" onClick={() => void startStripeCheckout()} disabled={state === "sending"}>
              {state === "sending" ? "Bitte warten..." : "Zahlungspflichtig bestellen"}
            </Button>
            <Button className="mt-2 w-full" variant="outline" onClick={() => void placeOrderWithoutPayment()} disabled={state === "sending"}>
              Bestellung ohne Zahlung speichern
            </Button>
            {message ? <p className={state === "error" ? "mt-3 text-xs text-red-600" : "mt-3 text-xs text-fuchsia-700"}>{message}</p> : null}
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Mit Abschluss stimmen Sie unseren Bedingungen zu. Sie können Ihre Daten vor dem Bezahlen jederzeit ändern.
            </p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {cartDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartDrawerOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[60] h-screen w-full max-w-md border-l border-slate-200 bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Warenkorb</p>
                    <p className="text-sm font-semibold text-slate-700">{cart.length} Positionen</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setCartDrawerOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {cart.map((item) => (
                    <div key={item.slug} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.slug, item.quantity - 1)}>-</Button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => updateQuantity(item.slug, item.quantity + 1)}>+</Button>
                        </div>
                        <span className="text-sm font-bold">{formatEuro((item.unitPrice ?? 0) * item.quantity)}</span>
                      </div>
                      <button
                        type="button"
                        className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
                        onClick={() => removeItem(item.slug)}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                  {!cart.length ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Ihr Warenkorb ist aktuell leer.
                    </div>
                  ) : null}
                </div>

                <div className="border-t px-5 py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gesamt</span>
                    <span className="text-lg font-black">{formatEuro(grandTotal)}</span>
                  </div>
                  <Button className="w-full justify-between" onClick={() => setCartDrawerOpen(false)}>
                    Zur Kasse
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
