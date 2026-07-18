import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import type { RentalOrder } from "../../types";
import { formatMoney } from "../../utils/catalog";

interface OrdersListProps {
  orders: RentalOrder[];
  view: "list" | "kanban";
  onSelectOrder: (order: RentalOrder) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "quotation":
      return "default";
    case "quotation_sent":
      return "secondary";
    case "sale_order":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "quotation":
      return "Quotation";
    case "quotation_sent":
      return "Quotation Sent";
    case "sale_order":
      return "Sale Order Confirmed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getOrderStage = (order: RentalOrder) => {
  const today = dayjs().format("YYYY-MM-DD");
  if (order.rentalEnd && dayjs(order.rentalEnd).isBefore(today)) return "Late";
  if (order.rentalEnd === today) return "Return";
  if (order.rentalStart === today) return "Pickup";
  return "Today";
};

export function OrdersList({ orders, view, onSelectOrder }: OrdersListProps) {
  if (view === "list") {
    return (
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Ref</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Pickup Date</TableCell>
              <TableCell>Return Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                hover
                key={order.id}
                onClick={() => onSelectOrder(order)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{order.ref || order.number}</TableCell>
                <TableCell>{order.customer?.name}</TableCell>
                <TableCell>{order.rentalStart || order.schedule?.scheduledPickupAt}</TableCell>
                <TableCell>{order.rentalEnd || order.schedule?.scheduledReturnAt}</TableCell>
                <TableCell>{formatMoney({ amount: order.totalAmount || order.price?.total || 0, currency: "USD" })}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    );
  }

  // Kanban view
  const columns = ["Today", "Pickup", "Return", "Late"];
  const groupedOrders = columns.map((col) => ({
    title: col,
    items: orders.filter((o) => getOrderStage(o) === col),
  }));

  return (
    <Grid container spacing={2}>
      {groupedOrders.map((col) => (
        <Grid item xs={12} sm={6} md={3} key={col.title}>
          <Box sx={{ bgcolor: "grey.100", p: 2, borderRadius: 1, minHeight: 400 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: "bold" }}>
              {col.title} ({col.items.length})
            </Typography>
            <Stack spacing={2}>
              {col.items.map((order) => (
                <Card
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {order.ref || order.number}
                      </Typography>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status) as any}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {order.customer?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatMoney({ amount: order.totalAmount || order.price?.total || 0, currency: "USD" })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {order.rentalStart} → {order.rentalEnd}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
