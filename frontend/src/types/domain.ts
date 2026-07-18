/**
 * Phase 0 domain contract.
 *
 * These types describe the frontend-facing model. Backend adapters should map
 * transport-specific responses to these shapes before they reach a feature.
 */

export type Id = string;
export type IsoDate = string;
export type IsoDateTime = string;

export const ROLES = ["admin", "vendor", "customer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "portal.view",
  "portal.catalog.read",
  "portal.cart.manage",
  "portal.checkout.create",
  "portal.orders.read",
  "portal.wishlist.manage",
  "account.profile.manage",
  "dashboard.read",
  "orders.read",
  "orders.create",
  "orders.update",
  "orders.transition",
  "products.read",
  "products.manage",
  "pricing.read",
  "pricing.manage",
  "schedule.read",
  "fulfillment.process",
  "invoices.read",
  "invoices.manage",
  "quotations.read",
  "quotations.manage",
  "reports.read",
  "settings.read",
  "settings.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: PERMISSIONS,
  vendor: [
    "dashboard.read",
    "orders.read",
    "orders.create",
    "orders.update",
    "orders.transition",
    "products.read",
    "products.manage",
    "pricing.read",
    "pricing.manage",
    "schedule.read",
    "fulfillment.process",
    "invoices.read",
    "invoices.manage",
    "quotations.read",
    "quotations.manage",
    "reports.read",
    "settings.read",
  ],
  customer: [
    "portal.view",
    "portal.catalog.read",
    "portal.cart.manage",
    "portal.checkout.create",
    "portal.orders.read",
    "portal.wishlist.manage",
    "account.profile.manage",
  ],
};

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Address {
  id?: Id;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
}

export interface UserSummary {
  id: Id;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
}

export interface CustomerSummary {
  id: Id;
  name: string;
  email: string;
  phone?: string;
}

export interface Session {
  user: UserSummary;
  expiresAt: IsoDateTime;
}

export const RENTAL_PERIOD_UNITS = [
  "hourly",
  "daily",
  "nightly",
  "weekly",
  "monthly",
] as const;
export type RentalPeriodUnit = (typeof RENTAL_PERIOD_UNITS)[number];

export type ProductRepairStatus =
  "ready" | "maintenance" | "repair" | "retired";
export type ProductAvailabilityStatus =
  "available" | "partially_available" | "unavailable" | "maintenance";

export interface ProductCategory {
  id: Id;
  name: string;
  slug: string;
}

export interface ProductAttributeValue {
  id: Id;
  label: string;
  value?: string;
  colorHex?: string;
}

export type ProductAttributeDisplayType = "select" | "color" | "text";

export interface ProductAttribute {
  id: Id;
  name: string;
  displayType: ProductAttributeDisplayType;
  values: ProductAttributeValue[];
}

export interface StockSummary {
  total: number;
  available: number;
  reserved: number;
  inUse: number;
  underRepair: number;
}

export interface ProductVariant {
  id: Id;
  productId: Id;
  name: string;
  sku: string;
  attributeValueIds: Id[];
  repairStatus: ProductRepairStatus;
  stock: StockSummary;
  imageUrl?: string;
}

export interface Accessory {
  id: Id;
  name: string;
  quantityRequired: number;
  quantityAvailable: number;
  included: boolean;
}

export interface DepositPolicy {
  required: boolean;
  amount: Money;
  refundable: boolean;
  refundWindowDays?: number;
}

export interface AvailabilityWindow {
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  quantityAvailable: number;
  status: ProductAvailabilityStatus;
}

