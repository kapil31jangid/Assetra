import dayjs from "dayjs";

import type { RentalOrder } from "../types";

export type AnalyticsPeriod = "this_week" | "this_month" | "this_quarter" | "custom" | "all";

export const amountOf = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value && typeof value === "object" && "amount" in value) return amountOf((value as { amount: unknown }).amount);
  return Number(value) || 0;
};

export const orderStart = (order: RentalOrder) =>
  order.schedule?.scheduledPickupAt ?? order.rentalStart ?? order.createdAt;

export const orderEnd = (order: RentalOrder) =>
  order.schedule?.scheduledReturnAt ?? order.rentalEnd ?? order.createdAt;

export const orderRevenue = (order: RentalOrder) =>
  amountOf(order.price?.rental) || amountOf(order.price?.total) || amountOf(order.totalAmount);

export const orderDeposit = (order: RentalOrder) =>
  amountOf(order.price?.deposit) || amountOf(order.deposit?.amount);

export const orderLateFees = (order: RentalOrder) =>
  (order.lateFees ?? []).reduce((total, fee) => total + amountOf(fee.amount), 0) +
  amountOf(order.return_data?.late_fee_amount);

export function periodStart(period: AnalyticsPeriod, from?: string) {
  const today = dayjs().startOf("day");
  if (period === "this_week") return today.startOf("week");
  if (period === "this_month") return today.startOf("month");
  if (period === "this_quarter") return today.startOf("month").subtract(today.month() % 3, "month");
  return from ? dayjs(from).startOf("day") : undefined;
}

export function periodEnd(period: AnalyticsPeriod, to?: string) {
  if (period === "custom") return to ? dayjs(to).endOf("day") : undefined;
  return period === "all" ? undefined : dayjs().endOf("day");
}

export function filterOrders(
  orders: RentalOrder[],
  filters: { period: AnalyticsPeriod; from?: string; to?: string; statuses?: string[]; customerId?: string; search?: string },
) {
  const start = periodStart(filters.period, filters.from);
  const end = periodEnd(filters.period, filters.to);
  const search = filters.search?.trim().toLowerCase();

  return orders.filter((order) => {
    const date = dayjs(orderStart(order));
    const inPeriod = date.isValid() && (!start || !date.isBefore(start)) && (!end || !date.isAfter(end));
    const statusMatch = !filters.statuses?.length || filters.statuses.some((status) =>
      status === "late" ? ["late_pickup", "late_return"].includes(order.status) : order.status === status,
    );
    const customerMatch = !filters.customerId || order.customer?.id === filters.customerId;
    const haystack = `${order.number} ${order.ref ?? ""} ${order.customer?.name ?? ""}`.toLowerCase();
    return inPeriod && statusMatch && customerMatch && (!search || haystack.includes(search));
  });
}

export const groupBy = <T>(items: T[], key: (item: T) => string, value: (item: T) => number) => {
  const totals = new Map<string, number>();
  items.forEach((item) => totals.set(key(item), (totals.get(key(item)) ?? 0) + value(item)));
  return [...totals].map(([name, value]) => ({ name, value }));
};

export function downloadCsv(filename: string, columns: string[], rows: Array<Array<string | number>>) {
  const csv = [columns, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
