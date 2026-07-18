import type { AxiosResponse } from "axios";

import { apiClient } from "./api-client";
import type {
  ApiResponse,
  CreateRentalOrderRequest,
  ForgotPasswordRequest,
  ListQuery,
  LoginRequest,
  PaginatedResponse,
  ProductListQuery,
  RecordFulfillmentRequest,
  RentalOrderListQuery,
  SignupRequest,
  UpdateRentalOrderStatusRequest,
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

  async login(request: LoginRequest): Promise<ApiResponse<Session>> {
    if (envConfig.useMockApi) return mockApi.login(request);
    return apiClient
      .post<ApiResponse<Session>>("/session/login", request)
      .then(responseData);
  },

  async signup(request: SignupRequest): Promise<ApiResponse<Session>> {
    if (envConfig.useMockApi) return mockApi.signup(request);
    return apiClient
      .post<ApiResponse<Session>>("/session/signup", request)
      .then(responseData);
  },

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    if (envConfig.useMockApi) return mockApi.forgotPassword(request);
    return apiClient
      .post<ApiResponse<{ message: string }>>(
        "/session/forgot-password",
        request,
      )
      .then(responseData);
  },

  async logout(): Promise<ApiResponse<null>> {
    if (envConfig.useMockApi) return mockApi.logout();
    return apiClient
      .post<ApiResponse<null>>("/session/logout")
      .then(responseData);
  },

  async getProducts(
    query?: ProductListQuery,
  ): Promise<PaginatedResponse<Product>> {
    if (envConfig.useMockApi) return mockApi.getProducts(query);
    return apiClient
      .get<PaginatedResponse<Product>>("/products", { params: query })
      .then(responseData);
  },

  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    if (envConfig.useMockApi) return mockApi.getProduct(productId);
    return apiClient
      .get<ApiResponse<Product>>(`/products/${productId}`)
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

  async getOrder(orderId: string): Promise<ApiResponse<RentalOrder>> {
    if (envConfig.useMockApi) return mockApi.getOrder(orderId);
    return apiClient
      .get<ApiResponse<RentalOrder>>(`/rental-orders/${orderId}`)
      .then(responseData);
  },

  async createOrder(
    request: CreateRentalOrderRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    if (envConfig.useMockApi) return mockApi.createOrder(request);
    return apiClient
      .post<ApiResponse<RentalOrder>>("/rental-orders", request)
      .then(responseData);
  },

  async updateOrderStatus(
    orderId: string,
    request: UpdateRentalOrderStatusRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    if (envConfig.useMockApi) return mockApi.updateOrderStatus(orderId, request);
    return apiClient
      .post<ApiResponse<RentalOrder>>(
        `/rental-orders/${orderId}/status`,
        request,
      )
      .then(responseData);
  },

  async recordFulfillment(
    orderId: string,
    request: RecordFulfillmentRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    if (envConfig.useMockApi) return mockApi.recordFulfillment(orderId, request);
    return apiClient
      .post<ApiResponse<RentalOrder>>(
        `/rental-orders/${orderId}/fulfillment`,
        request,
      )
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
