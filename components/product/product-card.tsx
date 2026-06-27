"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Info, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CardProduct = Product | ProductCatalogItem;

export function ProductCard({
  product,
  isSelected = false,
  onToggleSelect,
  onAddToCart
}: {
  product: CardProduct;
  isSelected?: boolean;
  onToggleSelect?: (slug: string) => void;
  onAddToCart?: (slug: string) => void;
}) {
  const [added, setAdded] = useState(false);
  const image = "heroImage" in product ? product.heroImage : product.image;
  const priceLabel = "basePrice" in product ? `Ab ${formatEuro(product.basePrice)}` : "Preis auf Anfrage";

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    if (!onAddToCart) return;
    const rect = event.currentTarget.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent("dud-fly-to-cart", {
      detail: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }));
    onAddToCart(product.slug);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
      <Card className="h-full overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-mist">
          <Image src={image} alt={`${product.name} Demo-Bild`} fill className="object-cover transition duration-500 hover:scale-105" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
        </div>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold" key={tag}>{tag}</span>)}
          </div>
          <Link href={`/produkt/${product.slug}`} className="mt-4 block text-xl font-black hover:text-primary">{product.name}</Link>
          <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.short}</p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">{priceLabel}</p>
          </div>
          {onAddToCart ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full overflow-hidden rounded-lg"
              onClick={handleAddToCart}
            >
              <motion.span
                className={added
                  ? "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(16,185,129,.28)]"
                  : "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#1d4ed8,#0f766e)] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(29,78,216,.26)]"}
                animate={{
                  scale: added ? [1, 1.03, 1] : 1
                }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Hinzugefügt
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      In den Warenkorb
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            </motion.button>
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
          <Button asChild variant="outline" className="mt-3 w-full hover:bg-brand-mist hover:text-brand-blue"><Link href={`/produkt/${product.slug}`}><Info className="h-4 w-4" /> Details ansehen</Link></Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
