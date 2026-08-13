"use client";

import Link from "next/link";
import Image from "next/image";
import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CardProduct = Product | ProductCatalogItem;

export function ProductCard({
  product,
  showPrices = true,
  isSelected = false,
  onToggleSelect
}: {
  product: CardProduct;
  showPrices?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (slug: string) => void;
}) {
  const image = "heroImage" in product ? product.heroImage : product.image;
  const unoptimizedImage = image.startsWith("/uploads/");
  const priceLabel = "basePrice" in product ? `Ab ${formatEuro(product.basePrice)}` : "Preis auf Anfrage";

  return (
    <motion.div whileHover={{ y: -7 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
      <Card className="group h-full overflow-hidden border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(17,34,68,.08)] hover:border-brand-blue/30 hover:shadow-[0_25px_55px_rgba(17,85,204,.13)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-mist">
          <Image src={image} alt={`${product.name} Demo-Bild`} fill unoptimized={unoptimizedImage} className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-ink/25 to-transparent" />
        </div>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => <span className={index === 0 ? "rounded-full bg-brand-coral/10 px-2.5 py-1 text-xs font-bold text-[#d8442a]" : "rounded-full bg-brand-mist px-2.5 py-1 text-xs font-bold text-brand-blue"} key={tag}>{tag}</span>)}
          </div>
          <Link href={`/produkt/${product.slug}`} className="mt-4 block text-xl font-black text-brand-ink transition hover:text-brand-blue">{product.name}</Link>
          <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.short}</p>
          <div className="mt-5 flex items-center justify-between">
            {showPrices ? (
              <p className="text-lg font-black text-brand-blue">{priceLabel}</p>
            ) : (
              <Link href="/login" className="text-sm font-black text-brand-blue underline decoration-brand-cyan underline-offset-4">
                Für Preise anmelden
              </Link>
            )}
          </div>
          {showPrices ? (
            <Button asChild className="mt-4 w-full bg-brand-blue hover:bg-[#0d47b5]">
              <Link href={`/produkt/${product.slug}`}><Settings2 className="h-4 w-4" /> Konfigurieren</Link>
            </Button>
          ) : !showPrices ? (
            <Button asChild className="mt-4 w-full"><Link href="/login">Anmelden und Preise sehen</Link></Button>
          ) : null}
          {onToggleSelect ? (
            <Button
              type="button"
              variant={isSelected ? "default" : "outline"}
              className="mt-3 w-full"
              onClick={() => onToggleSelect(product.slug)}
            >
              {isSelected ? "Ausgewählt" : "Produkt auswählen"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
