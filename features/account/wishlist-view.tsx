"use client";

import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

export function WishlistView() {
  const wishlist = useCartStore((state) => state.wishlist);
  const items = products.filter((product) => wishlist.includes(product.slug));
  return (
    <section className="container-page py-10">
      <h1 className="text-4xl font-black">Wunschliste</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.length ? items.map((product) => <ProductCard key={product.slug} product={product} />) : <p className="text-muted-foreground">Noch keine Produkte gespeichert.</p>}
      </div>
    </section>
  );
}
