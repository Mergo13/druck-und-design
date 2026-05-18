"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";
import type { ProductCatalogItem } from "@/types/print-platform";

type CardProduct = Product | ProductCatalogItem;

export function ProductCard({ product }: { product: CardProduct }) {
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const wishlist = useCartStore((state) => state.wishlist);
  const image = "heroImage" in product ? product.heroImage : product.image;
  const priceFrom = "basePrice" in product ? product.basePrice : product.priceFrom;

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
      <Card className="h-full overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-mist">
          <Image src={image} alt={`${product.name} Demo-Bild`} fill className="object-cover transition duration-500 hover:scale-105" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
          <button aria-label="Zur Wunschliste" onClick={() => toggleWishlist(product.slug)} className="absolute right-4 top-4 rounded-md bg-white p-2 shadow-soft">
            <Heart className={wishlist.includes(product.slug) ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
          </button>
        </div>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold" key={tag}>{tag}</span>)}
          </div>
          <Link href={`/produkt/${product.slug}`} className="mt-4 block text-xl font-black hover:text-primary">{product.name}</Link>
          <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.short}</p>
          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">ab</p>
              <p className="text-lg font-black">{formatEuro(priceFrom)}</p>
            </div>
          </div>
          <Button asChild className="mt-5 w-full"><Link href={`/produkt/${product.slug}`}><ShoppingBag className="h-4 w-4" /> Konfigurieren</Link></Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
