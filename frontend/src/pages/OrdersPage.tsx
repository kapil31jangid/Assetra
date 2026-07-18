import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import type {
  RecordFulfillmentRequest,
  RentalOrderListQuery,
} from "../services/api-contract";
import {
  useCreateOrderMutation,
  useOrdersQuery,
  useProductsQuery,
  useRecordFulfillmentMutation,
  useUpdateOrderStatusMutation,
} from "../services/queries";
import {
  RENTAL_ORDER_STATUS_LABELS,
  RENTAL_ORDER_STATUS_TRANSITIONS,
  type ChecklistItem,
  type RentalOrder,
  type RentalOrderStatus,
} from "../types";
import { formatMoney, getProductDailyRate } from "../utils/catalog";

const statusOptions = Object.keys(
  RENTAL_ORDER_STATUS_LABELS,
) as RentalOrderStatus[];

const kanbanColumns: RentalOrderStatus[] = [
  "quotation",
  "confirmed",
  "reserved",
  "picked_up",
  "late_return",
  "returned",
];

const nowInput = () => dayjs().format("YYYY-MM-DDTHH:mm");

const buildChecklist = (order: RentalOrder): ChecklistItem[] => {
  const accessoryItems = order.lines.flatMap((line) =>
    line.accessories.map((accessory) => ({
      id: `${line.id}_${accessory.id}`,
      label: accessory.name,
      expectedQuantity: accessory.quantityRequired * line.quantity,
      receivedQuantity: accessory.quantityRequired * line.quantity,
      condition: "good" as const,
    })),
  );

  return [
    {
      id: `${order.id}_primary_item`,
      label: order.lines[0]?.productName ?? "Primary rental item",
      expectedQuantity: order.lines[0]?.quantity ?? 1,
      receivedQuantity: order.lines[0]?.quantity ?? 1,
      condition: "good",
    },
    ...accessoryItems,
  ];
};

