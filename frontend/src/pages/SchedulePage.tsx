import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { useOrdersQuery, useProductsQuery } from "../services/queries";
import type { Product, RentalOrder } from "../types";

const scheduleStatuses = [
  "reserved",
  "picked_up",
  "late_pickup",
  "late_return",
  "returned",
] as const;

const statusLegend = [
  { label: "Pickup", color: "info" as const },
  { label: "Booked", color: "success" as const },
  { label: "Late pickup", color: "warning" as const },
  { label: "Late return", color: "error" as const },
];

export function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf("week"));
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const products = useProductsQuery({ pageSize: 100 });
  const orders = useOrdersQuery({ pageSize: 100, status: [...scheduleStatuses] });

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day")),
    [weekStart],
  );

  if (products.isLoading || orders.isLoading)
    return <LoadingState label="Loading schedule" />;
  if (products.isError || orders.isError || !products.data || !orders.data)
    return <ErrorState message="Schedule data could not be loaded." />;

  const orderItems = orders.data.data;
  const productItems = products.data.data;
  const selectedOrder =
    orderItems.find((order) => order.id === selectedOrderId) ?? orderItems[0];

  return (
    <>
      <PageHeader
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <IconButton onClick={() => setWeekStart((value) => value.subtract(1, "week"))}>
              <ChevronLeftOutlinedIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {weekStart.format("DD MMM")} - {weekStart.add(6, "day").format("DD MMM")}
            </Typography>
            <IconButton onClick={() => setWeekStart((value) => value.add(1, "week"))}>
              <ChevronRightOutlinedIcon />
            </IconButton>
          </Stack>
        }
        description="View product availability, pickups, returns, and late rental timing."
        title="Schedule"
      />

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, rowGap: 1 }}>
        {statusLegend.map((item) => (
          <Chip color={item.color} key={item.label} label={item.label} variant="outlined" />
        ))}
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Grid
                container
                spacing={1}
                sx={{ minWidth: 720, overflowX: "auto" }}
              >
                <Grid size={3}>
                  <Typography color="text.secondary" variant="caption">
                    Product
                  </Typography>
                </Grid>
                {days.map((day) => (
                  <Grid key={day.toISOString()} size={1.285}>
                    <Typography color="text.secondary" variant="caption">
                      {day.format("ddd DD")}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1.5}>
                {productItems.map((product) => (
                  <ScheduleRow
                    days={days}
                    key={product.id}
                    onSelectOrder={setSelectedOrderId}
                    orders={orderItems}
                    product={product}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Quick detail
              </Typography>
              {selectedOrder ? (
                <Stack spacing={1.5}>
                  <StatusChip status={selectedOrder.status} />
                  <Typography variant="h3">{selectedOrder.number}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedOrder.customer.name}
                  </Typography>
                  <Divider />
                  <Typography variant="body2">
                    {selectedOrder.lines[0]?.productName}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Pickup {selectedOrder.schedule.scheduledPickupAt}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Return {selectedOrder.schedule.scheduledReturnAt}
                  </Typography>
                  <Button href="/operations/orders" variant="outlined">
                    Open orders
                  </Button>
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  Select a booking on the schedule.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function ScheduleRow({
  product,
  orders,
  days,
  onSelectOrder,
}: {
  product: Product;
  orders: RentalOrder[];
  days: dayjs.Dayjs[];
  onSelectOrder: (orderId: string) => void;
}) {
  const productOrders = orders.filter((order) =>
    order.lines.some((line) => line.productId === product.id),
  );

  return (
    <Grid container spacing={1} sx={{ alignItems: "stretch" }}>
      <Grid size={3}>
        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {product.name}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {product.stock.available} available
        </Typography>
      </Grid>
      {days.map((day) => {
        const dayOrders = productOrders.filter((order) => {
          const starts = dayjs(order.schedule.scheduledPickupAt);
          const ends = dayjs(order.schedule.scheduledReturnAt);
          return day.isSame(starts, "day") || day.isSame(ends, "day") || (day.isAfter(starts, "day") && day.isBefore(ends, "day"));
        });

        return (
          <Grid key={day.toISOString()} size={1.285}>
            <Stack spacing={0.5}>
              {dayOrders.length ? (
                dayOrders.map((order) => (
                  <Chip
                    color={
                      order.status === "late_return"
                        ? "error"
                        : order.status === "late_pickup"
                          ? "warning"
                          : order.status === "picked_up"
                            ? "success"
                            : "info"
                    }
                    key={order.id}
                    label={order.number}
                    onClick={() => onSelectOrder(order.id)}
                    size="small"
                    sx={{ maxWidth: "100%" }}
                  />
                ))
              ) : (
                <Chip label="Open" size="small" variant="outlined" />
              )}
            </Stack>
          </Grid>
        );
      })}
    </Grid>
  );
}
