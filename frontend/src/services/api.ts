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
import type {
  DashboardSummary,
  Invoice,
  Pricelist,
  Product,
  ProductAttribute,
  RentalOrder,
  Session,
} from "../types";

export interface OrganizationSettings {
  companyName: string;
  currency: string;
  timezone: string;
  taxRate: number;
  gracePeriodMinutes: number;
  lateFeeUnit: string;
  lateFeeAmount: number;
  lateFeeMaximum?: number | null;
  depositRefundDays: number;
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: { amount: number; currency: string };
  provider: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  gstId?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

import type { ProductAttributeReference, RentalSettings, ProductDeposit } from "../types/domain";

export interface CreateProductRequest {
  name: string;
  image?: string;
  type: "goods" | "service";
  qtyOnHand?: number;
  salesPrice: number;
  costPrice: number;
  published: boolean;
  attributes: ProductAttributeReference[];
  rentalSettings: RentalSettings;
  deposit: ProductDeposit;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateCategoryRequest {
  name: string;
  slug: string;
}

export interface CreatePricelistRequest {
  name: string;
  isDefault: boolean;
  rules: any[]; // Using any for brevity here, or Omit<PricingRule, "id"> 
}

export type UpdatePricelistRequest = Partial<CreatePricelistRequest>;

const responseData = <T>(response: AxiosResponse<T>) => response.data;
const persistSession = <T extends ApiResponse<Session>>(response: T) => {
  window.localStorage.setItem("assetra.session", JSON.stringify(response));
  return response;
};

export const api = {
  async getSession(): Promise<ApiResponse<Session>> {
    return apiClient.get<ApiResponse<Session>>("/session").then(responseData).then(persistSession);
  },

  async login(request: LoginRequest): Promise<ApiResponse<Session>> {
    return apiClient
      .post<ApiResponse<Session>>("/session/login", request)
      .then(responseData).then(persistSession);
  },

  async signup(request: SignupRequest): Promise<ApiResponse<Session>> {
    return apiClient
      .post<ApiResponse<Session>>("/session/signup", request)
      .then(responseData).then(persistSession);
  },

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient
      .post<ApiResponse<{ message: string }>>(
        "/session/forgot-password",
        request,
      )
      .then(responseData);
  },

  async logout(): Promise<ApiResponse<null>> {
    window.localStorage.removeItem("assetra.session");
    return apiClient
      .post<ApiResponse<null>>("/session/logout")
      .then(responseData);
  },

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>("/categories").then(responseData);
  },

  async createCategory(request: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return apiClient.post<ApiResponse<Category>>("/categories", request).then(responseData);
  },

  async updateCategory(id: string, request: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return apiClient.put<ApiResponse<Category>>(`/categories/${id}`, request).then(responseData);
  },

