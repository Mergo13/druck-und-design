"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Order } from "@/types";

type CartState = {
  items: CartItem[];
  wishlist: string[];
  orders: Order[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  toggleWishlist: (slug: string) => void;
  placeOrder: () => string | null;
  reorder: (orderId: string) => void;
  total: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      orders: [],
      addItem: (item) => set({ items: [...get().items, item] }),
      removeItem: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      toggleWishlist: (slug) =>
        set({
          wishlist: get().wishlist.includes(slug)
            ? get().wishlist.filter((item) => item !== slug)
            : [...get().wishlist, slug]
        }),
      placeOrder: () => {
        const items = get().items;
        if (items.length === 0) return null;
        const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const order: Order = { id: orderId, createdAt: new Date().toISOString(), items, total: get().total() };
        set({ orders: [order, ...get().orders], items: [] });
        return orderId;
      },
      reorder: (orderId) => {
        const order = get().orders.find((item) => item.id === orderId);
        if (!order) return;
        const mapped = order.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
        set({ items: [...get().items, ...mapped] });
      },
      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }),
    { name: "dud-platform-cart" }
  )
);
