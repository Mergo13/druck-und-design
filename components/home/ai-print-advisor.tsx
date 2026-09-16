"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  Send,
  ShoppingCart,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyCommerceState,
  requestAiCommerce,
  synchronizeAiCommerce,
  type AICommerceCartEntry,
  type AICommerceItem,
  type AICommerceState
} from "@/lib/ai-client";

const initialExamples = [
  "Ich brauche 500 A5 Flyer, beidseitig und matt.",
  "Visitenkarten für mein neues Unternehmen.",
  "Bachelorarbeit drucken und binden.",
  "Autobeschriftung für einen Firmenwagen."
];

const followUpExamples = [
  "Mach daraus 1000 Stück.",
  "Füge 200 Visitenkarten dazu.",
  "Was kostet alles zusammen?",
  "Leg alles in den Warenkorb."
];

function formatEuro(value: number) {
  return value.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

function mergeIntoCart(entries: AICommerceCartEntry[]) {
  if (!entries.length) return;
  let existing: AICommerceCartEntry[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("dud_cart") || "[]") as unknown;
    if (Array.isArray(parsed)) existing = parsed as AICommerceCartEntry[];
  } catch {
    existing = [];
  }

  const merged = [...existing];
  for (const entry of entries) {
    const found = merged.find((item) => (
      item.slug === entry.slug
      && JSON.stringify(item.pricingConfig ?? {}) === JSON.stringify(entry.pricingConfig ?? {})
    ));
    if (found) found.quantity += entry.quantity;
    else merged.push(entry);
  }
  localStorage.setItem("dud_cart", JSON.stringify(merged));
  window.dispatchEvent(new Event("dud-cart-updated"));
}

function nextQuantity(item: AICommerceItem, direction: -1 | 1) {
  const choices = item.quantityRules.choices;
  if (choices.length) {
    const ordered = direction > 0 ? choices : [...choices].reverse();
    const next = ordered.find((choice) => direction > 0 ? choice > item.quantity : choice < item.quantity);
    if (next !== undefined) return next;
  }
  return Math.min(
    item.quantityRules.max,
    Math.max(item.quantityRules.min, item.quantity + direction * item.quantityRules.step)
  );
}

