import type {
  ApiResponse,
  ForgotPasswordRequest,
  ListQuery,
  LoginRequest,
  PaginatedResponse,
  ProductListQuery,
  RentalOrderListQuery,
  SignupRequest,
} from "./api-contract";
import {
  mockDashboard,
  mockInvoices,
  mockOrders,
  mockPricelists,
  mockProducts,
  mockUsers,
} from "./mock-data";
import type {
  DashboardSummary,
  Invoice,
  Pricelist,
  Product,
  RentalOrder,
  Session,
  UserSummary,
} from "../types";
import { getProductDailyRate } from "../utils/catalog";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 180));
const sessionStorageKey = "assetra.mock.session";

const meta = () => ({
  requestId: `mock_${crypto.randomUUID()}`,
  generatedAt: new Date().toISOString(),
});

const envelope = <T>(data: T): ApiResponse<T> => ({ data, meta: meta() });

const buildSession = (user: UserSummary): Session => ({
  user,
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
});

const readStoredSession = (): Session | null => {
  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Session;
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
};

const persistSession = (session: Session) => {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
};

const findMockUser = (email: string) =>
  Object.values(mockUsers).find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );

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
    const session = readStoredSession();

    if (!session) {
      throw new Error("No active session");
    }

    return envelope(session);
  },

  async login(request: LoginRequest): Promise<ApiResponse<Session>> {
    await wait();

    if (request.password.length < 6) {
      throw new Error("Use any password with at least 6 characters.");
    }

    const user = findMockUser(request.email);

    if (!user) {
      throw new Error(
        "Use admin@assetra.local, vendor@assetra.local, or nisha@example.com.",
      );
    }

    const session = buildSession(user);
    persistSession(session);

    return envelope(session);
  },

  async signup(request: SignupRequest): Promise<ApiResponse<Session>> {
    await wait();

    const session = buildSession({
      id: `usr_${crypto.randomUUID()}`,
      name: request.name,
      email: request.email,
      role: request.role,
    });
    persistSession(session);

    return envelope(session);
  },

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    await wait();
    return envelope({
      message: `Password reset instructions were sent to ${request.email}.`,
    });
  },

  async logout(): Promise<ApiResponse<null>> {
    await wait();
    window.localStorage.removeItem(sessionStorageKey);
    return envelope(null);
  },

  async getProducts(
    query?: ProductListQuery,
  ): Promise<PaginatedResponse<Product>> {
    await wait();
    const search = query?.search?.toLowerCase();
    const items = mockProducts.filter((product) => {
      const dailyRate = getProductDailyRate(product).amount;
      const matchesSearch = search
        ? [product.name, product.description, product.brand, ...product.tags]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(search))
        : true;
      const matchesCategory = query?.categoryId
        ? product.category.id === query.categoryId
        : true;
      const matchesBrand = query?.brand ? product.brand === query.brand : true;
      const matchesColor = query?.color
        ? product.colors?.includes(query.color)
        : true;
      const matchesUnit = query?.rentalUnit
        ? product.rentalUnits.includes(query.rentalUnit)
        : true;
      const matchesMinPrice =
        query?.minPrice === undefined || dailyRate >= query.minPrice;
      const matchesMaxPrice =
        query?.maxPrice === undefined || dailyRate <= query.maxPrice;
      const matchesAvailability =
        !query?.availableFrom ||
        !query?.availableTo ||
        product.availabilityStatus !== "unavailable";

      return (
        product.active &&
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesColor &&
        matchesUnit &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesAvailability
      );
    });

    return paginate(items, query);
  },

  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    await wait();
    const product = mockProducts.find(
      (item) => item.id === productId || item.slug === productId,
    );

    if (!product) {
      throw new Error("Product could not be found.");
    }

    return envelope(product);
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
