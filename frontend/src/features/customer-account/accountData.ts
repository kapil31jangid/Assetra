import type { CheckoutOrder } from "../cart/cart";
import { readCheckoutOrders } from "../cart/orderStorage";

export interface CustomerOrderRow {
  id: string;
  number: string;
  status: "reserved" | "picked_up" | "returned";
  itemSummary: string;
  startsAt: string;
  endsAt: string;
  total: CheckoutOrder["totals"]["total"];
  createdAt: string;
  sourceOrder: CheckoutOrder;
}

export interface CustomerInvoiceRow {
  id: string;
  number: string;
  status: "posted" | "paid";
  issuedAt: string;
  dueAt: string;
  total: CheckoutOrder["totals"]["total"];
  orderNumber: string;
  sourceOrder: CheckoutOrder;
}

const seededOrder: CheckoutOrder = {
  id: "order_seed_1001",
  number: "ARO-1001",
  customerName: "Nisha Rao",
  email: "nisha@example.com",
  phone: "+91 98765 43210",
  fulfillmentMode: "store_pickup",
  items: [
    {
      id: "cart_seed_camera",
      productId: "prd_camera_01",
      productName: "Sony Alpha Camera Kit",
      variantId: "var_camera_35",
      variantName: "35mm Lens Kit",
      quantity: 1,
      rentalUnit: "daily",
      startsAt: "2026-07-20T10:00",
      endsAt: "2026-07-23T10:00",
      unitPrice: { amount: 2500, currency: "INR" },
      deposit: { amount: 15000, currency: "INR" },
    },
  ],
  totals: {
    rental: { amount: 7500, currency: "INR" },
    delivery: { amount: 0, currency: "INR" },
    discount: { amount: 0, currency: "INR" },
    deposit: { amount: 15000, currency: "INR" },
    tax: { amount: 1350, currency: "INR" },
    total: { amount: 23850, currency: "INR" },
  },
  createdAt: "2026-07-18T10:10:00+05:30",
};

export const getCustomerOrders = (): CustomerOrderRow[] =>
  [seededOrder, ...readCheckoutOrders()].map((order, index) => ({
    id: order.id,
    number: order.number,
    status: index === 0 ? "picked_up" : "reserved",
    itemSummary: order.items.map((item) => item.productName).join(", "),
    startsAt: order.items[0]?.startsAt ?? order.createdAt,
    endsAt: order.items[0]?.endsAt ?? order.createdAt,
    total: order.totals.total,
    createdAt: order.createdAt,
    sourceOrder: order,
  }));

export const getCustomerInvoices = (): CustomerInvoiceRow[] =>
  getCustomerOrders().map((order, index) => ({
    id: `invoice_${order.id}`,
    number: `INV-${order.number.replace("ARO-", "")}`,
    status: index === 0 ? "paid" : "posted",
    issuedAt: order.createdAt,
    dueAt: order.startsAt.slice(0, 10),
    total: order.total,
    orderNumber: order.number,
    sourceOrder: order.sourceOrder,
  }));
