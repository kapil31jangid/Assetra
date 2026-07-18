import { ROUTES } from "../constants/routes";
import type { Id, Money, Product } from "../types";

export const catalogDailyRates: Readonly<Record<Id, Money>> = {
  prd_camera_01: { amount: 2500, currency: "INR" },
  prd_projector_01: { amount: 1800, currency: "INR" },
  prd_speaker_01: { amount: 3200, currency: "INR" },
  prd_lighting_01: { amount: 1200, currency: "INR" },
  prd_laptop_01: { amount: 2200, currency: "INR" },
  prd_chair_01: { amount: 90, currency: "INR" },
};

export const getProductDetailRoute = (productId: Id) =>
  ROUTES.productDetail.replace(":productId", productId);

export const getProductDailyRate = (product: Product): Money =>
  catalogDailyRates[product.id] ?? {
    amount: product.depositPolicy.amount.amount,
    currency: product.depositPolicy.amount.currency,
  };

export const formatMoney = (money: Money) =>
  new Intl.NumberFormat("en-IN", {
    currency: money.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(money.amount);
