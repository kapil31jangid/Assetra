import type {
  DashboardSummary,
  Invoice,
  Money,
  Pricelist,
  Product,
  RentalOrder,
  Session,
  UserSummary,
} from "../types";

const inr = (amount: number): Money => ({ amount, currency: "INR" });

export const mockUsers: Record<string, UserSummary> = {
  admin: {
    id: "usr_admin",
    name: "Aarav Mehta",
    email: "admin@assetra.local",
    role: "admin",
  },
  customer: {
    id: "usr_customer",
    name: "Nisha Rao",
    email: "nisha@example.com",
    role: "customer",
  },
  vendor: {
    id: "usr_vendor",
    name: "Kabir Sethi",
    email: "vendor@assetra.local",
    role: "vendor",
  },
};

export const mockSession: Session = {
  user: mockUsers.admin,
  expiresAt: "2026-07-19T18:00:00+05:30",
};


export const mockOrders: RentalOrder[] = [
  {
    id: "ord_1001",
    number: "RO-1001",
    customer: {
      id: "cus_01",
      name: "Nisha Rao",
      email: "nisha@example.com",
      phone: "+91 98765 43210",
    },
    vendorId: "ven_01",
    status: "reserved",
    lines: [
      {
        id: "line_1001_1",
        productId: "prd_camera_01",
        variantId: "var_camera_35",
        productName: "Sony Alpha Camera Kit",
        variantName: "35mm Lens Kit",
        sku: "CAM-SONY-A7-35",
        quantity: 1,
        rentalPeriod: {
          startsAt: "2026-07-20T10:00:00+05:30",
          endsAt: "2026-07-23T10:00:00+05:30",
          unit: "daily",
          quantity: 3,
          timezone: "Asia/Kolkata",
        },
        unitPrice: inr(2500),
        lineTotal: inr(7500),
        accessories: [],
      },
    ],
    schedule: {
      mode: "store_pickup",
      scheduledPickupAt: "2026-07-20T10:00:00+05:30",
      scheduledReturnAt: "2026-07-23T10:00:00+05:30",
      gracePeriodMinutes: 30,
    },
    price: {
      rental: inr(7500),
      delivery: inr(0),
      discount: inr(0),
      deposit: inr(15000),
      tax: inr(1350),
      total: inr(23850),
    },
    deposit: {
      required: true,
      amount: inr(15000),
      refundable: true,
      refundWindowDays: 3,
    },
    depositTransactions: [],
    lateFees: [],
    damageReports: [],
    fulfillmentEvents: [],
    invoiceIds: ["inv_1001"],
    createdAt: "2026-07-18T09:30:00+05:30",
    updatedAt: "2026-07-18T10:05:00+05:30",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv_1001",
    number: "INV-1001",
    orderId: "ord_1001",
    customer: { id: "cus_01", name: "Nisha Rao", email: "nisha@example.com" },
    status: "posted",
    lines: [
      {
        id: "inv_line_1001",
        description: "Sony Alpha Camera Kit rental",
        quantity: 3,
        unitPrice: inr(2500),
        total: inr(7500),
      },
    ],
    subtotal: inr(7500),
    tax: inr(1350),
    total: inr(8850),
    dueAt: "2026-07-20",
    issuedAt: "2026-07-18T10:10:00+05:30",
    createdAt: "2026-07-18T10:10:00+05:30",
  },
];

export const mockPricelists: Pricelist[] = [
  {
    id: "pl_standard",
    name: "Standard Rental",
    currency: "INR",
    selectable: true,
    active: true,
    rules: [
      {
        id: "rule_daily",
        periodUnit: "daily",
        kind: "fixed_price",
        fixedPrice: inr(2500),
        minimumQuantity: 1,
        selectable: true,
      },
    ],
  },
];

export const mockDashboard: DashboardSummary = {
  period: { from: "2026-07-01", to: "2026-07-31" },
  kpis: [
    {
      key: "revenue",
      label: "Revenue",
      value: 284000,
      formattedValue: "Rs. 2.84L",
      currency: "INR",
      changePercent: 12,
      trend: "up",
    },
    {
      key: "active_rentals",
      label: "Active Rentals",
      value: 42,
      formattedValue: "42",
      changePercent: 4,
      trend: "up",
    },
    {
      key: "pending_orders",
      label: "Pending Orders",
      value: 11,
      formattedValue: "11",
      changePercent: -3,
      trend: "down",
    },
    {
      key: "overdue_returns",
      label: "Overdue Returns",
      value: 3,
      formattedValue: "3",
      changePercent: 0,
      trend: "flat",
    },
  ],
  orderStatusCounts: {
    quotation: 8,
    confirmed: 14,
    reserved: 17,
    picked_up: 22,
    late_return: 3,
  },
  upcomingPickups: mockOrders,
  upcomingReturns: mockOrders,
};
export const mockProducts: Product[] = [];
