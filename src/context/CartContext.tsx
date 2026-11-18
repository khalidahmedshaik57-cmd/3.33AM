"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { ReactNode } from "react";
import type { CartItem } from "@/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addEvent: number;
  addItem: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "333am-cart-v1";
const storedCartSchema = z.array(z.object({
  designId: z.string(),
  variantId: z.string(),
  slug: z.string(),
  name: z.string(),
  size: z.string(),
  image: z.string().url(),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  stock: z.number().int().nonnegative()
}));

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [addEvent, setAddEvent] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = storedCartSchema.safeParse(JSON.parse(saved));
        if (parsed.success) setItems(parsed.data);
        else window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setAddEvent((current) => current + 1);
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (!existing) return [...current, item];
      return current.map((line) =>
        line.variantId === item.variantId
          ? { ...line, quantity: Math.min(line.quantity + item.quantity, line.stock) }
          : line
      );
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
      addEvent,
      addItem,
      setQuantity,
      removeItem,
      clearCart
    }),
    [items, addEvent, addItem, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
