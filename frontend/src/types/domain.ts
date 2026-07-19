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
  accessToken?: string;
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
  value: string;
  extraPrice?: number;
}

export type ProductAttributeDisplayType = "radio" | "pills" | "checkbox" | "image";

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

export interface ProductAttributeReference {
  attributeId: Id;
  valueIds: Id[];
}

export interface RentalSettings {
  periodicity: "hours" | "day" | "week" | "monthly";
  pickupTime?: string; // e.g. "10:00"
  returnTime?: string; // e.g. "19:00"
  lateFee?: number;
  gracePeriod?: string; // e.g. "2:00"
}

export interface ProductDeposit {
  required: boolean;
  amount?: number;
}

export interface Product {
  /** Compatibility fields used by the catalog/operations screens while API payloads are normalized. */
  [key: string]: any;
  id: Id;
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

export type PricingRuleKind = "discount" | "fixed";

export interface PricingRule {
  id: Id;
  appliesTo: "all" | Id[];
  priceType: PricingRuleKind;
  value: number;
  minQty: number;
  validityStart?: string;
  validityEnd?: string;
  selectable: boolean;
}

export interface Pricelist {
  id: Id;
  name: string;
  isDefault: boolean;
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
  | "sale_order"
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
  sale_order: "Sale Order",
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
  quotation: ["quotation_sent", "sale_order", "confirmed", "cancelled"],
  quotation_sent: ["sale_order", "confirmed", "cancelled"],
  sale_order: ["invoiced", "reserved", "cancelled"],
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
  /** Compatibility fields for the legacy operations forms. */
  [key: string]: any;
  id: Id;
  productId: Id;
  variantId?: Id;
  productName?: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  rentalPeriod?: RentalPeriod;
  unitPrice: Money;
  lineTotal: Money;
  accessories?: Accessory[];
  unit?: string;
  taxPercent?: number;
  isNote?: boolean;
  noteText?: string;
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
  [key: string]: any;
  id: Id;
  number: string;
  ref?: string;
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
  invoiceAddress?: string;
  deliveryAddress?: string;
  rentalStart?: string;
  rentalEnd?: string;
  pricelistId?: Id;
  quotationTemplateId?: Id;
  untaxedAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  pickup?: {
    confirmed_at: string;
    checklist: Record<string, boolean>;
    notes?: string;
  };
  return_data?: {
    confirmed_at?: string;
    actual_return_at: string;
    product_conditions: Array<{ product_id: string; condition: "Good" | "Damaged" | "Missing"; notes?: string }>;
    late_fee_applied: boolean;
    late_fee_amount: number;
    deposit_refund_amount: number;
    additional_due: number;
  };
}

export type InvoiceStatus = "draft" | "posted" | "cancelled";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export interface InvoiceLine {
  id?: Id;
  product_id?: Id;
  description?: string;
  qty: number;
  unit?: string;
  unit_price: number;
  tax_percent: number;
  amount: number;
}

export interface InvoicePayment {
  amount: number;
  method: string;
  date: string;
}

export interface Invoice {
  id: Id;
  invoice_number?: string;
  number?: string;
  order_id?: Id;
  customer_id?: Id;
  customer?: CustomerSummary;
  invoice_date?: string;
  invoice_address?: string;
  delivery_address?: string;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  lines: InvoiceLine[];
  untaxed_amount: number;
  tax_amount: number;
  total: number;
  payments: InvoicePayment[];
  dueAt?: IsoDate;
  issuedAt?: IsoDateTime;
  createdAt?: IsoDateTime;
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

export interface QuotationTemplateLine {
  productId: Id;
  quantity: number;
  unit: string;
}

export interface QuotationTemplate {
  id: Id;
  name: string;
  validityDays: number;
  paymentTermsPercent: number;
  lines: QuotationTemplateLine[];
  header?: string;
  footer?: string;
}
