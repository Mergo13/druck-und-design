"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  PackageSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  emptyCommerceState,
  requestAiCommerce,
  type AICommerceItem,
  type AICommerceState
} from "@/lib/ai-client";

function formatEuro(value: number) {
  return value.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

export function AiPrintAdvisor() {
  const [message, setMessage] = useState("");
  const [commerce, setCommerce] = useState<AICommerceState>(emptyCommerceState);
  const [advisorReply, setAdvisorReply] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = isLoading;

  async function submit() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || busy) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await requestAiCommerce(trimmedMessage, commerce);
      setCommerce(response.state);
      setAdvisorReply(response.reply);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Der Produktberater ist derzeit nicht erreichbar.");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <section className="border-y border-slate-200 bg-white py-16 md:py-20" aria-labelledby="ai-print-advisor-title">
      <div className="container-page">
        <div className="mx-auto max-w-4xl">
          <div>
            <div id="ai-print-advisor-title">
              <SectionHeading
                eyebrow="Digitale Produktberatung"
                title="Nicht sicher, welches Produkt passt?"
                description="Beschreiben Sie kurz, was Sie brauchen."
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 rounded-lg border border-slate-200 bg-white p-4 shadow-premium sm:p-6" aria-busy={isLoading}>
            <label htmlFor="print-inquiry" className="sr-only">Ihr Druckvorhaben</label>
            <div className="rounded-lg border border-slate-300 bg-slate-50/70 p-2 transition focus-within:border-brand-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-blue/10">
              <textarea
                ref={inputRef}
                id="print-inquiry"
                value={message}
                maxLength={2000}
                rows={3}
                disabled={busy}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="z. B. 500 Flyer für eine Eröffnung ..."
                className="min-h-24 w-full resize-y bg-transparent px-3 py-2 text-base leading-7 text-brand-ink outline-none placeholder:text-slate-400 disabled:cursor-wait sm:text-lg"
              />
              <div className="flex flex-col gap-3 border-t border-slate-200 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-400" aria-hidden="true">{message.length.toLocaleString("de-AT")} / 2.000</span>
                <Button type="submit" disabled={!message.trim() || busy}>
                  {isLoading ? (
                    <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Anfrage wird verstanden</>
                  ) : (
                    <>Produkt finden <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                  )}
                </Button>
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
              <h3 className="text-2xl font-black text-brand-ink md:text-3xl">Passende Produkte</h3>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {commerce.items.map((item) => <CommerceItemCard key={item.id} item={item} />)}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </section>
  );
}

function CommerceItemCard({ item }: { item: AICommerceItem }) {
  const configuration = item.options
    .map((option) => {
      const selected = item.configuration[option.key];
      const label = option.values?.find((value) => value.value === selected)?.label ?? selected;
      return label ? `${option.label}: ${label}` : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Card className="border-slate-200 bg-white shadow-[0_14px_35px_rgba(17,34,68,.07)]">
      <CardContent className="p-5 sm:p-6">
        <h4 className="text-xl font-black text-brand-ink">{item.product.name}</h4>

        <CommerceProductMedia item={item} />

        <p className="mt-4 text-sm font-bold text-slate-600">Menge: {item.quantity.toLocaleString("de-AT")}</p>
        {configuration.length ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{configuration.join(" · ")}</p> : null}

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
          <Button asChild>
            <Link href={item.product.href}>Produkt konfigurieren <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CommerceProductMedia({ item }: { item: AICommerceItem }) {
  const fallbackProductImage = "/uploads/products/abschlussarbeiten.webp";
  const images = Array.from(new Set([item.product.heroImage, ...item.product.gallery].filter(Boolean)));
  const productImages = images.length ? images : [fallbackProductImage];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = productImages[Math.min(selectedIndex, productImages.length - 1)];
  const unoptimized = selectedImage.startsWith("/uploads/");

  function selectRelative(direction: -1 | 1) {
    setSelectedIndex((current) => (current + direction + productImages.length) % productImages.length);
  }

  return (
    <div className="mt-5 grid gap-2.5">
      <div className="group relative aspect-[16/9] overflow-hidden rounded-md border border-slate-200 bg-brand-mist">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0.35, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={selectedImage}
              alt={`${item.product.name} – Ansicht ${selectedIndex + 1}`}
              fill
              unoptimized={unoptimized}
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.025]"
              sizes="(min-width: 1024px) 44vw, (min-width: 640px) 88vw, 100vw"
            />
          </motion.div>
        </AnimatePresence>

        {productImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => selectRelative(-1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-brand-ink shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              aria-label={`Vorheriges Bild von ${item.product.name}`}
              title="Vorheriges Bild"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => selectRelative(1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-brand-ink shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              aria-label={`Nächstes Bild von ${item.product.name}`}
              title="Nächstes Bild"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-xs font-bold text-brand-ink shadow-sm">
              {selectedIndex + 1} / {productImages.length}
            </span>
          </>
        ) : null}
      </div>

      {productImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label={`Bilder von ${item.product.name}`}>
          {productImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded border bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                selectedIndex === index ? "border-brand-blue ring-1 ring-brand-blue" : "border-slate-200 hover:border-slate-400"
              }`}
              aria-label={`${item.product.name}, Bild ${index + 1} anzeigen`}
              aria-pressed={selectedIndex === index}
            >
              <Image
                src={image}
                alt=""
                fill
                unoptimized={image.startsWith("/uploads/")}
                className="object-contain p-0.5"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
