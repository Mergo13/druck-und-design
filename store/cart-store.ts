"use client";

import { create } from "zustand";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  wishlist: string[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  toggleWishlist: (slug: string) => void;
  total: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  wishlist: [],
  addItem: (item) => set({ items: [...get().items, item] }),
  removeItem: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
  toggleWishlist: (slug) =>
    set({
      wishlist: get().wishlist.includes(slug)
        ? get().wishlist.filter((item) => item !== slug)
        : [...get().wishlist, slug]
    }),
  total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}));
