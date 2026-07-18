import type { AxiosResponse } from "axios";

import { apiClient } from "./api-client";
import type {
  ApiResponse,
  ListQuery,
  PaginatedResponse,
  ProductListQuery,
  RentalOrderListQuery,
} from "./api-contract";
import { envConfig } from "./config";
import { mockApi } from "./mock-api";
import type {
  DashboardSummary,
  Invoice,
  Pricelist,
  Product,
  RentalOrder,
  Session,
} from "../types";

const responseData = <T>(response: AxiosResponse<T>) => response.data;

export const api = {
  async getSession(): Promise<ApiResponse<Session>> {
    if (envConfig.useMockApi) return mockApi.getSession();
    return apiClient.get<ApiResponse<Session>>("/session").then(responseData);
  },

  async getProducts(
    query?: ProductListQuery,
  ): Promise<PaginatedResponse<Product>> {
    if (envConfig.useMockApi) return mockApi.getProducts(query);
    return apiClient
      .get<PaginatedResponse<Product>>("/products", { params: query })
      .then(responseData);
  },

  async getOrders(
    query?: RentalOrderListQuery,
  ): Promise<PaginatedResponse<RentalOrder>> {
    if (envConfig.useMockApi) return mockApi.getOrders(query);
    return apiClient
      .get<PaginatedResponse<RentalOrder>>("/rental-orders", { params: query })
      .then(responseData);
  },

  async getInvoices(query?: ListQuery): Promise<PaginatedResponse<Invoice>> {
    if (envConfig.useMockApi) return mockApi.getInvoices(query);
    return apiClient
      .get<PaginatedResponse<Invoice>>("/invoices", { params: query })
      .then(responseData);
  },

  async getPricelists(): Promise<ApiResponse<Pricelist[]>> {
    if (envConfig.useMockApi) return mockApi.getPricelists();
    return apiClient
      .get<ApiResponse<Pricelist[]>>("/pricelists")
      .then(responseData);
  },

  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    if (envConfig.useMockApi) return mockApi.getDashboardSummary();
    return apiClient
      .get<ApiResponse<DashboardSummary>>("/dashboard/summary")
      .then(responseData);
  },
};
