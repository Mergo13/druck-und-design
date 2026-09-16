"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
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
  className
}: {
  product: CardProduct;
  showPrices?: boolean;
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
  priceLabel = priceLabel.replace(/^Ab /, "ab ");

  const delivery = "deliveryText" in product ? product.deliveryText : ("delivery" in product ? product.delivery : undefined);
  const deliveryLabel = delivery || ("production" in product && product.production?.baseProductionDays ? `${product.production.baseProductionDays} Werktage` : undefined);

  const purchaseMode = "purchaseMode" in product ? product.purchaseMode : "online";
  const ctaHref = purchaseMode === "request" ? "/kontakt" : `/produkt/${product.slug}`;
  const usefulBadge = product.tags?.find((tag) => ["neu", "bestseller", "express"].includes(tag.toLowerCase()))
    ?? ("isBestseller" in product && product.isBestseller ? "Bestseller" : undefined);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={cn("flex h-full flex-col", className)}
    >
      <Link href={ctaHref} className="flex h-full" aria-label={`${product.name} ansehen`}>
        <Card className="group flex h-full w-full flex-col overflow-hidden border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(17,34,68,.08)] transition-all duration-300 hover:border-brand-blue/30 hover:shadow-[0_25px_55px_rgba(17,85,204,.13)]">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-mist">
            <Image
              src={image}
              alt={product.name}
              fill
              unoptimized={unoptimizedImage}
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            {usefulBadge ? (
              <span className="absolute left-3 top-3 rounded-md bg-white/92 px-2.5 py-1 text-xs font-black text-brand-ink shadow-sm backdrop-blur">
                {usefulBadge}
              </span>
            ) : null}
          </div>
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 text-lg font-black text-brand-ink transition-colors group-hover:text-brand-blue sm:text-xl">
                {product.name}
              </h3>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-blue" aria-hidden="true" />
            </div>
            <div className="mt-auto pt-5">
              <p className="text-lg font-black text-brand-blue">{showPrices ? priceLabel : "Preis nach Anmeldung"}</p>
              {deliveryLabel ? <p className="mt-1 text-xs font-bold text-slate-500">{deliveryLabel}</p> : null}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
