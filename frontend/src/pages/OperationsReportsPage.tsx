import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/GridLegacy";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
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
import { KPICard } from "../components/reports/KPICard";
import { useInvoicesQuery, useOrdersQuery, useProductsQuery } from "../services/queries";
import { RENTAL_ORDER_STATUS_LABELS, type RentalOrder } from "../types";
import { formatMoney } from "../utils/catalog";
import { downloadCsv, filterOrders, groupBy, orderDeposit, orderEnd, orderLateFees, orderRevenue, orderStart, type AnalyticsPeriod } from "../utils/analytics";

echarts.use([BarChart, CanvasRenderer, GridComponent, LegendComponent, LineChart, PieChart, TooltipComponent]);

const statusColor = "#1f77b4";
const Chart = ({ option }: { option: object }) => <ReactEChartsCore echarts={echarts} option={option} style={{ height: 300, width: "100%" }} />;
const chartGrid = { left: 48, right: 20, top: 32, bottom: 48 };

export function OperationsReportsPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "detailed">("dashboard");
  const [period, setPeriod] = useState<AnalyticsPeriod>("this_month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const ordersQuery = useOrdersQuery({ pageSize: 500 });
  const invoicesQuery = useInvoicesQuery({ pageSize: 500 });
  const productsQuery = useProductsQuery({ pageSize: 500 });
  const orders = ordersQuery.data?.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];

  const filteredOrders = useMemo(() => filterOrders(orders, { period, from, to, statuses, customerId, search }), [orders, period, from, to, statuses, customerId, search]);
  const customers = useMemo(() => [...new Map(orders.map((order) => [order.customer?.id, order.customer])).values()].filter(Boolean), [orders]);
  const analytics = useMemo(() => {
    const today = dayjs().startOf("day");
    const active = filteredOrders.filter((order) => !["cancelled", "returned"].includes(order.status) && !today.isBefore(dayjs(orderStart(order))) && !today.isAfter(dayjs(orderEnd(order)))).length;
    const dueToday = filteredOrders.filter((order) => today.isSame(dayjs(orderStart(order)), "day") || today.isSame(dayjs(orderEnd(order)), "day")).length;
    const revenue = filteredOrders.reduce((total, order) => total + orderRevenue(order), 0);
    const deposits = filteredOrders.filter((order) => !order.schedule?.actualReturnAt).reduce((total, order) => total + orderDeposit(order), 0);
    const lateFees = filteredOrders.reduce((total, order) => total + orderLateFees(order), 0);
    const status = groupBy(filteredOrders, (order) => RENTAL_ORDER_STATUS_LABELS[order.status] ?? order.status, () => 1);
    const months = Array.from({ length: 6 }, (_, offset) => dayjs().subtract(5 - offset, "month"));
    const revenueTrend = months.map((month) => ({ name: month.format("MMM YY"), value: filteredOrders.filter((order) => dayjs(orderStart(order)).isSame(month, "month")).reduce((total, order) => total + orderRevenue(order), 0) }));
    const topProducts = groupBy(filteredOrders.flatMap((order) => order.lines ?? []), (line) => line.productName ?? line.sku ?? "Unspecified product", (line) => Number(line.quantity) || 0).sort((a, b) => b.value - a.value).slice(0, 8);
    const customersByRevenue = groupBy(filteredOrders, (order) => order.customer?.name ?? "Unknown customer", orderRevenue).sort((a, b) => b.value - a.value).slice(0, 8);
    const financials = [
      { name: "Rental revenue", value: revenue }, { name: "Deposits held", value: deposits }, { name: "Late fees", value: lateFees },
    ];
    const utilization = (productsQuery.data?.data ?? []).map((product) => ({ name: product.name, value: Math.max(0, Number(product.stock?.inUse ?? product.stock?.reserved ?? 0)) })).filter((product) => product.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
    return { active, dueToday, revenue, deposits, lateFees, status, revenueTrend, topProducts, customersByRevenue, financials, utilization };
  }, [filteredOrders, productsQuery.data]);

  if (ordersQuery.isLoading || invoicesQuery.isLoading || productsQuery.isLoading) return <LoadingState label="Loading analytics" />;
  if (ordersQuery.isError || invoicesQuery.isError || productsQuery.isError) return <ErrorState message="Could not load report data." />;

  const exportCsv = () => downloadCsv(
    `assetra-report-${dayjs().format("YYYY-MM-DD")}.csv`,
    ["Order", "Customer", "Status", "Pickup", "Return", "Rental revenue", "Deposit", "Late fees"],
    filteredOrders.map((order) => [order.ref ?? order.number, order.customer?.name ?? "", RENTAL_ORDER_STATUS_LABELS[order.status] ?? order.status, dayjs(orderStart(order)).format("YYYY-MM-DD"), dayjs(orderEnd(order)).format("YYYY-MM-DD"), orderRevenue(order), orderDeposit(order), orderLateFees(order)]),
  );
  const filters = (
    <Card><CardContent><Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={2}><TextField fullWidth select label="Period" size="small" value={period} onChange={(event) => setPeriod(event.target.value as AnalyticsPeriod)}><MenuItem value="this_week">This week</MenuItem><MenuItem value="this_month">This month</MenuItem><MenuItem value="this_quarter">This quarter</MenuItem><MenuItem value="all">All time</MenuItem><MenuItem value="custom">Custom range</MenuItem></TextField></Grid>
      {period === "custom" && <><Grid item xs={6} md={2}><TextField fullWidth label="From" type="date" size="small" value={from} onChange={(event) => setFrom(event.target.value)} InputLabelProps={{ shrink: true }} /></Grid><Grid item xs={6} md={2}><TextField fullWidth label="To" type="date" size="small" value={to} onChange={(event) => setTo(event.target.value)} InputLabelProps={{ shrink: true }} /></Grid></>}
      <Grid item xs={12} md={2}><TextField fullWidth select label="Customer" size="small" value={customerId} onChange={(event) => setCustomerId(event.target.value)}><MenuItem value="">All customers</MenuItem>{customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={2}><TextField fullWidth select label="Status" size="small" value={statuses} onChange={(event) => setStatuses(typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value)} SelectProps={{ multiple: true }}>{Object.entries(RENTAL_ORDER_STATUS_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={period === "custom" ? 2 : 4}><TextField fullWidth placeholder="Search orders or customers" size="small" value={search} onChange={(event) => setSearch(event.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} fontSize="small" /> }} /></Grid>
    </Grid></CardContent></Card>
  );
  const reportCharts = <Grid container spacing={3}>
    <Grid item xs={12} lg={7}><Card><CardContent><Typography variant="h6">Rental revenue trend</Typography><Typography color="text.secondary" variant="body2">Monthly revenue based on the current filters.</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: chartGrid, xAxis: { type: "category", data: analytics.revenueTrend.map((item) => item.name) }, yAxis: { type: "value" }, series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.14 }, data: analytics.revenueTrend.map((item) => item.value), itemStyle: { color: statusColor } }] }} /></CardContent></Card></Grid>
    <Grid item xs={12} lg={5}><Card><CardContent><Typography variant="h6">Order lifecycle</Typography><Typography color="text.secondary" variant="body2">Distribution by current order status.</Typography><Chart option={{ tooltip: { trigger: "item" }, legend: { bottom: 0, type: "scroll" }, series: [{ type: "pie", radius: ["42%", "70%"], center: ["50%", "44%"], label: { show: false }, data: analytics.status }] }} /></CardContent></Card></Grid>
    <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Most rented products</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: { ...chartGrid, left: 130 }, xAxis: { type: "value" }, yAxis: { type: "category", data: analytics.topProducts.map((item) => item.name).reverse(), axisLabel: { width: 115, overflow: "truncate" } }, series: [{ type: "bar", data: analytics.topProducts.map((item) => item.value).reverse(), itemStyle: { color: "#1f9d84", borderRadius: [0, 5, 5, 0] } }] }} /></CardContent></Card></Grid>
    <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Financial composition</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: chartGrid, xAxis: { type: "category", data: analytics.financials.map((item) => item.name), axisLabel: { interval: 0, rotate: 12 } }, yAxis: { type: "value" }, series: [{ type: "bar", data: analytics.financials.map((item) => item.value), itemStyle: { color: "#f59e0b", borderRadius: [5, 5, 0, 0] } }] }} /></CardContent></Card></Grid>
    <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Top customers by revenue</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: { ...chartGrid, left: 120 }, xAxis: { type: "value" }, yAxis: { type: "category", data: analytics.customersByRevenue.map((item) => item.name).reverse(), axisLabel: { width: 105, overflow: "truncate" } }, series: [{ type: "bar", data: analytics.customersByRevenue.map((item) => item.value).reverse(), itemStyle: { color: "#7c3aed", borderRadius: [0, 5, 5, 0] } }] }} /></CardContent></Card></Grid>
    <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Products currently in use</Typography><Chart option={{ tooltip: { trigger: "axis" }, grid: { ...chartGrid, left: 120 }, xAxis: { type: "value" }, yAxis: { type: "category", data: analytics.utilization.map((item) => item.name).reverse(), axisLabel: { width: 105, overflow: "truncate" } }, series: [{ type: "bar", data: analytics.utilization.map((item) => item.value).reverse(), itemStyle: { color: "#0ea5e9", borderRadius: [0, 5, 5, 0] } }] }} /></CardContent></Card></Grid>
  </Grid>;

  return <Box>
    <PageHeader title="Reports & Dashboard" description="Interactive operations analysis. Every card, chart, table, and export follows the filters below." actions={<Stack direction="row" spacing={1}><Button startIcon={<DownloadOutlinedIcon />} onClick={exportCsv} variant="contained">Export CSV</Button><Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} variant="outlined">Print / Save PDF</Button></Stack>} />
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}><Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}><Tab label="Analytics dashboard" value="dashboard" /><Tab label="Detailed report" value="detailed" /></Tabs></Box>
    <Stack spacing={3}>{filters}{activeTab === "dashboard" ? <><Grid container spacing={3}><Grid item xs={12} sm={6} md={3}><KPICard label="Active rentals" value={analytics.active} icon={<AssignmentOutlinedIcon />} color="primary" /></Grid><Grid item xs={12} sm={6} md={3}><KPICard label="Due today" value={analytics.dueToday} icon={<LocalShippingOutlinedIcon />} color="warning" /></Grid><Grid item xs={12} sm={6} md={3}><KPICard label="Rental revenue" value={formatMoney({ amount: analytics.revenue, currency: "INR" })} icon={<AttachMoneyOutlinedIcon />} color="success" /></Grid><Grid item xs={12} sm={6} md={3}><KPICard label="Deposits held" value={formatMoney({ amount: analytics.deposits, currency: "INR" })} icon={<RequestQuoteOutlinedIcon />} color="secondary" /></Grid><Grid item xs={12} sm={6} md={3}><KPICard label="Late fees" value={formatMoney({ amount: analytics.lateFees, currency: "INR" })} icon={<WarningAmberOutlinedIcon />} color="error" /></Grid></Grid>{reportCharts}</> : <><Typography color="text.secondary" variant="body2">{filteredOrders.length} orders match the selected filters. Download CSV for the complete filtered dataset.</Typography>{reportCharts}<Card><CardContent><Typography sx={{ mb: 2 }} variant="h6">Filtered orders</Typography><Table size="small"><TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Status</TableCell><TableCell>Pickup</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead><TableBody>{filteredOrders.slice(0, 100).map((order: RentalOrder) => <TableRow hover key={order.id}><TableCell>{order.ref ?? order.number}</TableCell><TableCell>{order.customer?.name ?? "—"}</TableCell><TableCell>{RENTAL_ORDER_STATUS_LABELS[order.status] ?? order.status}</TableCell><TableCell>{dayjs(orderStart(order)).format("DD MMM YYYY")}</TableCell><TableCell align="right">{formatMoney({ amount: orderRevenue(order), currency: "INR" })}</TableCell></TableRow>)}</TableBody></Table>{!filteredOrders.length && <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No orders match these filters.</Typography>}</CardContent></Card></>}</Stack>
  </Box>;
}
