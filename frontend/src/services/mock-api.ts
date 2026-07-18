import type {
  ApiResponse,
  ListQuery,
  PaginatedResponse,
  ProductListQuery,
  RentalOrderListQuery,
} from "./api-contract";
import {
  mockDashboard,
  mockInvoices,
  mockOrders,
  mockPricelists,
  mockProducts,
  mockSession,
} from "./mock-data";
import type {
  DashboardSummary,
  Invoice,
  Pricelist,
  Product,
  RentalOrder,
  Session,
} from "../types";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 180));

const meta = () => ({
  requestId: `mock_${crypto.randomUUID()}`,
  generatedAt: new Date().toISOString(),
});

const envelope = <T>(data: T): ApiResponse<T> => ({ data, meta: meta() });

const paginate = <T>(
  items: T[],
  query: ListQuery = {},
): PaginatedResponse<T> => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    data: paged,
    meta: meta(),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  };
};

export const mockApi = {
  async getSession(): Promise<ApiResponse<Session>> {
    await wait();
    return envelope(mockSession);
  },

  async getProducts(
    query?: ProductListQuery,
  ): Promise<PaginatedResponse<Product>> {
    await wait();
    const search = query?.search?.toLowerCase();
    const items = search
      ? mockProducts.filter((product) =>
          product.name.toLowerCase().includes(search),
        )
      : mockProducts;

    return paginate(items, query);
  },

  async getOrders(
    query?: RentalOrderListQuery,
  ): Promise<PaginatedResponse<RentalOrder>> {
    await wait();
    const statuses = Array.isArray(query?.status)
      ? query?.status
      : query?.status
        ? [query.status]
        : [];
    const items = statuses.length
      ? mockOrders.filter((order) => statuses.includes(order.status))
      : mockOrders;

    return paginate(items, query);
  },

  async getInvoices(query?: ListQuery): Promise<PaginatedResponse<Invoice>> {
    await wait();
    return paginate(mockInvoices, query);
  },

  async getPricelists(): Promise<ApiResponse<Pricelist[]>> {
    await wait();
    return envelope(mockPricelists);
  },

  async getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
    await wait();
    return envelope(mockDashboard);
  },
};