export interface Product {
  id: Id;
  name: string;
  slug: string;
  description?: string;
  category: ProductCategory;
  brand?: string;
  colors?: string[];
  tags: string[];
  imageUrls: string[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  accessories: Accessory[];
  depositPolicy: DepositPolicy;
  repairStatus: ProductRepairStatus;
  stock: StockSummary;
  availabilityStatus: ProductAvailabilityStatus;
  availability?: AvailabilityWindow[];
  rentalUnits: RentalPeriodUnit[];
  active: boolean;
}

export type PricingRuleKind = "fixed_price" | "discount";

export interface PricingRule {
  id: Id;
  periodUnit: RentalPeriodUnit;
  kind: PricingRuleKind;
  fixedPrice?: Money;
  discountPercent?: number;
  minimumQuantity: number;
  validFrom?: IsoDate;
  validTo?: IsoDate;
  selectable: boolean;
}

export interface Pricelist {
  id: Id;
  name: string;
  currency: CurrencyCode;
  selectable: boolean;
  active: boolean;
  rules: PricingRule[];
}

export interface RentalPeriod {
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  unit: RentalPeriodUnit;
  quantity: number;
  timezone: string;
}

export interface PriceBreakdown {
  rental: Money;
  delivery: Money;
  discount: Money;
  deposit: Money;
  tax: Money;
  total: Money;
}

export type RentalOrderStatus =
  | "draft"
  | "quotation"
  | "quotation_sent"
  | "confirmed"
  | "invoiced"
  | "reserved"
  | "picked_up"
  | "late_pickup"
  | "late_return"
  | "returned"
  | "cancelled";

export const RENTAL_ORDER_STATUS_LABELS: Readonly<
  Record<RentalOrderStatus, string>
> = {
  draft: "Draft",
  quotation: "Quotation",
  quotation_sent: "Quotation Sent",
  confirmed: "Confirmed",
  invoiced: "Invoiced",
  reserved: "Reserved",
  picked_up: "Picked Up",
  late_pickup: "Late Pickup",
  late_return: "Late Return",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const RENTAL_ORDER_STATUS_TRANSITIONS: Readonly<
  Record<RentalOrderStatus, readonly RentalOrderStatus[]>
> = {
  draft: ["quotation", "cancelled"],
  quotation: ["quotation_sent", "confirmed", "cancelled"],
  quotation_sent: ["confirmed", "cancelled"],
  confirmed: ["invoiced", "reserved", "cancelled"],
  invoiced: ["reserved", "cancelled"],
  reserved: ["picked_up", "late_pickup", "cancelled"],
  picked_up: ["late_return", "returned"],
  late_pickup: ["picked_up", "cancelled"],
  late_return: ["returned"],
  returned: [],
  cancelled: [],
};

export interface RentalOrderLine {
  id: Id;
  productId: Id;
  variantId: Id;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  rentalPeriod: RentalPeriod;
  unitPrice: Money;
  lineTotal: Money;
  accessories: Accessory[];
}

export type FulfillmentMode = "delivery" | "store_pickup";

export interface PickupReturnSchedule {
  mode: FulfillmentMode;
  pickupLocation?: Address;
  deliveryAddress?: Address;
  scheduledPickupAt: IsoDateTime;
  scheduledReturnAt: IsoDateTime;
  actualPickupAt?: IsoDateTime;
  actualReturnAt?: IsoDateTime;
  gracePeriodMinutes: number;
}

export type FulfillmentEventType = "pickup" | "return";

export interface ChecklistItem {
  id: Id;
  label: string;
  expectedQuantity: number;
  receivedQuantity?: number;
  condition?: "good" | "damaged" | "missing";
  notes?: string;
}

export interface FulfillmentEvent {
  id: Id;
  type: FulfillmentEventType;
  occurredAt: IsoDateTime;
  recordedBy: UserSummary;
  checklist: ChecklistItem[];
  notes?: string;
  photos?: string[];
}

export interface DamageReport {
  id: Id;
  productId: Id;
  description: string;
  amount: Money;
  reportedAt: IsoDateTime;
  resolved: boolean;
}

export type DepositTransactionType = "hold" | "refund" | "penalty";

export interface DepositTransaction {
  id: Id;
  type: DepositTransactionType;
  amount: Money;
  occurredAt: IsoDateTime;
  reason?: string;
}

export interface LateFee {
  id: Id;
  reason: "late_pickup" | "late_return";
  minutesLate: number;
  amount: Money;
  calculatedAt: IsoDateTime;
  waived: boolean;
}

export interface RentalOrder {
  id: Id;
  number: string;
  customer: CustomerSummary;
  vendorId?: Id;
  status: RentalOrderStatus;
  lines: RentalOrderLine[];
  schedule: PickupReturnSchedule;
  price: PriceBreakdown;
  deposit: DepositPolicy;
  depositTransactions: DepositTransaction[];
  lateFees: LateFee[];
  damageReports: DamageReport[];
  fulfillmentEvents: FulfillmentEvent[];
  invoiceIds: Id[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export type InvoiceStatus = "draft" | "posted" | "paid" | "cancelled";

export interface InvoiceLine {
  id: Id;
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface Invoice {
  id: Id;
  number: string;
  orderId?: Id;
  customer: CustomerSummary;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  subtotal: Money;
  tax: Money;
  total: Money;
  dueAt?: IsoDate;
  issuedAt?: IsoDateTime;
  createdAt: IsoDateTime;
}

export interface DashboardKpi {
  key:
    | "revenue"
    | "active_rentals"
    | "pending_orders"
    | "overdue_returns"
    | "utilization"
    | "deposit_held";
  label: string;
  value: number;
  formattedValue: string;
  currency?: CurrencyCode;
  changePercent?: number;
  trend?: "up" | "down" | "flat";
}

export interface DashboardSummary {
  period: { from: IsoDate; to: IsoDate };
  kpis: DashboardKpi[];
  orderStatusCounts: Partial<Record<RentalOrderStatus, number>>;
  upcomingPickups: RentalOrder[];
  upcomingReturns: RentalOrder[];
}
