import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { calculateCartTotals, type CheckoutOrder } from "../features/cart/cart";
import { useCart } from "../features/cart/useCart";
import { ROUTES } from "../constants/routes";
import { api } from "../services/api";
import { useCreateOrderMutation, useSessionQuery } from "../services/queries";
import { formatMoney } from "../utils/catalog";

type FulfillmentMode = CheckoutOrder["fulfillmentMode"];

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const session = useSessionQuery();
  const createOrder = useCreateOrderMutation();
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("Nisha Rao");
  const [email, setEmail] = useState("nisha@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [fulfillmentMode, setFulfillmentMode] =
    useState<FulfillmentMode>("store_pickup");
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [touched, setTouched] = useState(false);
  const totals = calculateCartTotals(cart.items, fulfillmentMode, couponCode);
  const requiresAddress = fulfillmentMode === "delivery";
  const isValid =
    customerName.trim().length > 1 &&
    email.includes("@") &&
    phone.trim().length >= 8 &&
    (!requiresAddress || address.trim().length > 8);

  if (cart.items.length === 0) return <Navigate replace to={ROUTES.cart} />;

  const submitOrder = async () => {
    setTouched(true);
    if (!isValid) return;

    if (!session.data?.data.user) return;
    setError(null);
    const order: CheckoutOrder = {
      id: `order_${crypto.randomUUID()}`,
      number: `ARO-${Date.now().toString().slice(-6)}`,
      customerName,
      email,
      phone,
      fulfillmentMode,
      address: requiresAddress ? address : undefined,
      couponCode: couponCode || undefined,
      items: cart.items,
      totals,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await createOrder.mutateAsync({
        customerId: session.data.data.user.id,
        lines: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, rentalPeriod: { startsAt: item.startsAt, endsAt: item.endsAt, unit: item.rentalUnit, quantity: 1, timezone: "Asia/Kolkata" } })),
        schedule: { mode: fulfillmentMode, scheduledPickupAt: cart.items[0].startsAt, scheduledReturnAt: cart.items[0].endsAt, gracePeriodMinutes: 0 },
      });
      const intent = await api.createPaymentIntent(response.data.id, `checkout_${response.data.id}`);
      await api.confirmPayment(intent.data.id);
      cart.clearCart();
      navigate(ROUTES.checkoutSuccess, { replace: true, state: { order } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be completed.");
    }
  };

  return (
    <>
      <PageHeader
        actions={
          <Button component={RouterLink} to={ROUTES.cart} variant="outlined">
            Back to cart
          </Button>
        }
        description="Confirm fulfillment, security deposit, and sandbox payment."
        title="Checkout"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Contact details
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      error={touched && customerName.trim().length <= 1}
                      fullWidth
                      helperText={
                        touched && customerName.trim().length <= 1
                          ? "Enter customer name."
                          : undefined
                      }
                      label="Customer name"
                      onChange={(event) => setCustomerName(event.target.value)}
                      value={customerName}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      error={touched && !email.includes("@")}
                      fullWidth
                      helperText={
                        touched && !email.includes("@")
                          ? "Enter a valid email."
                          : undefined
                      }
                      label="Email"
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      value={email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      error={touched && phone.trim().length < 8}
                      fullWidth
                      helperText={
                        touched && phone.trim().length < 8
                          ? "Enter a contact number."
                          : undefined
                      }
                      label="Phone"
                      onChange={(event) => setPhone(event.target.value)}
                      value={phone}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Fulfillment
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Pickup option"
                      onChange={(event) =>
                        setFulfillmentMode(event.target.value as FulfillmentMode)
                      }
                      select
                      value={fulfillmentMode}
                    >
                      <MenuItem value="store_pickup">Store pickup</MenuItem>
                      <MenuItem value="delivery">Delivery</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      disabled={!requiresAddress}
                      error={
                        touched && requiresAddress && address.trim().length <= 8
                      }
                      fullWidth
                      helperText={
                        requiresAddress
                          ? "Delivery adds a mock charge of Rs. 750."
                          : "Store pickup has no delivery charge."
                      }
                      label="Delivery address"
                      minRows={3}
                      multiline
                      onChange={(event) => setAddress(event.target.value)}
                      value={address}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Payment
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This environment uses the sandbox payment provider. The backend records the rental payment and security-deposit hold.
                </Alert>
                <TextField
                  fullWidth
                  helperText="Discount codes are validated by the backend during checkout."
                  label="Coupon code"
                  onChange={(event) => setCouponCode(event.target.value)}
                  value={couponCode}
                />
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Review
              </Typography>
              <Stack spacing={1.25}>
                {error ? <Alert severity="error">{error}</Alert> : null}
                {cart.items.map((item) => (
                  <Box key={item.id}>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {item.productName}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {item.quantity} x {item.variantName}
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Rental
                  </Typography>
                  <Typography variant="body2">{formatMoney(totals.rental)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Delivery
                  </Typography>
                  <Typography variant="body2">{formatMoney(totals.delivery)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Discount
                  </Typography>
                  <Typography variant="body2">
                    -{formatMoney(totals.discount)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Tax
                  </Typography>
                  <Typography variant="body2">{formatMoney(totals.tax)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary" variant="body2">
                    Deposit
                  </Typography>
                  <Typography variant="body2">{formatMoney(totals.deposit)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="h4">Total due</Typography>
                  <Typography variant="h4">{formatMoney(totals.total)}</Typography>
                </Stack>
                <Button
                  disabled={createOrder.isPending || session.isLoading}
                  onClick={() => void submitOrder()}
                  startIcon={<CheckCircleOutlineOutlinedIcon />}
                  variant="contained"
                >
                  Confirm rental
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
