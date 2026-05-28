"use client";

import Link from "next/link";
import Image from "next/image";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CardProduct = Product | ProductCatalogItem;

export function ProductCard({
  product,
  isSelected = false,
  onToggleSelect
}: {
  product: CardProduct;
  isSelected?: boolean;
  onToggleSelect?: (slug: string) => void;
}) {
  const image = "heroImage" in product ? product.heroImage : product.image;

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
            <p className="text-sm font-bold text-muted-foreground">Preis auf Anfrage</p>
          </div>
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
          <Button asChild variant="outline" className="mt-5 w-full hover:bg-brand-mist hover:text-brand-blue"><Link href={`/produkt/${product.slug}`}><Info className="h-4 w-4" /> Details ansehen</Link></Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
