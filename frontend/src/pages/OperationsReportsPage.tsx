import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SimCardDownloadOutlinedIcon from "@mui/icons-material/SimCardDownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SearchIcon from "@mui/icons-material/Search";

import dayjs from "dayjs";
import { useState, useMemo } from "react";

import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { KPICard } from "../components/reports/KPICard";
import { SummaryChart } from "../components/reports/SummaryChart";
import { useOrdersQuery, useInvoicesQuery } from "../services/queries";
import { formatMoney } from "../utils/catalog";

export function OperationsReportsPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "detailed">("dashboard");
  const [dateRange, setDateRange] = useState("this_month");
  
  // Reports specific filters
  const [reportStatusFilter, setReportStatusFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const ordersQuery = useOrdersQuery({ pageSize: 500 });
  const invoicesQuery = useInvoicesQuery({ pageSize: 500 });

  const kpiData = useMemo(() => {
    if (!ordersQuery.data || !invoicesQuery.data) return null;
    const orders = ordersQuery.data.data;
    const invoices = invoicesQuery.data.data;
    const today = dayjs().startOf("day");

    let activeRentals = 0;
    let dueToday = 0;
    let upcomingPickups = 0;
    let upcomingReturns = 0;
    let overdueRentals = 0;
    let revenue = 0;
    let depositsHeld = 0;
    let lateFees = 0;

    for (const order of orders) {
      if (order.status === "cancelled") continue;
      
      const start = dayjs(order.rentalStart).startOf("day");
      const end = dayjs(order.rentalEnd).startOf("day");

      // Active Rentals
      if (order.status === "sale_order" && !order.return_data?.actual_return_at) {
        if ((today.isSame(start) || today.isAfter(start)) && (today.isSame(end) || today.isBefore(end))) {
          activeRentals++;
        }
      }

      // Due Today
      if ((start.isSame(today) && !order.pickup?.confirmed_at) || (end.isSame(today) && !order.return_data?.actual_return_at)) {
        dueToday++;
      }

      // Upcoming Pickups (next 7 days)
      if (start.isAfter(today) && start.diff(today, "day") <= 7 && !order.pickup?.confirmed_at) {
        upcomingPickups++;
      }

      // Upcoming Returns (next 7 days)
      if (end.isAfter(today) && end.diff(today, "day") <= 7 && !order.return_data?.actual_return_at && order.pickup?.confirmed_at) {
        upcomingReturns++;
      }

      // Overdue Rentals
      if (today.isAfter(end) && !order.return_data?.actual_return_at) {
        overdueRentals++;
      }

      // Deposits Held
      if (order.status === "sale_order" && !order.return_data) {
        depositsHeld += (order.deposit?.amount?.amount || 0);
      }

      // Late Fees collected
      if (order.return_data?.late_fee_amount) {
        lateFees += order.return_data.late_fee_amount;
      }
    }

    // Revenue from posted invoices
    for (const inv of invoices) {
      if (inv.status === "posted") {
        revenue += inv.total;
      }
    }

    return {
      activeRentals,
      dueToday,
      upcomingPickups,
      upcomingReturns,
      overdueRentals,
      revenue,
      depositsHeld,
      lateFees,
    };
  }, [ordersQuery.data, invoicesQuery.data]);

  const chartData = useMemo(() => {
    // Generate dummy/aggregated chart data for the last 6 months based on current month
    // A real implementation would group invoices by month and sum totals.
    return [
      { name: dayjs().subtract(5, "month").format("MMM"), value: 1200 },
      { name: dayjs().subtract(4, "month").format("MMM"), value: 1500 },
      { name: dayjs().subtract(3, "month").format("MMM"), value: 900 },
      { name: dayjs().subtract(2, "month").format("MMM"), value: 2100 },
      { name: dayjs().subtract(1, "month").format("MMM"), value: 1800 },
      { name: dayjs().format("MMM"), value: kpiData?.revenue || 2500 },
    ];
  }, [kpiData?.revenue]);

  if (ordersQuery.isLoading || invoicesQuery.isLoading) return <LoadingState label="Loading reports" />;
  if (ordersQuery.isError || invoicesQuery.isError || !kpiData) return <ErrorState message="Could not load reports." />;

  const handleExport = (type: string) => {
    // Mock export action
    console.log(`Exporting report as ${type}`);
    if (type === "print") {
      window.print();
    } else {
      alert(`${type.toUpperCase()} Export triggered for current view.`);
    }
  };

  return (
    <Box>
      <PageHeader
        actions={
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            sx={{ width: 150, bgcolor: "background.paper" }}
          >
            <MenuItem value="this_week">This Week</MenuItem>
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="this_quarter">This Quarter</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </TextField>
        }
        description="Monitor key performance indicators and generate detailed business reports."
        title="Reports & Dashboard"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Detailed Reports" value="detailed" />
        </Tabs>
      </Box>

      {activeTab === "dashboard" && (
        <Stack spacing={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Active Rentals" value={kpiData.activeRentals} icon={<AssignmentOutlinedIcon />} filterParam="active" color="primary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Due Today" value={kpiData.dueToday} icon={<TodayOutlinedIcon />} filterParam="today" color="warning" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Upcoming Pickups" value={kpiData.upcomingPickups} icon={<LocalShippingOutlinedIcon />} filterParam="pickup" color="info" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Overdue Rentals" value={kpiData.overdueRentals} icon={<WarningAmberOutlinedIcon />} filterParam="late" color="error" />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Revenue" value={formatMoney({ amount: kpiData.revenue, currency: "USD" })} icon={<AttachMoneyOutlinedIcon />} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Deposits Held" value={formatMoney({ amount: kpiData.depositsHeld, currency: "USD" })} icon={<RequestQuoteOutlinedIcon />} color="secondary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard label="Late Fees" value={formatMoney({ amount: kpiData.lateFees, currency: "USD" })} icon={<WarningAmberOutlinedIcon />} color="error" />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <SummaryChart data={chartData} title="Revenue (Last 6 Months)" dataKey="value" color="#1976d2" />
            </CardContent>
          </Card>
        </Stack>
      )}

      {activeTab === "detailed" && (
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Orders by Status"
                    size="small"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    SelectProps={{ multiple: true }}
                  >
                    <MenuItem value="quotation">Quotation</MenuItem>
                    <MenuItem value="sale_order">Sale Order</MenuItem>
                    <MenuItem value="late">Late Return</MenuItem>
                    <MenuItem value="invoiced">Invoiced</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    placeholder="Search orders, customers..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} fontSize="small" />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton title="Export PDF" onClick={() => handleExport("pdf")}>
                      <PictureAsPdfOutlinedIcon />
                    </IconButton>
                    <IconButton title="Export CSV" onClick={() => handleExport("csv")}>
                      <SimCardDownloadOutlinedIcon />
                    </IconButton>
                    <IconButton title="Print Report" onClick={() => handleExport("print")}>
                      <PrintOutlinedIcon />
                    </IconButton>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <SummaryChart data={chartData} title="Report Data Visualization" dataKey="value" color="#2e7d32" />
            </CardContent>
          </Card>
          
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body1">
              Tabular data view would render here. (Filtered by {reportStatusFilter.length > 0 ? reportStatusFilter.join(', ') : 'All Statuses'} and '{dateRange}')
            </Typography>
            <Typography variant="caption">
              Vendor scoping is applied at the API level via authentication.
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
