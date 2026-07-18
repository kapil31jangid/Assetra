import type { CheckoutOrder } from "./cart";

const orderStorageKey = "assetra.mock.lastOrder";
const orderHistoryStorageKey = "assetra.mock.orders";

export const saveCheckoutOrder = (order: CheckoutOrder) => {
  window.localStorage.setItem(orderStorageKey, JSON.stringify(order));
  window.localStorage.setItem(
    orderHistoryStorageKey,
    JSON.stringify([order, ...readCheckoutOrders()]),
  );
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

export const readCheckoutOrders = (): CheckoutOrder[] => {
  const raw = window.localStorage.getItem(orderHistoryStorageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CheckoutOrder[];
  } catch {
    window.localStorage.removeItem(orderHistoryStorageKey);
    return [];
  }
};
