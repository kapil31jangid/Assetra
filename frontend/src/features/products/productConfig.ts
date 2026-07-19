import { useEffect, useMemo, useState } from "react";

import type { Id, Product, RentalPeriodUnit } from "../../types";
import { catalogDailyRates } from "../../utils/catalog";

export interface ProductConfig {
  productId: Id;
  active: boolean;
  repairStatus: Product["repairStatus"];
  availableStock: number;
  depositAmount: number;
  pickupPaddingMinutes: number;
  returnPaddingMinutes: number;
  lateFeePerHour: number;
}

export interface PricingConfig {
  id: Id;
  productId: Id;
  periodUnit: RentalPeriodUnit;
  fixedPrice: number;
  minimumQuantity: number;
  selectable: boolean;
}

const productConfigStorageKey = "assetra.mock.product.config";
const pricingConfigStorageKey = "assetra.mock.pricing.config";

const readJson = <T,>(key: string, fallback: T): T => {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

const defaultProductConfig = (product: Product): ProductConfig => ({
  productId: product.id,
  active: product.active,
  repairStatus: product.repairStatus,
  availableStock: product.stock.available,
  depositAmount: product.depositPolicy.amount.amount,
  pickupPaddingMinutes: 30,
  returnPaddingMinutes: 30,
  lateFeePerHour: 250,
});

const defaultPricingConfig = (product: Product): PricingConfig[] =>
  product.rentalUnits.map((periodUnit: string) => ({
    id: `price_${product.id}_${periodUnit}`,
    productId: product.id,
    periodUnit,
    fixedPrice: catalogDailyRates[product.id]?.amount ?? 0,
    minimumQuantity: 1,
    selectable: true,
  }));

export const useProductConfiguration = (products: Product[]) => {
  const [configs, setConfigs] = useState<ProductConfig[]>(() =>
    readJson(productConfigStorageKey, []),
  );
  const [pricing, setPricing] = useState<PricingConfig[]>(() =>
    readJson(pricingConfigStorageKey, []),
  );

  useEffect(() => {
    window.localStorage.setItem(productConfigStorageKey, JSON.stringify(configs));
  }, [configs]);

  useEffect(() => {
    window.localStorage.setItem(pricingConfigStorageKey, JSON.stringify(pricing));
  }, [pricing]);

  return useMemo(() => {
    const productById = new Map(products.map((product) => [product.id, product]));
    const getConfig = (product: Product) =>
      configs.find((config) => config.productId === product.id) ??
      defaultProductConfig(product);
    const getPricing = (product: Product) => {
      const saved = pricing.filter((rule) => rule.productId === product.id);
      return saved.length ? saved : defaultPricingConfig(product);
    };

    return {
      getConfig,
      getPricing,
      updateConfig: (productId: Id, patch: Partial<ProductConfig>) => {
        setConfigs((current) => {
          const product = productById.get(productId);
          const base = product ? defaultProductConfig(product) : null;
          const existing = current.find((config) => config.productId === productId);
          const nextConfig = { ...(existing ?? base), ...patch } as ProductConfig;

          return existing
            ? current.map((config) =>
              config.productId === productId ? nextConfig : config,
            )
            : [...current, nextConfig];
        });
      },
      updatePricing: (rule: PricingConfig) => {
        setPricing((current) => {
          debugger;
          const exists = current.some((item) => item.id === rule.id);
          return exists
            ? current.map((item) => (item.id === rule.id ? rule : item))
            : [...current, rule];
        });
      },
    };
  }, [configs, pricing, products]);
};
