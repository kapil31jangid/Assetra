import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { getCartItemRentalAmount, type CheckoutOrder } from "../features/cart/cart";
import { ROUTES } from "../constants/routes";
import { formatMoney } from "../utils/catalog";

export function CheckoutSuccessPage() {
  const location = useLocation();
  const order = (location.state as { order?: CheckoutOrder } | null)?.order;

  if (!order) return <Navigate replace to={ROUTES.catalog} />;

  return (
    <>
      <PageHeader
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => window.print()}
              startIcon={<PrintOutlinedIcon />}
              variant="outlined"
            >
              Print
            </Button>
            <Button component={RouterLink} to={ROUTES.catalog} variant="contained">
              Continue browsing
            </Button>
          </Stack>
        }
        description="Your rental order and sandbox payment have been confirmed."
        title={`Order ${order.number}`}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Rental confirmation
              </Typography>
              <Stack spacing={2}>
                {order.items.map((item) => {
                  const lineTotal = {
                    ...item.unitPrice,
                    amount: getCartItemRentalAmount(item),
                  };

                  return (
                    <Box key={item.id}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700 }} variant="body2">
                            {item.productName}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {item.quantity} x {item.variantName} ·{" "}
                            {item.startsAt} to {item.endsAt}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">
                          {formatMoney(lineTotal)}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Invoice preview
              </Typography>
              <Stack spacing={1.25}>
                <Typography color="text.secondary" variant="body2">
                  {order.customerName}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {order.email} · {order.phone}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {order.fulfillmentMode === "delivery"
                    ? `Delivery: ${order.address}`
                    : "Store pickup"}
                </Typography>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Rental
                  </Typography>
                  <Typography variant="body2">
                    {formatMoney(order.totals.rental)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Delivery
                  </Typography>
                  <Typography variant="body2">
                    {formatMoney(order.totals.delivery)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Discount
                  </Typography>
                  <Typography variant="body2">
                    -{formatMoney(order.totals.discount)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Tax
                  </Typography>
                  <Typography variant="body2">{formatMoney(order.totals.tax)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Deposit
                  </Typography>
                  <Typography variant="body2">
                    {formatMoney(order.totals.deposit)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="h4">Total paid</Typography>
                  <Typography variant="h4">{formatMoney(order.totals.total)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