export function AiPrintAdvisor() {
  const [message, setMessage] = useState("");
  const [commerce, setCommerce] = useState<AICommerceState>(emptyCommerceState);
  const [advisorReply, setAdvisorReply] = useState("");
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = isLoading || isSyncing;
  const examples = commerce.items.length ? followUpExamples : initialExamples;

  async function submit() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || busy) return;
    setIsLoading(true);
    setError("");
    setCartMessage("");

    try {
      const response = await requestAiCommerce(trimmedMessage, commerce);
      setCommerce(response.state);
      setAdvisorReply(response.reply);
      if (response.cartItems?.length) {
        mergeIntoCart(response.cartItems);
        setCartMessage(`${response.cartItems.length} ${response.cartItems.length === 1 ? "Position wurde" : "Positionen wurden"} in den Warenkorb gelegt.`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Der Produktberater ist derzeit nicht erreichbar.");
    } finally {
      setIsLoading(false);
    }
  }

  async function syncCommerce(next: AICommerceState) {
    if (busy) return;
    const previous = commerce;
    setCommerce(next);
    setIsSyncing(true);
    setError("");
    setCartMessage("");
    try {
      const response = await synchronizeAiCommerce(next);
      setCommerce(response.state);
    } catch (requestError) {
      setCommerce(previous);
      setError(requestError instanceof Error ? requestError.message : "Die Konfiguration konnte nicht aktualisiert werden.");
    } finally {
      setIsSyncing(false);
    }
  }

  function updateItem(itemId: string, update: (item: AICommerceItem) => AICommerceItem) {
    const next = {
      ...commerce,
      activeItemId: itemId,
      items: commerce.items.map((item) => item.id === itemId ? update(item) : item)
    };
    void syncCommerce(next);
  }

  function removeItem(itemId: string) {
    const items = commerce.items.filter((item) => item.id !== itemId);
    void syncCommerce({
      ...commerce,
      items,
      activeItemId: commerce.activeItemId === itemId ? items.at(-1)?.id ?? null : commerce.activeItemId
    });
  }

  function addCartItems(entries: AICommerceCartEntry[]) {
    mergeIntoCart(entries);
    setCartMessage(`${entries.length} ${entries.length === 1 ? "Position wurde" : "Positionen wurden"} in den Warenkorb gelegt.`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  function selectExample(example: string) {
    setMessage(example);
    setError("");
    inputRef.current?.focus();
  }

  const allCartEntries = commerce.items.flatMap((item) => item.cartEntry ? [item.cartEntry] : []);

  return (
    <section className="border-y border-slate-200 bg-white py-16 md:py-20" aria-labelledby="ai-print-advisor-title">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16">
          <div className="lg:pt-3">
            <div id="ai-print-advisor-title">
              <SectionHeading
                eyebrow="Digitale Produktberatung"
                title="Was möchten Sie drucken?"
                description="Beschreiben Sie Ihr Vorhaben oder ändern Sie Ihre Zusammenstellung später einfach mit einem weiteren Satz."
              />
            </div>
            <div className="mt-7 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-3 lg:grid-cols-1">
              {["Echte Katalogprodukte", "Gültige Konfigurationen", "Preise aus dem Shopsystem"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-premium sm:p-6" aria-busy={isLoading}>
            <label htmlFor="print-inquiry" className="text-sm font-black text-brand-ink">Ihr Druckvorhaben</label>
            <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50/70 p-2 transition focus-within:border-brand-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-blue/10">
              <textarea
                ref={inputRef}
                id="print-inquiry"
                value={message}
                maxLength={2000}
                rows={4}
                disabled={busy}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreiben Sie kurz, was Sie benötigen …"
                className="min-h-28 w-full resize-y bg-transparent px-3 py-2 text-base leading-7 text-brand-ink outline-none placeholder:text-slate-400 disabled:cursor-wait sm:text-lg"
                aria-describedby="print-inquiry-examples"
              />
              <div className="flex flex-col gap-3 border-t border-slate-200 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-400" aria-hidden="true">{message.length.toLocaleString("de-AT")} / 2.000</span>
                <Button type="submit" disabled={!message.trim() || busy}>
                  {isLoading ? (
                    <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Anfrage wird verstanden</>
                  ) : (
                    <>Shop konfigurieren <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                  )}
                </Button>
              </div>
            </div>

            <div id="print-inquiry-examples" className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Beispiele</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={busy}
                    onClick={() => selectExample(example)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold leading-5 text-slate-700 transition hover:border-brand-blue/40 hover:bg-brand-mist hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="mt-8" aria-live="polite">
          {isLoading && !commerce.items.length ? <WorkspaceSkeleton /> : null}

          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900 shadow-[0_10px_30px_rgba(127,29,29,.06)]">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-black">Das hat noch nicht geklappt.</p>
                  <p className="mt-1 text-sm leading-6 text-red-800">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {advisorReply ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-brand-blue/20 bg-brand-mist p-4 text-sm leading-6 text-brand-ink">
              <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" aria-hidden="true" />
              <p className="font-semibold">{advisorReply}</p>
            </div>
          ) : null}

          {commerce.items.length ? (
            <div aria-busy={busy}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Badge variant="outline" className="border-brand-blue/20 bg-white text-brand-blue">
                    <SlidersHorizontal className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Live-Konfiguration
                  </Badge>
                  <h3 className="mt-3 text-2xl font-black text-brand-ink md:text-3xl">Ihre Zusammenstellung</h3>
                </div>
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => {
                  setCommerce(emptyCommerceState);
                  setAdvisorReply("");
                  setCartMessage("");
                }}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Zurücksetzen
                </Button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {commerce.items.map((item) => (
                  <CommerceItemCard
                    key={item.id}
                    item={item}
                    active={commerce.activeItemId === item.id}
                    disabled={busy}
                    onActivate={() => setCommerce((current) => ({ ...current, activeItemId: item.id }))}
                    onRemove={() => removeItem(item.id)}
                    onQuantity={(quantity) => updateItem(item.id, (current) => ({ ...current, quantity }))}
                    onConfiguration={(key, value) => updateItem(item.id, (current) => ({
                      ...current,
                      configuration: { ...current.configuration, [key]: value },
                      unresolved: current.unresolved.filter((entry) => entry.key !== key)
                    }))}
                    onAddToCart={() => item.cartEntry && addCartItems([item.cartEntry])}
                  />
                ))}
              </div>

              <div className="mt-6 border-y border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Gesamtsumme</p>
                    <p className="mt-1 text-2xl font-black text-brand-ink">
                      {commerce.total.status === "available" && commerce.total.amount !== undefined
                        ? formatEuro(commerce.total.amount)
                        : commerce.total.status === "login_required"
                          ? "Nach Anmeldung"
                          : "Preis auf Anfrage"}
                    </p>
                    {isSyncing ? <p className="mt-1 text-xs font-semibold text-brand-blue">Preis wird neu berechnet …</p> : null}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {allCartEntries.length === commerce.items.length ? (
                      <Button type="button" disabled={busy} onClick={() => addCartItems(allCartEntries)}>
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Alles in den Warenkorb
                      </Button>
                    ) : commerce.total.status === "login_required" ? (
                      <Button asChild><Link href="/login">Anmelden und Preise sehen</Link></Button>
                    ) : null}
                    <Button asChild variant="outline"><Link href="/kontakt">Angebot anfragen</Link></Button>
                    <Button asChild variant="ghost"><Link href="/kontakt"><Send className="h-4 w-4" aria-hidden="true" /> Anfrage senden</Link></Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {cartMessage ? (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
              <span>{cartMessage}</span>
              <Button asChild variant="outline" size="sm"><Link href="/warenkorb">Zum Warenkorb <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CommerceItemCard({
  item,
  active,
  disabled,
  onActivate,
  onRemove,
  onQuantity,
  onConfiguration,
  onAddToCart
}: {
  item: AICommerceItem;
  active: boolean;
  disabled: boolean;
  onActivate: () => void;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
  onConfiguration: (key: string, value: string) => void;
  onAddToCart: () => void;
}) {
  return (
    <Card className={active ? "border-brand-blue bg-white shadow-[0_18px_45px_rgba(17,85,204,.12)] ring-2 ring-brand-blue/10" : "border-slate-200 bg-white shadow-[0_14px_35px_rgba(17,34,68,.07)]"}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xl font-black text-brand-ink">{item.product.name}</h4>
              {active ? <Badge>Aktiv</Badge> : null}
            </div>
            <Link href={item.product.href} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:text-brand-ink">
              Produkt ansehen <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex shrink-0 gap-1">
            {!active ? (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onActivate}>Bearbeiten</Button>
            ) : null}
            <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={onRemove} title={`${item.product.name} entfernen`} aria-label={`${item.product.name} entfernen`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-slate-700" htmlFor={`quantity-${item.id}`}>Menge</label>
            <div className="mt-2 grid grid-cols-[44px_minmax(0,1fr)_44px] overflow-hidden rounded-md border border-slate-300 bg-white">
              <button type="button" disabled={disabled || item.quantity <= item.quantityRules.min} onClick={() => onQuantity(nextQuantity(item, -1))} className="grid h-11 place-items-center border-r text-slate-600 transition hover:bg-brand-mist hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue disabled:opacity-40" aria-label="Menge verringern">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <input
                key={`${item.id}-${item.quantity}`}
                id={`quantity-${item.id}`}
                type="number"
                min={item.quantityRules.min}
                max={item.quantityRules.max}
                step={item.quantityRules.step}
                defaultValue={item.quantity}
                disabled={disabled}
                onBlur={(event) => {
                  const value = Number(event.currentTarget.value);
                  if (Number.isFinite(value) && value !== item.quantity) onQuantity(value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className="h-11 min-w-0 bg-white px-2 text-center text-sm font-black outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue"
              />
              <button type="button" disabled={disabled || item.quantity >= item.quantityRules.max} onClick={() => onQuantity(nextQuantity(item, 1))} className="grid h-11 place-items-center border-l text-slate-600 transition hover:bg-brand-mist hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue disabled:opacity-40" aria-label="Menge erhöhen">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {item.options.map((option) => (
            <label key={option.key} className="grid gap-2 text-sm font-bold text-slate-700">
              {option.label}
              {option.kind === "select" ? (
                <select
                  value={item.configuration[option.key] ?? ""}
                  disabled={disabled}
                  onChange={(event) => onConfiguration(option.key, event.target.value)}
                  className="h-11 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
                >
                  {option.values?.map((value) => <option key={value.value} value={value.value}>{value.label}</option>)}
                </select>
              ) : (
                <input
                  type="number"
                  value={item.configuration[option.key] ?? ""}
                  min={option.min}
                  max={option.max}
                  step={option.step}
                  disabled={disabled}
                  onChange={(event) => onConfiguration(option.key, event.target.value)}
                  className="h-11 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-brand-ink outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
                />
              )}
            </label>
          ))}
        </div>

        {item.unresolved.length ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-black">Nicht im aktuellen Produkt hinterlegt</p>
            <ul className="mt-2 grid gap-1">
              {item.unresolved.map((entry, index) => <li key={`${entry.key}-${index}`}>{entry.key}: {entry.value}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Preis</p>
            <p className="mt-1 text-xl font-black text-brand-ink">
              {item.price.status === "available" && item.price.total !== undefined
                ? formatEuro(item.price.total)
                : item.price.status === "login_required"
                  ? "Nach Anmeldung"
                  : "Preis auf Anfrage"}
            </p>
          </div>
          {item.cartEntry ? (
            <Button type="button" disabled={disabled} onClick={onAddToCart}>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" /> In den Warenkorb
            </Button>
          ) : item.price.status === "login_required" ? (
            <Button asChild><Link href="/login">Anmelden</Link></Button>
          ) : (
            <Button asChild variant="outline"><Link href="/kontakt">Anfrage starten</Link></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(17,34,68,.08)] sm:p-7" role="status">
      <span className="sr-only">Shop-Konfiguration wird erstellt.</span>
      <div className="flex items-center gap-3"><Skeleton className="h-8 w-28" /><Skeleton className="ml-auto h-8 w-32" /></div>
      <Skeleton className="mt-6 h-7 w-2/3" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
      <Skeleton className="mt-6 h-12 w-full" />
    </div>
  );
}
