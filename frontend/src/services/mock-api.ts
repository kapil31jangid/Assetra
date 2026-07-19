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
import { RENTAL_ORDER_STATUS_TRANSITIONS } from "../types";
import { getProductDailyRate } from "../utils/catalog";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 180));
const sessionStorageKey = "assetra.mock.session";
const ordersStorageKey = "assetra.mock.operations.orders";

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

const readOrders = (): RentalOrder[] => {
  const raw = window.localStorage.getItem(ordersStorageKey);
  if (!raw) return mockOrders;

  try {
    return JSON.parse(raw) as RentalOrder[];
  } catch {
    window.localStorage.removeItem(ordersStorageKey);
    return mockOrders;
  }
};

const writeOrders = (orders: RentalOrder[]) => {
  window.localStorage.setItem(ordersStorageKey, JSON.stringify(orders));
};

const updateOrder = (
  orderId: string,
  updater: (order: RentalOrder) => RentalOrder,
) => {
  const orders = readOrders();
  const next = orders.map((order) =>
    order.id === orderId ? updater(order) : order,
  );
  writeOrders(next);
  const updated = next.find((order) => order.id === orderId);

  if (!updated) throw new Error("Rental order could not be found.");
  return updated;
};

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
    const search = query?.search?.toLowerCase();
    const orders = readOrders();
    const items = orders.filter((order) => {
      const matchesStatus = statuses.length
        ? statuses.includes(order.status)
        : true;
      const matchesSearch = search
        ? [
            order.number,
            order.customer.name,
            order.customer.email,
            ...order.lines.map((line) => line.productName),
          ].some((value) => String(value ?? "").toLowerCase().includes(search))
        : true;
      const matchesCustomer = query?.customerId
        ? order.customer.id === query.customerId
        : true;
      const matchesProduct = query?.productId
        ? order.lines.some((line) => line.productId === query.productId)
        : true;

      return (
        matchesStatus && matchesSearch && matchesCustomer && matchesProduct
      );
    });

    return paginate(items, query);
  },

  async getOrder(orderId: string): Promise<ApiResponse<RentalOrder>> {
    await wait();
    const order = readOrders().find((item) => item.id === orderId);
    if (!order) throw new Error("Rental order could not be found.");
    return envelope(order);
  },

  async createOrder(
    request: CreateRentalOrderRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    await wait();
    const firstLine = request.lines[0];
    const product = mockProducts.find((item) => item.id === firstLine.productId);
    const variant = product?.variants.find(
      (item: any) => item.id === firstLine.variantId,
    );
    const unitPrice = product ? getProductDailyRate(product) : { amount: 0, currency: "INR" as const };
    const rentalAmount =
      unitPrice.amount * firstLine.quantity * firstLine.rentalPeriod.quantity;
    const depositAmount = product?.depositPolicy.amount.amount ?? 0;
    const now = new Date().toISOString();
    const order: RentalOrder = {
      id: `ord_${crypto.randomUUID()}`,
      number: `RO-${Date.now().toString().slice(-5)}`,
      customer: {
        id: request.customerId,
        name: "Walk-in Customer",
        email: "customer@example.com",
      },
      vendorId: "ven_01",
      status: "quotation",
      lines: [
        {
          id: `line_${crypto.randomUUID()}`,
          productId: firstLine.productId,
          variantId: firstLine.variantId,
          productName: product?.name ?? "Rental product",
          variantName: variant?.name ?? "Default",
          sku: variant?.sku ?? "NEW-SKU",
          quantity: firstLine.quantity,
          rentalPeriod: firstLine.rentalPeriod,
          unitPrice,
          lineTotal: { ...unitPrice, amount: rentalAmount },
          accessories: product?.accessories ?? [],
        },
      ],
      schedule: request.schedule,
      price: {
        rental: { ...unitPrice, amount: rentalAmount },
        delivery: { ...unitPrice, amount: 0 },
        discount: { ...unitPrice, amount: 0 },
        deposit: { ...unitPrice, amount: depositAmount },
        tax: { ...unitPrice, amount: Math.round(rentalAmount * 0.18) },
        total: {
          ...unitPrice,
          amount: rentalAmount + depositAmount + Math.round(rentalAmount * 0.18),
        },
      },
      deposit: product?.depositPolicy ?? {
        required: false,
        amount: { amount: 0, currency: "INR" },
        refundable: true,
      },
      depositTransactions: [],
      lateFees: [],
      damageReports: [],
      fulfillmentEvents: [],
      invoiceIds: [],
      createdAt: now,
      updatedAt: now,
    };
    writeOrders([order, ...readOrders()]);
    return envelope(order);
  },

  async updateOrderStatus(
    orderId: string,
    request: UpdateRentalOrderStatusRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    await wait();
    const order = updateOrder(orderId, (current) => {
      const allowed = RENTAL_ORDER_STATUS_TRANSITIONS[current.status];
      if (!allowed.includes(request.status) && current.status !== request.status) {
        throw new Error("This status transition is not allowed.");
      }

      return {
        ...current,
        status: request.status,
        updatedAt: new Date().toISOString(),
      };
    });
    return envelope(order);
  },

  async recordFulfillment(
    orderId: string,
    request: RecordFulfillmentRequest,
  ): Promise<ApiResponse<RentalOrder>> {
    await wait();
    const session = readStoredSession();
    const occurredAt = request.occurredAt || new Date().toISOString();
    const order = updateOrder(orderId, (current) => {
      const isPickup = request.type === "pickup";
      const scheduledAt = isPickup
        ? current.schedule.scheduledPickupAt
        : current.schedule.scheduledReturnAt;
      const minutesLate = Math.max(
        0,
        Math.round(
          (new Date(occurredAt).getTime() - new Date(scheduledAt).getTime()) /
            60000 -
            current.schedule.gracePeriodMinutes,
        ),
      );
      const lateFee =
        minutesLate > 0
          ? {
              id: `late_${crypto.randomUUID()}`,
              reason: isPickup ? "late_pickup" as const : "late_return" as const,
              minutesLate,
              amount: {
                ...current.price.rental,
                amount: Math.ceil(minutesLate / 60) * 250,
              },
              calculatedAt: occurredAt,
              waived: false,
            }
          : null;
      const damagedItems = request.checklist.filter(
        (item) => item.condition === "damaged" || item.condition === "missing",
      );
      const damageReports = damagedItems.map((item) => ({
        id: `damage_${crypto.randomUUID()}`,
        productId: current.lines[0]?.productId ?? "unknown",
        description: `${item.label}: ${item.condition}`,
        amount: { ...current.price.rental, amount: 500 },
        reportedAt: occurredAt,
        resolved: false,
      }));

      return {
        ...current,
        status: isPickup ? "picked_up" : "returned",
        schedule: {
          ...current.schedule,
          actualPickupAt: isPickup ? occurredAt : current.schedule.actualPickupAt,
          actualReturnAt: isPickup ? current.schedule.actualReturnAt : occurredAt,
        },
        lateFees: lateFee ? [...current.lateFees, lateFee] : current.lateFees,
        damageReports: [...current.damageReports, ...damageReports],
        depositTransactions: [
          ...current.depositTransactions,
          {
            id: `dep_${crypto.randomUUID()}`,
            type: isPickup ? "hold" : damageReports.length ? "penalty" : "refund",
            amount: isPickup
              ? current.deposit.amount
              : damageReports.length
                ? { ...current.deposit.amount, amount: damageReports.length * 500 }
                : current.deposit.amount,
            occurredAt,
            reason: isPickup
              ? "Security deposit hold"
              : damageReports.length
                ? "Damage or missing accessory penalty"
                : "Security deposit refund ready",
          },
        ],
        fulfillmentEvents: [
          ...current.fulfillmentEvents,
          {
            id: `ful_${crypto.randomUUID()}`,
            type: request.type,
            occurredAt,
            recordedBy: session?.user ?? mockUsers.admin,
            checklist: request.checklist,
            notes: request.notes,
            photos: request.photos,
          },
        ],
        updatedAt: occurredAt,
      };
    });
    return envelope(order);
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
    const orders = readOrders();
    const orderStatusCounts = orders.reduce<DashboardSummary["orderStatusCounts"]>(
      (counts, order) => ({
        ...counts,
        [order.status]: (counts[order.status] ?? 0) + 1,
      }),
      {},
    );

    return envelope({
      ...mockDashboard,
      orderStatusCounts,
      upcomingPickups: orders.filter((order) =>
        ["reserved", "late_pickup"].includes(order.status),
      ),
      upcomingReturns: orders.filter((order) =>
        ["picked_up", "late_return"].includes(order.status),
      ),
    });
  },
};
