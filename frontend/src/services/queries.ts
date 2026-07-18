import { useQuery } from "@tanstack/react-query";

import { api } from "./api";
import type { ProductListQuery, RentalOrderListQuery } from "./api-contract";

export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard", "summary"] as const,
  products: (query?: ProductListQuery) => ["products", query ?? {}] as const,
  orders: (query?: RentalOrderListQuery) => ["orders", query ?? {}] as const,
};

export const useSessionQuery = () =>
  useQuery({
    queryKey: queryKeys.session,
    queryFn: api.getSession,
  });

export const useDashboardSummaryQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.getDashboardSummary,
  });

export const useProductsQuery = (query?: ProductListQuery) =>
  useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => api.getProducts(query),
  });

export const useOrdersQuery = (query?: RentalOrderListQuery) =>
  useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => api.getOrders(query),
  });
