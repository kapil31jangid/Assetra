import dayjs from "dayjs";

import type { Id, Money, RentalPeriodUnit } from "../../types";

export interface CartItem {
  id: Id;
  productId: Id;
  productName: string;
  variantId: Id;
  variantName: string;
  quantity: number;
  rentalUnit: RentalPeriodUnit;
  startsAt: string;
  endsAt: string;
  unitPrice: Money;
  deposit: Money;
}

export interface CheckoutOrder {
  id: Id;
  number: string;
  customerName: string;
  email: string;
  phone: string;
  fulfillmentMode: "delivery" | "store_pickup";
  address?: string;
  couponCode?: string;
  items: CartItem[];
  totals: CartTotals;
  createdAt: string;
}

export interface CartTotals {
  rental: Money;
  delivery: Money;
  discount: Money;
  deposit: Money;
  tax: Money;
  total: Money;
}

export const getRentalQuantity = (
  startsAt: string,
  endsAt: string,
  unit: RentalPeriodUnit,
) => {
  const start = dayjs(startsAt);
  const end = dayjs(endsAt);
  const hours = Math.max(1, end.diff(start, "hour", true));

  if (unit === "hourly") return Math.ceil(hours);
  if (unit === "weekly") return Math.ceil(hours / 24 / 7);
  if (unit === "monthly") return Math.ceil(hours / 24 / 30);
  return Math.ceil(hours / 24);
};

export const getCartItemRentalAmount = (item: CartItem) =>
  item.unitPrice.amount *
  item.quantity *
  getRentalQuantity(item.startsAt, item.endsAt, item.rentalUnit);

export const calculateCartTotals = (
  items: CartItem[],
  fulfillmentMode: "delivery" | "store_pickup" = "store_pickup",
  couponCode = "",
): CartTotals => {
  const currency = items[0]?.unitPrice.currency ?? "INR";
  const rentalAmount = items.reduce(
    (sum, item) => sum + getCartItemRentalAmount(item),
    0,
  );
  const deliveryAmount = fulfillmentMode === "delivery" ? 750 : 0;
  const depositAmount = items.reduce(
    (sum, item) => sum + item.deposit.amount * item.quantity,
    0,
  );
  const discountAmount =
    couponCode.trim().toUpperCase() === "ASSET10"
      ? Math.round(rentalAmount * 0.1)
      : 0;
  const taxableAmount = Math.max(0, rentalAmount + deliveryAmount - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.18);

  return {
    rental: { amount: rentalAmount, currency },
    delivery: { amount: deliveryAmount, currency },
    discount: { amount: discountAmount, currency },
    deposit: { amount: depositAmount, currency },
    tax: { amount: taxAmount, currency },
    total: {
      amount: taxableAmount + taxAmount + depositAmount,
      currency,
    },
  };
};
