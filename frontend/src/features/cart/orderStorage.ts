import type { CheckoutOrder } from "./cart";

const orderStorageKey = "assetra.mock.lastOrder";

export const saveCheckoutOrder = (order: CheckoutOrder) => {
  window.localStorage.setItem(orderStorageKey, JSON.stringify(order));
};

export const readCheckoutOrder = (): CheckoutOrder | null => {
  const raw = window.localStorage.getItem(orderStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CheckoutOrder;
  } catch {
    window.localStorage.removeItem(orderStorageKey);
    return null;
  }
};
