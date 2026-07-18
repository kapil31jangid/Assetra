import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import {
  getCustomerOrders,
  type CustomerOrderRow,
} from "../features/customer-account/accountData";
import { ROUTES } from "../constants/routes";
import { formatMoney } from "../utils/catalog";

const statusColor: Record<CustomerOrderRow["status"], "success" | "info" | "default"> = {
  reserved: "info",
  picked_up: "success",
  returned: "default",
};

export function CustomerOrdersPage() {
  const orders = getCustomerOrders();
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  return (
    <>
      <PageHeader
        description="Track active rentals, past bookings, and support status."
        title="My Orders"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h3">{order.number}</Typography>
                        <Chip
                          color={statusColor[order.status]}
                          label={order.status.replace("_", " ")}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </Stack>
                      <Typography variant="body2">{order.itemSummary}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">
                        {order.startsAt} to {order.endsAt}
                      </Typography>
                    </Box>
                    <Stack spacing={1} sx={{ alignItems: { sm: "flex-end" } }}>
                      <Typography variant="h4">{formatMoney(order.total)}</Typography>
                      <Button
                        onClick={() => setSelectedOrderId(order.id)}
                        size="small"
                        variant={
                          selectedOrderId === order.id ? "contained" : "outlined"
                        }
                      >
                        View details
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Order detail
              </Typography>
              {selectedOrder ? (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {selectedOrder.number}
                  </Typography>
                  {selectedOrder.sourceOrder.items.map((item) => (
                    <Box key={item.id}>
                      <Typography variant="body2">{item.productName}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {item.quantity} x {item.variantName}
                      </Typography>
                    </Box>
                  ))}
                  <Divider />
                  <Typography color="text.secondary" variant="body2">
                    Pickup support: confirmed
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Return support: available from account support
                  </Typography>
                  <Button
                    component={RouterLink}
                    startIcon={<SupportAgentOutlinedIcon />}
                    to={ROUTES.profile}
                    variant="outlined"
                  >
                    Contact support
                  </Button>
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
