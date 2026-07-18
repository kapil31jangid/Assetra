import { useEffect, useMemo, useState } from "react";

import type { Id } from "../../types";
import type { CartItem } from "./cart";

const cartStorageKey = "assetra.mock.cart";

const readCart = (): CartItem[] => {
  const raw = window.localStorage.getItem(cartStorageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    window.localStorage.removeItem(cartStorageKey);
    return [];
  }
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [items]);

  return useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem: (item: CartItem) => {
        setItems((current) => {
          const existing = current.find(
            (entry) =>
              entry.productId === item.productId &&
              entry.variantId === item.variantId &&
              entry.startsAt === item.startsAt &&
              entry.endsAt === item.endsAt &&
              entry.rentalUnit === item.rentalUnit,
          );

          if (!existing) return [...current, item];

          return current.map((entry) =>
            entry.id === existing.id
              ? { ...entry, quantity: entry.quantity + item.quantity }
              : entry,
          );
        });
      },
      updateQuantity: (itemId: Id, quantity: number) => {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        );
      },
      removeItem: (itemId: Id) => {
        setItems((current) => current.filter((item) => item.id !== itemId));
      },
      clearCart: () => setItems([]),
    }),
    [items],
  );
};
