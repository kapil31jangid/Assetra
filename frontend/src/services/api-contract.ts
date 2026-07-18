import type {
  DashboardSummary,
  Invoice,
  IsoDate,
  IsoDateTime,
  Pricelist,
  Product,
  RentalOrder,
  RentalOrderStatus,
  Role,
  Session,
} from "../types";
import type { Id, RentalPeriod } from "../types";

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  requestId: string;
  generatedAt: IsoDateTime;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  error: ApiError;
  meta: ApiMeta;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface ProductListQuery extends ListQuery {
  categoryId?: Id;
  brand?: string;
  color?: string;
  rentalUnit?: RentalPeriod["unit"];
  availableFrom?: IsoDateTime;
  availableTo?: IsoDateTime;
  minPrice?: number;
  maxPrice?: number;
}

export interface RentalOrderListQuery extends ListQuery {
  status?: RentalOrderStatus | RentalOrderStatus[];
  customerId?: Id;
  productId?: Id;
  from?: IsoDate;
  to?: IsoDate;
}

export interface CreateRentalOrderRequest {
  customerId: Id;
  lines: Array<{
    productId: Id;
    variantId: Id;
    quantity: number;
    rentalPeriod: RentalPeriod;
  }>;
  schedule: RentalOrder["schedule"];
  pricelistId?: Id;
}

export interface UpdateRentalOrderStatusRequest {
  status: RentalOrderStatus;
  note?: string;
}

export interface RecordFulfillmentRequest {
  type: "pickup" | "return";
  occurredAt: IsoDateTime;
  checklist: RentalOrder["fulfillmentEvents"][number]["checklist"];
  notes?: string;
  photos?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ApiContract {
  session: {
    current: {
      method: "GET";
      path: "/api/v1/session";
      response: ApiResponse<Session>;
    };
    logout: {
      method: "POST";
      path: "/api/v1/session/logout";
      response: ApiResponse<null>;
    };
    login: {
      method: "POST";
      path: "/api/v1/session/login";
      body: LoginRequest;
      response: ApiResponse<Session>;
    };
    signup: {
      method: "POST";
      path: "/api/v1/session/signup";
      body: SignupRequest;
      response: ApiResponse<Session>;
    };
    forgotPassword: {
      method: "POST";
      path: "/api/v1/session/forgot-password";
      body: ForgotPasswordRequest;
      response: ApiResponse<{ message: string }>;
    };
  };
  products: {
    list: {
      method: "GET";
      path: "/api/v1/products";
      query: ProductListQuery;
      response: PaginatedResponse<Product>;
    };
    detail: {
      method: "GET";
      path: "/api/v1/products/:productId";
      response: ApiResponse<Product>;
    };
  };
  orders: {
    list: {
      method: "GET";
      path: "/api/v1/rental-orders";
      query: RentalOrderListQuery;
      response: PaginatedResponse<RentalOrder>;
    };
    detail: {
      method: "GET";
      path: "/api/v1/rental-orders/:orderId";
      response: ApiResponse<RentalOrder>;
    };
    create: {
      method: "POST";
      path: "/api/v1/rental-orders";
      body: CreateRentalOrderRequest;
      response: ApiResponse<RentalOrder>;
    };
    updateStatus: {
      method: "POST";
      path: "/api/v1/rental-orders/:orderId/status";
      body: UpdateRentalOrderStatusRequest;
      response: ApiResponse<RentalOrder>;
    };
    recordFulfillment: {
      method: "POST";
      path: "/api/v1/rental-orders/:orderId/fulfillment";
      body: RecordFulfillmentRequest;
      response: ApiResponse<RentalOrder>;
    };
  };
  invoices: {
    list: {
      method: "GET";
      path: "/api/v1/invoices";
      query: ListQuery;
      response: PaginatedResponse<Invoice>;
    };
    detail: {
      method: "GET";
      path: "/api/v1/invoices/:invoiceId";
      response: ApiResponse<Invoice>;
    };
  };
  pricing: {
    pricelists: {
      method: "GET";
      path: "/api/v1/pricelists";
      response: ApiResponse<Pricelist[]>;
    };
  };
  dashboard: {
    summary: {
      method: "GET";
      path: "/api/v1/dashboard/summary";
      query: { from: IsoDate; to: IsoDate };
      response: ApiResponse<DashboardSummary>;
    };
  };
}