export function OrdersPage() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RentalOrderStatus | "">("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [fulfillmentOrder, setFulfillmentOrder] = useState<RentalOrder | null>(
    null,
  );
  const [fulfillmentType, setFulfillmentType] =
    useState<RecordFulfillmentRequest["type"]>("pickup");
  const [occurredAt, setOccurredAt] = useState(nowInput());
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createProductId, setCreateProductId] = useState("");

  const query: RentalOrderListQuery = {
    pageSize: 50,
    search: search || undefined,
    status: status || undefined,
  };
  const orders = useOrdersQuery(query);
  const products = useProductsQuery({ pageSize: 100 });
  const updateStatus = useUpdateOrderStatusMutation();
  const recordFulfillment = useRecordFulfillmentMutation();
  const createOrder = useCreateOrderMutation();

  const orderItems = orders.data?.data ?? [];
  const selectedOrder =
    orderItems.find((order) => order.id === selectedOrderId) ?? orderItems[0];
  const groupedOrders = useMemo(
    () =>
      kanbanColumns.map((column) => ({
        status: column,
        orders: orderItems.filter((order) => order.status === column),
      })),
    [orderItems],
  );

  const openFulfillment = (
    order: RentalOrder,
    type: RecordFulfillmentRequest["type"],
  ) => {
    setFulfillmentOrder(order);
    setFulfillmentType(type);
    setOccurredAt(nowInput());
    setNotes("");
    setChecklist(buildChecklist(order));
  };

  const submitFulfillment = () => {
    if (!fulfillmentOrder) return;

    recordFulfillment.mutate(
      {
        orderId: fulfillmentOrder.id,
        request: {
          type: fulfillmentType,
          occurredAt: new Date(occurredAt).toISOString(),
          checklist,
          notes,
        },
      },
      {
        onSuccess: () => setFulfillmentOrder(null),
      },
    );
  };

  const createQuickOrder = () => {
    const product =
      products.data?.data.find((item) => item.id === createProductId) ??
      products.data?.data[0];
    const variant = product?.variants[0];
    if (!product || !variant) return;

    const startsAt = dayjs().add(1, "day").hour(10).minute(0).toISOString();
    const endsAt = dayjs().add(4, "day").hour(10).minute(0).toISOString();
    createOrder.mutate(
      {
        customerId: "cus_walkin",
        lines: [
          {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            rentalPeriod: {
              startsAt,
              endsAt,
              unit: "daily",
              quantity: 3,
              timezone: "Asia/Kolkata",
            },
          },
        ],
        schedule: {
          mode: "store_pickup",
          scheduledPickupAt: startsAt,
          scheduledReturnAt: endsAt,
          gracePeriodMinutes: 30,
        },
      },
      { onSuccess: () => setCreateOpen(false) },
    );
  };

  if (orders.isLoading || products.isLoading)
    return <LoadingState label="Loading rental orders" />;
  if (orders.isError || !orders.data)
    return <ErrorState message="Rental orders could not be loaded." />;

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            New order
          </Button>
        }
        description="Monitor rentals, move lifecycle states, and process pickup or return."
        title="Rental Orders"
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label="Search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Order, customer, product"
                size="small"
                value={search}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Status"
                onChange={(event) =>
                  setStatus(event.target.value as RentalOrderStatus | "")
                }
                select
                size="small"
                value={status}
              >
                <MenuItem value="">All statuses</MenuItem>
                {statusOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {RENTAL_ORDER_STATUS_LABELS[item]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Tabs onChange={(_, next) => setView(next)} value={view}>
                <Tab label="List" value="list" />
                <Tab label="Kanban" value="kanban" />
              </Tabs>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {view === "list" ? (
            <Stack spacing={1.5}>
              {orderItems.map((order) => (
                <OrderCard
                  key={order.id}
                  onOpenFulfillment={openFulfillment}
                  onSelect={() => setSelectedOrderId(order.id)}
                  onStatus={(nextStatus) =>
                    updateStatus.mutate({
                      orderId: order.id,
                      request: { status: nextStatus },
                    })
                  }
                  order={order}
                  selected={selectedOrder?.id === order.id}
                />
              ))}
            </Stack>
          ) : (
            <Grid container spacing={1.5}>
              {groupedOrders.map((group) => (
                <Grid key={group.status} size={{ xs: 12, md: 6, xl: 4 }}>
                  <Card sx={{ minHeight: 220 }}>
                    <CardContent>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between", mb: 1.5 }}
                      >
                        <Typography variant="h4">
                          {RENTAL_ORDER_STATUS_LABELS[group.status]}
                        </Typography>
                        <Chip label={group.orders.length} size="small" />
                      </Stack>
                      <Stack spacing={1}>
                        {group.orders.map((order) => (
                          <Box
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              cursor: "pointer",
                              p: 1.25,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700 }} variant="body2">
                              {order.number}
                            </Typography>
                            <Typography color="text.secondary" variant="caption">
                              {order.customer.name}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          {selectedOrder ? <OrderDetail order={selectedOrder} /> : null}
        </Grid>
      </Grid>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setFulfillmentOrder(null)}
        open={Boolean(fulfillmentOrder)}
      >
        <DialogTitle>
          {fulfillmentType === "pickup" ? "Pickup confirmation" : "Return confirmation"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Occurred at"
              onChange={(event) => setOccurredAt(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              type="datetime-local"
              value={occurredAt}
            />
            {checklist.map((item, index) => (
              <Grid container key={item.id} spacing={1}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {item.label}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    Expected {item.expectedQuantity}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="Received"
                    onChange={(event) =>
                      setChecklist((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                receivedQuantity: Number(event.target.value),
                              }
                            : entry,
                        ),
                      )
                    }
                    size="small"
                    type="number"
                    value={item.receivedQuantity ?? 0}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Condition"
                    onChange={(event) =>
                      setChecklist((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                condition: event.target.value as ChecklistItem["condition"],
                              }
                            : entry,
                        ),
                      )
                    }
                    select
                    size="small"
                    value={item.condition ?? "good"}
                  >
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="damaged">Damaged</MenuItem>
                    <MenuItem value="missing">Missing</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            ))}
            <TextField
              fullWidth
              label="Notes"
              minRows={3}
              multiline
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
            <Alert severity="info">
              Late fees and deposit hold/refund/penalty records are calculated
              when this event is saved.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillmentOrder(null)}>Cancel</Button>
          <Button
            disabled={recordFulfillment.isPending}
            onClick={submitFulfillment}
            variant="contained"
          >
            Save event
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setCreateOpen(false)}
        open={createOpen}
      >
        <DialogTitle>Create quick order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Product"
              onChange={(event) => setCreateProductId(event.target.value)}
              select
              value={createProductId || products.data?.data[0]?.id || ""}
            >
              {products.data?.data.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} · {formatMoney(getProductDailyRate(product))}
                </MenuItem>
              ))}
            </TextField>
            <Alert severity="info">
              This creates a mock quotation for a walk-in customer. Full order
              editing can expand from this scaffold.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            disabled={createOrder.isPending}
            onClick={createQuickOrder}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function OrderCard({
  order,
  selected,
  onSelect,
  onStatus,
  onOpenFulfillment,
}: {
  order: RentalOrder;
  selected: boolean;
  onSelect: () => void;
  onStatus: (status: RentalOrderStatus) => void;
  onOpenFulfillment: (
    order: RentalOrder,
    type: RecordFulfillmentRequest["type"],
  ) => void;
}) {
  const transitions = RENTAL_ORDER_STATUS_TRANSITIONS[order.status];

  return (
    <Card
      onClick={onSelect}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        cursor: "pointer",
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h3">{order.number}</Typography>
              <StatusChip status={order.status} />
            </Stack>
            <Typography variant="body2">
              {order.customer.name} · {order.lines[0]?.productName}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Pickup {order.schedule.scheduledPickupAt} · Return{" "}
              {order.schedule.scheduledReturnAt}
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ alignItems: { md: "flex-end" } }}>
            <Typography variant="h4">{formatMoney(order.price.total)}</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              {transitions.slice(0, 2).map((status) => (
                <Button
                  key={status}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatus(status);
                  }}
                  size="small"
                  variant="outlined"
                >
                  {RENTAL_ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
              {["reserved", "late_pickup"].includes(order.status) ? (
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenFulfillment(order, "pickup");
                  }}
                  size="small"
                  startIcon={<LocalShippingOutlinedIcon />}
                  variant="contained"
                >
                  Pickup
                </Button>
              ) : null}
              {["picked_up", "late_return"].includes(order.status) ? (
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenFulfillment(order, "return");
                  }}
                  size="small"
                  startIcon={<AssignmentTurnedInOutlinedIcon />}
                  variant="contained"
                >
                  Return
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function OrderDetail({ order }: { order: RentalOrder }) {
  const depositHeld = order.depositTransactions.filter(
    (item) => item.type === "hold",
  ).length;

  return (
    <Card>
      <CardContent>
        <Typography sx={{ mb: 2 }} variant="h3">
          Order detail
        </Typography>
        <Stack spacing={1.5}>
          <StatusChip status={order.status} />
          <Typography sx={{ fontWeight: 700 }} variant="body2">
            {order.customer.name}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {order.customer.email}
          </Typography>
          <Divider />
          {order.lines.map((line) => (
            <Box key={line.id}>
              <Typography variant="body2">{line.productName}</Typography>
              <Typography color="text.secondary" variant="caption">
                {line.quantity} x {line.variantName} · {formatMoney(line.lineTotal)}
              </Typography>
            </Box>
          ))}
          <Divider />
          <DetailRow label="Rental" value={formatMoney(order.price.rental)} />
          <DetailRow label="Deposit" value={formatMoney(order.price.deposit)} />
          <DetailRow label="Tax" value={formatMoney(order.price.tax)} />
          <DetailRow label="Total" value={formatMoney(order.price.total)} />
          <Divider />
          <Typography variant="h4">Phase 8 operations</Typography>
          <DetailRow label="Deposit events" value={`${order.depositTransactions.length}`} />
          <DetailRow label="Deposit holds" value={`${depositHeld}`} />
          <DetailRow label="Late fees" value={`${order.lateFees.length}`} />
          <DetailRow label="Damage reports" value={`${order.damageReports.length}`} />
          {order.lateFees.map((fee) => (
            <Alert key={fee.id} severity="warning">
              {fee.reason.replace("_", " ")} · {fee.minutesLate} minutes ·{" "}
              {formatMoney(fee.amount)}
            </Alert>
          ))}
          {order.damageReports.map((damage) => (
            <Alert key={damage.id} severity="error">
              {damage.description} · {formatMoney(damage.amount)}
            </Alert>
          ))}
          {order.fulfillmentEvents.map((event) => (
            <Chip
              icon={<Inventory2OutlinedIcon />}
              key={event.id}
              label={`${event.type} recorded ${event.occurredAt}`}
              variant="outlined"
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}
