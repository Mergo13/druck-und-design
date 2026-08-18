"use client";

import Link from "next/link";
import Image from "next/image";
import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatEuro } from "@/lib/utils";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CardProduct = Product | ProductCatalogItem;
const fallbackProductImage = "/uploads/products/abschlussarbeiten.webp";

export function ProductCard({
  product,
  showPrices = true,
  isSelected = false,
  onToggleSelect,
  className
}: {
  product: CardProduct;
  showPrices?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (slug: string) => void;
  className?: string;
}) {
  const image = ("heroImage" in product ? product.heroImage : product.image) || fallbackProductImage;
  const unoptimizedImage = image.startsWith("/uploads/");

  let priceLabel = "Preis auf Anfrage";
  if ("basePrice" in product && typeof product.basePrice === "number") {
    if ("pricingType" in product || "purchaseMode" in product) {
      priceLabel = getProductStartingPriceLabel(product as ProductCatalogItem);
    } else {
      priceLabel = product.basePrice > 0 ? `Ab ${formatEuro(product.basePrice)}` : "Preis auf Anfrage";
    }
  } else if ("priceFrom" in product && typeof product.priceFrom === "number") {
    priceLabel = product.priceFrom > 0 ? `Ab ${formatEuro(product.priceFrom)}` : "Preis auf Anfrage";
  }

  const delivery = "deliveryText" in product ? product.deliveryText : ("delivery" in product ? product.delivery : undefined);
  const deliveryLabel = delivery || ("production" in product && product.production?.baseProductionDays ? `${product.production.baseProductionDays} Werktage` : undefined);

  const purchaseMode = "purchaseMode" in product ? product.purchaseMode : "online";
  const ctaHref = purchaseMode === "request" ? "/kontakt" : `/produkt/${product.slug}`;
  const ctaLabel = purchaseMode === "request" ? "Angebot anfragen" : "Konfigurieren";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={cn("flex h-full flex-col", className)}
    >
      <Card className="group flex h-full flex-col overflow-hidden border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(17,34,68,.08)] transition-all duration-300 hover:border-brand-blue/30 hover:shadow-[0_25px_55px_rgba(17,85,204,.13)]">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-mist">
          <Image
            src={image}
            alt={`${product.name} Demo-Bild`}
            fill
            unoptimized={unoptimizedImage}
            className="object-cover transition duration-700 group-hover:scale-105"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-ink/25 to-transparent" />
        </div>
        <CardContent className="flex flex-1 flex-col p-5 sm:p-6">
          {product.tags && product.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  className={
                    index === 0
                      ? "rounded-full bg-brand-coral/10 px-2.5 py-0.5 text-xs font-bold text-[#d8442a]"
                      : "rounded-full bg-brand-mist px-2.5 py-0.5 text-xs font-bold text-brand-blue"
                  }
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <Link
            href={`/produkt/${product.slug}`}
            className={cn(
              "block text-lg font-black text-brand-ink transition-colors hover:text-brand-blue sm:text-xl line-clamp-2",
              product.tags && product.tags.length > 0 ? "mt-3" : "mt-0"
            )}
            title={product.name}
          >
            {product.name}
          </Link>

          <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-3">
            {product.short}
          </p>

          <div className="mt-auto pt-5">
            <div className="flex items-baseline justify-between gap-2">
              {showPrices ? (
                <div>
                  <p className="text-lg font-black text-brand-blue">{priceLabel}</p>
                  {deliveryLabel ? (
                    <p className="mt-0.5 text-xs font-bold text-slate-500">{deliveryLabel}</p>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-black text-brand-blue underline decoration-brand-cyan underline-offset-4"
                >
                  Für Preise anmelden
                </Link>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {showPrices ? (
                <Button asChild className="w-full bg-brand-blue hover:bg-[#0d47b5]">
                  <Link href={ctaHref}>
                    <Settings2 className="mr-1.5 h-4 w-4" /> {ctaLabel}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/login">Anmelden und Preise sehen</Link>
                </Button>
              )}
              {onToggleSelect ? (
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onToggleSelect(product.slug)}
                >
                  {isSelected ? "Ausgewählt" : "Produkt auswählen"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
