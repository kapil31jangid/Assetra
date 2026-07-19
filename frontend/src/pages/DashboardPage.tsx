import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/lib/core";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { useDashboardSummaryQuery, useOrdersQuery } from "../services/queries";
import { RENTAL_ORDER_STATUS_LABELS } from "../types";
import { filterOrders, groupBy, orderEnd, orderRevenue, orderStart, type AnalyticsPeriod } from "../utils/analytics";
import { formatMoney } from "../utils/catalog";

echarts.use([BarChart, CanvasRenderer, GridComponent, LegendComponent, LineChart, PieChart, TooltipComponent]);
const Chart = ({ option }: { option: object }) => <ReactEChartsCore echarts={echarts} option={option} style={{ height: 285, width: "100%" }} />;

export function DashboardPage() {
  const dashboard = useDashboardSummaryQuery();
  const ordersQuery = useOrdersQuery({ pageSize: 500 });
  const [period, setPeriod] = useState<AnalyticsPeriod>("this_month");
  const [status, setStatus] = useState("");
  const orders = ordersQuery.data?.data ?? [];
  const filtered = useMemo(() => filterOrders(orders, { period, statuses: status ? [status] : [] }), [orders, period, status]);
  const analysis = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => dayjs().subtract(5 - index, "month"));
    const revenue = filtered.reduce((sum, order) => sum + orderRevenue(order), 0);
    const statusData = groupBy(filtered, (order) => RENTAL_ORDER_STATUS_LABELS[order.status] ?? order.status, () => 1);
    const trend = months.map((month) => ({ name: month.format("MMM"), value: filtered.filter((order) => dayjs(orderStart(order)).isSame(month, "month")).reduce((sum, order) => sum + orderRevenue(order), 0) }));
    const pipeline = ["reserved", "picked_up", "late_return", "returned", "cancelled"].map((key) => ({ name: RENTAL_ORDER_STATUS_LABELS[key as keyof typeof RENTAL_ORDER_STATUS_LABELS], value: filtered.filter((order) => order.status === key).length }));
    const pickups = filtered.filter((order) => dayjs(orderStart(order)).isAfter(dayjs()) && dayjs(orderStart(order)).diff(dayjs(), "day") <= 7).slice(0, 5);
    const active = filtered.filter((order) => !["cancelled", "returned"].includes(order.status) && !dayjs().isBefore(dayjs(orderStart(order))) && !dayjs().isAfter(dayjs(orderEnd(order)))).length;
    return { revenue, statusData, trend, pipeline, pickups, active };
  }, [filtered]);

  if (dashboard.isLoading || ordersQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboard.isError || ordersQuery.isError || !dashboard.data) return <ErrorState message="Dashboard data could not be loaded." />;
  const summary = dashboard.data.data;
  const kpis = [
    { label: "Filtered revenue", value: formatMoney({ amount: analysis.revenue, currency: "INR" }) },
    { label: "Active rentals", value: analysis.active },
    { label: "Matching orders", value: filtered.length },
    { label: "Upcoming pickups", value: analysis.pickups.length },
  ];

  return <>
    <PageHeader title="Operations Dashboard" description="Live operational overview. Use period and status filters to focus every chart and KPI." actions={<Stack direction="row" spacing={1}><TextField select size="small" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)} sx={{ minWidth: 140 }}><MenuItem value="this_week">This week</MenuItem><MenuItem value="this_month">This month</MenuItem><MenuItem value="this_quarter">This quarter</MenuItem><MenuItem value="all">All time</MenuItem></TextField><TextField select size="small" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 150 }}><MenuItem value="">All statuses</MenuItem>{Object.entries(RENTAL_ORDER_STATUS_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Stack>} />
    <Grid container spacing={2}>{kpis.map((kpi) => <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 3 }}><Card><CardContent><Typography color="text.secondary" variant="body2">{kpi.label}</Typography><Typography sx={{ mt: 1 }} variant="h3">{kpi.value}</Typography><Typography color="text.secondary" variant="caption">Current filter selection</Typography></CardContent></Card></Grid>)}</Grid>
    <Grid container spacing={2} sx={{ mt: 1 }}><Grid size={{ xs: 12, lg: 7 }}><Card><CardContent><Typography variant="h6">Revenue trend</Typography><Typography color="text.secondary" variant="body2">Rental revenue booked by pickup month.</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: { left: 48, right: 18, top: 28, bottom: 42 }, xAxis: { type: "category", data: analysis.trend.map((item) => item.name) }, yAxis: { type: "value" }, series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.14 }, data: analysis.trend.map((item) => item.value), itemStyle: { color: "#1976d2" } }] }} /></CardContent></Card></Grid><Grid size={{ xs: 12, lg: 5 }}><Card><CardContent><Typography variant="h6">Order portfolio</Typography><Typography color="text.secondary" variant="body2">Lifecycle mix for matching orders.</Typography><Chart option={{ tooltip: { trigger: "item" }, legend: { bottom: 0, type: "scroll" }, series: [{ type: "pie", radius: ["43%", "72%"], center: ["50%", "44%"], label: { show: false }, data: analysis.statusData }] }} /></CardContent></Card></Grid></Grid>
    <Grid container spacing={2} sx={{ mt: 1 }}><Grid size={{ xs: 12, md: 7 }}><Card><CardContent><Typography variant="h6">Fulfillment pipeline</Typography><Typography color="text.secondary" variant="body2">Orders at each operational stage.</Typography><Chart option={{ tooltip: { trigger: "axis", axisPointer: { type: "shadow" } }, grid: { left: 120, right: 20, top: 28, bottom: 26 }, xAxis: { type: "value", minInterval: 1 }, yAxis: { type: "category", data: analysis.pipeline.map((item) => item.name).reverse() }, series: [{ type: "bar", data: analysis.pipeline.map((item) => item.value).reverse(), itemStyle: { color: "#1f9d84", borderRadius: [0, 5, 5, 0] } }] }} /></CardContent></Card></Grid><Grid size={{ xs: 12, md: 5 }}><Card sx={{ height: "100%" }}><CardContent><Typography variant="h6">Upcoming pickups</Typography><Stack spacing={1.4} sx={{ mt: 2 }}>{analysis.pickups.length ? analysis.pickups.map((order) => <Stack direction="row" key={order.id} sx={{ alignItems: "center", justifyContent: "space-between" }}><Box><Typography variant="body2">{order.number}</Typography><Typography color="text.secondary" variant="caption">{order.customer?.name ?? "Unknown"} · {dayjs(orderStart(order)).format("DD MMM")}</Typography></Box><StatusChip status={order.status} /></Stack>) : <Typography color="text.secondary" sx={{ py: 4 }} variant="body2">No upcoming pickups for these filters.</Typography>}</Stack></CardContent></Card></Grid></Grid>
    <Box sx={{ display: "none" }}>{summary.kpis.length}</Box>
  </>;
}
