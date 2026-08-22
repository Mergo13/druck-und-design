"use client";

import {
  ChevronRight,
  Truck,
  MapPin,
  CheckCircle2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { applyStudentDiscount, canApplyCouponWithStudentDiscount, isVerifiedStudent } from "@/lib/student-discount";
import { formatEuro } from "@/lib/utils";
import type { Order } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CartEntry = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice?: number;
  normalUnitPrice?: number;
  pricingConfig?: Record<string, string>;
  studentDiscountEligible?: boolean;
  config?: Record<string, string>;
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
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [printApprovalAccepted, setPrintApprovalAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [studentDiscountPercent, setStudentDiscountPercent] = useState(20);

  useEffect(() => {
    const raw = localStorage.getItem("dud_cart");
    setCart(raw ? JSON.parse(raw) as CartEntry[] : []);
    void (async () => {
      const profRes = await fetch("/api/user/profile");
      const controlRes = await fetch("/api/storefront/control").catch(() => null);
      if (controlRes?.ok) {
        const control = await controlRes.json();
        setStudentDiscountPercent(Number(control.studentDiscountPercent ?? 20));
      }
      if (profRes.ok) {
        const prof = await profRes.json();
        setProfile(prof);
        if (prof.email) setCustomerEmail(prof.email);
        if (prof.fullName) setCustomerName(prof.fullName);
        else if (prof.company) setCustomerName(prof.company);
        if (prof.shippingAddress && prof.shippingAddress !== prof.billingAddress) {
          setUseSeparateShipping(true);
        }
        setAuthenticated(true);
        setAuthChecked(true);
        return;
      }

      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setAuthChecked(true);
        return;
      }
      const payload = await res.json() as { authenticated?: boolean; user?: { email?: string; fullName?: string; company?: string } };
      setAuthenticated(Boolean(payload.authenticated));
      setAuthChecked(true);
      if (payload.user?.email) setCustomerEmail(payload.user.email);
      if (payload.user?.fullName) setCustomerName(payload.user.fullName);
      else if (payload.user?.company) setCustomerName(payload.user.company);
    })();
  }, []);

  useEffect(() => {
    const onToggleCartDrawer = () => setCartDrawerOpen((open) => !open);
    window.addEventListener("dud-toggle-cart-drawer", onToggleCartDrawer);
    return () => window.removeEventListener("dud-toggle-cart-drawer", onToggleCartDrawer);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dud-cart-drawer-state", { detail: { open: cartDrawerOpen } }));
  }, [cartDrawerOpen]);

  const hasItems = useMemo(() => cart.length > 0, [cart]);
  const studentVerified = isVerifiedStudent(profile);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.normalUnitPrice ?? item.unitPrice ?? 0) * item.quantity, 0), [cart]);
  const studentDiscountTotal = useMemo(() => cart.reduce((sum, item) => {
    const normalLineTotal = (item.normalUnitPrice ?? item.unitPrice ?? 0) * item.quantity;
    const result = applyStudentDiscount({
      subtotal: normalLineTotal,
      product: { studentDiscountEligible: item.studentDiscountEligible !== false } as ProductCatalogItem,
      user: studentVerified ? { studentVerification: { status: "approved" } } : null,
      percent: studentDiscountPercent
    });
    return sum + (result.discounts[0]?.amount ?? 0);
  }, 0), [cart, studentDiscountPercent, studentVerified]);
  const subtotalAfterStudentDiscount = Math.max(0, subtotal - studentDiscountTotal);
  const printCheckTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.printCheckRequested ? (item.printCheckFee ?? PRINT_CHECK_FEE) : 0), 0),
    [cart]
  );
  const shippingCost = useMemo(() => (deliveryMethod === "versand" && selectedRate ? selectedRate.price : 0), [deliveryMethod, selectedRate]);
  const couponDiscount = useMemo(() => Math.min(subtotalAfterStudentDiscount, appliedCoupon?.discountAmount ?? 0), [appliedCoupon, subtotalAfterStudentDiscount]);
  const grandTotal = Math.max(0, subtotalAfterStudentDiscount + printCheckTotal - couponDiscount + shippingCost + PROCESSING_FEE);

  useEffect(() => {
    if (!canApplyCouponWithStudentDiscount(studentDiscountTotal) && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponMessage("Studentenrabatt und Gutscheincode sind nicht kombinierbar.");
    }
  }, [appliedCoupon, studentDiscountTotal]);

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

  function updatePrintCheck(slug: string, checked: boolean) {
    const next = cart.map((item) => item.slug === slug ? {
      ...item,
      printCheckRequested: checked,
      printCheckFee: checked ? (item.printCheckFee || PRINT_CHECK_FEE) : 0,
      printCheckStatus: checked ? "idle" as const : undefined
    } : item);
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

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!canApplyCouponWithStudentDiscount(studentDiscountTotal)) {
      setAppliedCoupon(null);
      setCouponMessage("Studentenrabatt und Gutscheincode sind nicht kombinierbar.");
      return;
    }
    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("Bitte Gutscheincode eingeben.");
      return;
    }
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal })
      });
      const payload = await response.json().catch(() => ({ message: "Gutschein konnte nicht geprüft werden." }));
      if (!response.ok) {
        setAppliedCoupon(null);
        setCouponMessage(payload.message ?? "Gutschein ist nicht gültig.");
        return;
      }
      setAppliedCoupon({ code: payload.code, discountAmount: Number(payload.discountAmount || 0) });
      setCouponCode(payload.code);
      setCouponMessage(`Gutschein ${payload.code} angewendet.`);
    } finally {
      setCouponLoading(false);
    }
  }

  async function startStripeCheckout() {
    if (!hasItems) {
      setState("error");
      setMessage("Der Warenkorb ist leer.");
      return;
    }
    if (!legalAccepted || !printApprovalAccepted) {
      setState("error");
      setMessage("Bitte bestätigen Sie die Bedingungen und die Druckfreigabe.");
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
        processingFee: PROCESSING_FEE,
        couponCode: appliedCoupon?.code,
        legalAccepted,
        printApprovalAccepted
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
    if (!legalAccepted || !printApprovalAccepted) {
      setState("error");
      setMessage("Bitte bestätigen Sie die Bedingungen und die Druckfreigabe.");
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
          ...(item.config ?? {}),
          Kategorie: item.category,
          Lieferung: deliveryMethod === "abholung" ? "Abholung" : "Versand",
          PrintCheck: item.printCheckRequested ? `Ja (+${formatEuro(item.printCheckFee ?? PRINT_CHECK_FEE)})` : "Nein",
          PrintDatei: item.printCheckFileUrl ?? "-",
          Hinweis: notes.trim() || "-"
        }
      })),
      total: grandTotal,
      couponCode: appliedCoupon?.code,
      couponDiscount
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
        processingFee: PROCESSING_FEE,
        couponCode: appliedCoupon?.code,
        couponDiscount,
        legalAccepted,
        printApprovalAccepted
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

  if (!authChecked) {
    return <div className="container-page py-20 text-center text-sm font-semibold text-muted-foreground">Kundenkonto wird geprüft...</div>;
  }

  if (!authenticated) {
    return (
      <section className="container-page py-20 text-center">
        <h1 className="text-4xl font-black text-brand-ink">Bitte zuerst anmelden</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Preise, Warenkorb und Bestellung stehen registrierten Kunden nach der Anmeldung zur Verfügung.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild><Link href="/login?next=/warenkorb">Anmelden</Link></Button>
          <Button asChild variant="outline"><Link href="/registrierung">Konto erstellen</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50/70 py-8 md:py-10">
      <div className="container-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Warenkorb</p>
          <h1 className="mt-1 text-4xl font-black text-slate-950">Checkout</h1>
          <p className="mt-1 text-sm text-slate-500">Einfach prüfen, Lieferung wählen und Bestellung abschließen.</p>
        </div>
      </div>

      {!hasItems ? <p className="mt-5 text-muted-foreground">Keine Produkte im Warenkorb.</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Versand & Rechnung</p>
                <p className="text-sm font-semibold text-slate-700">Bitte prüfen Sie Ihre Checkout-Daten.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="grid gap-2 text-sm font-black uppercase tracking-wider text-slate-700">
                  Liefermethode
                  <select
                    suppressHydrationWarning
                    value={deliveryMethod}
                    onChange={(event) => setDeliveryMethod(event.target.value as "abholung" | "versand")}
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="versand">Paketversand (Post AT, DPD, GLS)</option>
                    <option value="abholung">Selbstabholung (Druck & Design Studio)</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-black uppercase tracking-wider text-slate-700">
                  Name / Firma für Rechnung
                  <input
                    suppressHydrationWarning
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="z.B. Muster GmbH"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Anmerkungen zur Bestellung
                </label>
                <textarea
                  suppressHydrationWarning
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional: Hinweise zu Ihrer Bestellung, Farbwünsche oder spezielle Anforderungen..."
                  className="h-[126px] w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          {profile && deliveryMethod === "versand" && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-sky-50 p-2 text-sky-700">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Lieferadresse & Versandart</h3>
                    <p className="text-xs font-bold uppercase text-muted-foreground mt-1">Konfigurieren Sie Ihre Zustellung</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <MapPin className="h-4 w-4 text-sky-700" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">PLZ für Berechnung:</span>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="PLZ"
                    className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-center text-sm font-bold outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className={`group relative flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition ${!useSeparateShipping ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100" : "bg-white hover:border-slate-300"}`}>
                  <div className="flex h-5 items-center">
                    <input
                      suppressHydrationWarning
                      type="radio"
                      className="h-4 w-4 border-slate-300 text-emerald-700 focus:ring-emerald-500"
                      checked={!useSeparateShipping}
                      onChange={() => setUseSeparateShipping(false)}
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-black uppercase text-[11px] tracking-wider text-emerald-700 mb-1">Rechnungsadresse</p>
                    <p className="font-bold text-foreground">An Standardadresse liefern</p>
                    <div className="mt-2 whitespace-pre-wrap rounded border border-dashed border-slate-200 bg-white/70 p-2 text-xs font-medium leading-relaxed text-slate-500">
                      {profile.billingAddress || "Keine Rechnungsadresse hinterlegt."}
                    </div>
                  </div>
                  {!useSeparateShipping && <div className="absolute top-4 right-4 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>}
                </label>

                {profile.shippingAddress && profile.shippingAddress !== profile.billingAddress ? (
                  <label className={`group relative flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition ${useSeparateShipping ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100" : "bg-white hover:border-slate-300"}`}>
                    <div className="flex h-5 items-center">
                      <input
                        suppressHydrationWarning
                        type="radio"
                        className="h-4 w-4 border-slate-300 text-emerald-700 focus:ring-emerald-500"
                        checked={useSeparateShipping}
                        onChange={() => setUseSeparateShipping(true)}
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-black uppercase text-[11px] tracking-wider text-emerald-700 mb-1">Separate Lieferadresse</p>
                      <p className="font-bold text-foreground">An abweichende Adresse liefern</p>
                      <div className="mt-2 whitespace-pre-wrap rounded border border-dashed border-slate-200 bg-white/70 p-2 text-xs font-medium leading-relaxed text-slate-500">
                        {profile.shippingAddress}
                      </div>
                    </div>
                    {useSeparateShipping && <div className="absolute top-4 right-4 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>}
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-xs font-bold text-slate-500">Keine alternative Lieferadresse im Profil gefunden.</p>
                    <Button variant="outline" size="sm" className="mt-2 border-slate-200 bg-white text-[10px] font-black uppercase hover:bg-slate-100" asChild>
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
                    <div className="h-1 w-8 rounded-full bg-sky-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-sky-700">Verfügbare Versandpartner</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shippingRates.map((rate) => (
                      <label key={rate.id} className={`group flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${selectedRate?.id === rate.id ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "bg-white hover:border-slate-300"}`}>
                        <div className="flex h-5 items-center">
                          <input
                            suppressHydrationWarning
                            type="radio"
                            className="h-4 w-4 border-slate-300 text-sky-700 focus:ring-sky-500"
                            checked={selectedRate?.id === rate.id}
                            onChange={() => setSelectedRate(rate)}
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">{rate.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-500">{rate.carrier}</span>
                              <span className="text-[10px] font-bold tracking-tight text-slate-400">Standard Abwicklung</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-sky-700">{formatEuro(rate.price)}</span>
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
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Bestellübersicht</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Ihre Zusammenfassung</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Zwischensumme</span>
                <span className="font-semibold">{formatEuro(subtotal)}</span>
              </div>
              {studentDiscountTotal > 0 ? (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>{studentDiscountPercent} % Studentenrabatt</span>
                  <span className="font-semibold">-{formatEuro(studentDiscountTotal)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Print-Check</span>
                <span className="font-semibold">{formatEuro(printCheckTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bearbeitung</span>
                <span className="font-semibold">{formatEuro(PROCESSING_FEE)}</span>
              </div>
              {couponDiscount > 0 ? (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Gutschein {appliedCoupon?.code}</span>
                  <span className="font-semibold">-{formatEuro(couponDiscount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versand</span>
                <span className="font-semibold">{loadingRates ? "Berechne..." : formatEuro(shippingCost)}</span>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">Gutschein</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    setAppliedCoupon(null);
                    setCouponMessage("");
                  }}
                  className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold uppercase outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="CODE"
                  disabled={studentDiscountTotal > 0}
                />
                <Button type="button" variant="outline" className="h-10 border-slate-200 bg-white px-3 text-xs" onClick={() => void applyCoupon()} disabled={couponLoading || !hasItems || studentDiscountTotal > 0}>
                  {couponLoading ? "Prüft..." : "Einlösen"}
                </Button>
              </div>
              {couponMessage ? (
                <p className={appliedCoupon ? "mt-2 text-xs font-semibold text-emerald-700" : "mt-2 text-xs font-semibold text-red-600"}>
                  {couponMessage}
                </p>
              ) : null}
            </div>
            <div className="my-4 h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Gesamt</span>
              <span className="text-xl font-black text-slate-950">{formatEuro(grandTotal)}</span>
            </div>

            {cart.some((item) => item.printCheckFileName || item.printCheckFileUrl) ? (
              <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-black text-slate-900">Profi Print-Check</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Optional direkt vor der Zahlung buchen. Ohne Auswahl wird die Datei nur hochgeladen.</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {cart.filter((item) => item.printCheckFileName || item.printCheckFileUrl).map((item) => (
                    <label key={`print-check-${item.slug}`} className={item.printCheckRequested ? "flex cursor-pointer items-start gap-3 rounded-md border border-emerald-300 bg-white p-3" : "flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3 hover:border-emerald-300"}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.printCheckRequested)}
                        onChange={(event) => updatePrintCheck(item.slug, event.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
                      />
                      <span className="min-w-0 text-xs leading-5">
                        <span className="block font-black text-slate-900">KI + manuelle Prüfung + {formatEuro(item.printCheckFee || PRINT_CHECK_FEE)}</span>
                        <span className="block font-semibold text-slate-700">{item.name}</span>
                        <span className="block break-all text-slate-500">Datei: {item.printCheckFileName ?? item.printCheckFileUrl}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 border-y border-slate-200 py-4">
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => setLegalAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
                />
                <span>
                  Ich habe die <Link className="font-bold text-emerald-700 hover:underline" href="/agb" target="_blank">Allgemeinen Geschäftsbedingungen</Link>, die{" "}
                  <Link className="font-bold text-emerald-700 hover:underline" href="/datenschutz" target="_blank">Datenschutzbestimmungen</Link> sowie die{" "}
                  <Link className="font-bold text-emerald-700 hover:underline" href="/druckdaten-hinweise" target="_blank">Druckdaten- und Produktionshinweise</Link> gelesen und akzeptiere diese.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={printApprovalAccepted}
                  onChange={(event) => setPrintApprovalAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
                />
                <span>Ich bestätige die Druckfreigabe. Layout, Texte, Maße, Farben, Bilder, Logos und sonstige Inhalte wurden geprüft. Nach der Freigabe übernehme ich die Verantwortung für Fehler in den freigegebenen Daten.</span>
              </label>
            </div>

            <Button className="mt-5 w-full border-emerald-700 bg-emerald-700 shadow-none hover:border-emerald-800 hover:bg-emerald-800 hover:shadow-none" onClick={() => void startStripeCheckout()} disabled={state === "sending" || !legalAccepted || !printApprovalAccepted}>
              {state === "sending" ? "Bitte warten..." : "Zahlungspflichtig bestellen"}
            </Button>
            <Button className="mt-2 w-full border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950" variant="outline" onClick={() => void placeOrderWithoutPayment()} disabled={state === "sending" || !legalAccepted || !printApprovalAccepted}>
              Bestellung ohne Zahlung speichern
            </Button>
            {message ? <p className={state === "error" ? "mt-3 text-xs text-red-600" : "mt-3 text-xs text-emerald-700"}>{message}</p> : null}
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Ihre Bestätigung wird zusammen mit dem Auftrag dokumentiert. Sie können Ihre Daten vor dem Bezahlen jederzeit ändern.
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
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Warenkorb</p>
                    <p className="text-sm font-semibold text-slate-700">{cart.length} Positionen</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setCartDrawerOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {cart.map((item) => (
                    <div key={item.slug} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                      {item.printCheckFileName || item.printCheckFileUrl ? (
                        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                          <p className="font-semibold">Datei hochgeladen</p>
                          <p className="mt-0.5 break-all">{item.printCheckFileName ?? item.printCheckFileUrl}</p>
                          {item.printCheckRequested ? (
                            <p className="mt-1 font-semibold text-emerald-700">Profi Print-Check gebucht (+{formatEuro(item.printCheckFee ?? PRINT_CHECK_FEE)})</p>
                          ) : (
                            <p className="mt-1 text-slate-500">Ohne Profi Print-Check</p>
                          )}
                        </div>
                      ) : null}
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
                  <Button className="w-full justify-between border-emerald-700 bg-emerald-700 shadow-none hover:border-emerald-800 hover:bg-emerald-800 hover:shadow-none" onClick={() => setCartDrawerOpen(false)}>
                    Zur Kasse
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
}
