import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReactECharts from "echarts-for-react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import {
  useDashboardSummaryQuery,
  useOrdersQuery,
  useProductsQuery,
} from "../services/queries";
import { RENTAL_ORDER_STATUS_LABELS } from "../types";
import { formatMoney } from "../utils/catalog";

export function ReportsPage() {
  const dashboard = useDashboardSummaryQuery();
  const orders = useOrdersQuery({ pageSize: 100 });
  const products = useProductsQuery({ pageSize: 100 });

  if (dashboard.isLoading || orders.isLoading || products.isLoading)
    return <LoadingState label="Loading reports" />;
  if (
    dashboard.isError ||
    orders.isError ||
    products.isError ||
    !dashboard.data ||
    !orders.data ||
    !products.data
  )
    return <ErrorState message="Reports could not be loaded." />;

  const orderItems = orders.data.data;
  const productItems = products.data.data;
  const revenue = orderItems.reduce(
    (sum, order) => sum + order.price.rental.amount,
    0,
  );
  const deposits = orderItems.reduce(
    (sum, order) => sum + order.price.deposit.amount,
    0,
  );
  const penalties = orderItems.reduce(
    (sum, order) =>
      sum + order.lateFees.reduce((lateSum, fee) => lateSum + fee.amount.amount, 0),
    0,
  );
  const overdue = orderItems.filter((order) =>
    ["late_pickup", "late_return"].includes(order.status),
  ).length;
  const popularProducts = productItems
    .map((product) => ({
      name: product.name,
      orders: orderItems.filter((order) =>
        order.lines.some((line) => line.productId === product.id),
      ).length,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        description="Management visibility across revenue, utilization, overdue rentals, deposits, and popular products."
        title="Reports"
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <ReportKpi label="Rental revenue" value={formatMoney({ amount: revenue, currency: "INR" })} />
        <ReportKpi label="Deposits held" value={formatMoney({ amount: deposits, currency: "INR" })} />
        <ReportKpi label="Penalty exposure" value={formatMoney({ amount: penalties, currency: "INR" })} />
        <ReportKpi label="Overdue rentals" value={`${overdue}`} />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Revenue trend
              </Typography>
              <ReactECharts
                option={{
                  grid: { left: 40, right: 20, top: 20, bottom: 32 },
                  xAxis: {
                    type: "category",
                    data: ["Week 1", "Week 2", "Week 3", "Week 4"],
                  },
                  yAxis: { type: "value" },
                  series: [
                    {
                      type: "bar",
                      data: [58000, 72000, 64000, revenue || 90000],
                      itemStyle: { color: "#1f9d84" },
                    },
                  ],
                }}
                style={{ height: 280 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Order status
              </Typography>
              <ReactECharts
                option={{
                  tooltip: { trigger: "item" },
                  series: [
                    {
                      type: "pie",
                      radius: ["42%", "70%"],
                      data: Object.entries(dashboard.data.data.orderStatusCounts).map(
                        ([status, count]) => ({
                          name:
                            RENTAL_ORDER_STATUS_LABELS[
                              status as keyof typeof RENTAL_ORDER_STATUS_LABELS
                            ],
                          value: count,
                        }),
                      ),
                    },
                  ],
                }}
                style={{ height: 280 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Product utilization
              </Typography>
              <ReactECharts
                option={{
                  grid: { left: 36, right: 16, top: 20, bottom: 70 },
                  xAxis: {
                    type: "category",
                    axisLabel: { rotate: 35 },
                    data: productItems.map((product) => product.name),
                  },
                  yAxis: { type: "value" },
                  series: [
                    {
                      type: "line",
                      smooth: true,
                      data: productItems.map((product) =>
                        Math.round(
                          ((product.stock.inUse + product.stock.reserved) /
                            product.stock.total) *
                            100,
                        ),
                      ),
                      itemStyle: { color: "#173a5e" },
                    },
                  ],
                }}
                style={{ height: 300 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Popular products
              </Typography>
              <Stack spacing={1.25}>
                {popularProducts.map((product) => (
                  <Stack
                    direction="row"
                    key={product.name}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography variant="body2">{product.name}</Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {product.orders} orders
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function ReportKpi({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card>
        <CardContent>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
          <Typography sx={{ mt: 1 }} variant="h2">
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