  async deleteCategory(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/categories/${id}`).then(responseData);
  },

  // -------------------------------------------------------------------------
  // Attributes
  // -------------------------------------------------------------------------

  async getAttributes(): Promise<ApiResponse<ProductAttribute[]>> {
    return apiClient.get<ApiResponse<ProductAttribute[]>>("/attributes").then(responseData);
  },

  async createAttribute(request: Omit<ProductAttribute, "id">): Promise<ApiResponse<ProductAttribute>> {
    return apiClient.post<ApiResponse<ProductAttribute>>("/attributes", request).then(responseData);
  },

  async updateAttribute(id: string, request: Omit<ProductAttribute, "id">): Promise<ApiResponse<ProductAttribute>> {
    return apiClient.put<ApiResponse<ProductAttribute>>(`/attributes/${id}`, request).then(responseData);
  },

  async deleteAttribute(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/attributes/${id}`).then(responseData);
  },

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------

  async getProducts(
    query?: ProductListQuery & { includeInactive?: boolean },
  ): Promise<PaginatedResponse<Product>> {
    return apiClient
      .get<PaginatedResponse<Product>>("/products", { params: query })
      .then(responseData);
  },

  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    return apiClient
      .get<ApiResponse<Product>>(`/products/${productId}`)
      .then(responseData);
  },

  async createProduct(request: CreateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.post<ApiResponse<Product>>("/products", request).then(responseData);
  },

  async updateProduct(productId: string, request: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return apiClient.put<ApiResponse<Product>>(`/products/${productId}`, request).then(responseData);
  },

  async deleteProduct(productId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/products/${productId}`).then(responseData);
  },

  // -------------------------------------------------------------------------
  // Image upload
  // -------------------------------------------------------------------------

  async uploadImage(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post<ApiResponse<{ url: string; filename: string }>>("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(responseData);
  },

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------

  async getOrders(
    query?: RentalOrderListQuery,
  ): Promise<PaginatedResponse<RentalOrder>> {
    return apiClient
      .get<PaginatedResponse<RentalOrder>>("/rental-orders", { params: query })
      .then(responseData);
  },

  async getOrder(orderId: string): Promise<ApiResponse<RentalOrder>> {
    return apiClient
      .get<ApiResponse<RentalOrder>>(`/rental-orders/${orderId}`)
      .then(responseData);
  },

  async createOrder(
    request: CreateRentalOrderRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    return apiClient
      .post<ApiResponse<RentalOrder>>("/rental-orders", request)
      .then(responseData);
  },

  async updateOrderStatus(
    orderId: string,
    request: UpdateRentalOrderStatusRequest,
  ): Promise<ApiResponse<RentalOrder>> {
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
    return apiClient
      .post<ApiResponse<RentalOrder>>(
        `/rental-orders/${orderId}/fulfillment`,
        request,
      )
      .then(responseData);
  },

  async getInvoices(query?: ListQuery): Promise<PaginatedResponse<Invoice>> {
    return apiClient
      .get<PaginatedResponse<Invoice>>("/invoices", { params: query })
      .then(responseData);
  },

  async getPricelists(): Promise<ApiResponse<Pricelist[]>> {
    return apiClient
      .get<ApiResponse<Pricelist[]>>("/pricelists")
      .then(responseData);
  },

  async getPricelist(id: string): Promise<ApiResponse<Pricelist>> {
    return apiClient
      .get<ApiResponse<Pricelist>>(`/pricelists/${id}`)
      .then(responseData);
  },

  async createPricelist(request: CreatePricelistRequest): Promise<ApiResponse<Pricelist>> {
    return apiClient
      .post<ApiResponse<Pricelist>>("/pricelists", request)
      .then(responseData);
  },

  async updatePricelist(id: string, request: UpdatePricelistRequest): Promise<ApiResponse<Pricelist>> {
    return apiClient
      .put<ApiResponse<Pricelist>>(`/pricelists/${id}`, request)
      .then(responseData);
  },

  async deletePricelist(id: string): Promise<ApiResponse<void>> {
    return apiClient
      .delete<ApiResponse<void>>(`/pricelists/${id}`)
      .then(responseData);
  },

  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    return apiClient
      .get<ApiResponse<DashboardSummary>>("/dashboard/summary")
      .then(responseData);
  },

  async getUsers(query?: ListQuery): Promise<PaginatedResponse<UserProfile>> {
    return apiClient
      .get<PaginatedResponse<UserProfile>>("/users", { params: query })
      .then(responseData);
  },

  async getUser(id: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>>(`/users/${id}`).then(responseData);
  },

  async createUser(user: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.post<ApiResponse<UserProfile>>("/users", user).then(responseData);
  },

  async updateUser(id: string, user: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<ApiResponse<UserProfile>>(`/users/${id}`, user).then(responseData);
  },

  async getSettings(): Promise<ApiResponse<OrganizationSettings>> {
    return apiClient.get<ApiResponse<OrganizationSettings>>("/settings").then(responseData);
  },

  async updateSettings(settings: OrganizationSettings): Promise<ApiResponse<OrganizationSettings>> {
    return apiClient.put<ApiResponse<OrganizationSettings>>("/settings", settings).then(responseData);
  },

  async createPaymentIntent(orderId: string, idempotencyKey: string): Promise<ApiResponse<PaymentIntent>> {
    return apiClient.post<ApiResponse<PaymentIntent>>("/payments/intent", { orderId, idempotencyKey }).then(responseData);
  },

  async confirmPayment(paymentId: string): Promise<ApiResponse<{ id: string; status: string; reference: string }>> {
    return apiClient.post<ApiResponse<{ id: string; status: string; reference: string }>>("/payments/confirm", { paymentId }).then(responseData);
  },

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<ApiResponse<UserProfile>>("/session/me").then(responseData);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<ApiResponse<UserProfile>>("/session/me", profile).then(responseData);
  },
};
