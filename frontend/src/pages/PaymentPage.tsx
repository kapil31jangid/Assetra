import React, { useState } from "react";
import { Link as RouterLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import { ROUTES } from "../constants/routes";
import { useCart } from "../features/cart/useCart";
import { calculateCartTotals, getCartItemRentalAmount, type CheckoutOrder } from "../features/cart/cart";
import { formatMoney } from "../utils/catalog";
import { useCheckoutMutation, useSessionQuery } from "../services/queries";

// Placeholder saved cards — cards will be surfaced by the backend in a future iteration
const SAVED_CARDS = [
  { id: "card_visa_4242", brand: "Visa", masked: "**** **** **** 4242", expiry: "12/28" }
];

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCart();
  const session = useSessionQuery();
  const checkout = useCheckoutMutation();
  
  // State from Address Step
  const checkoutState = location.state as {
    deliveryMethod?: "delivery" | "store_pickup";
    selectedDeliveryAddressId?: string;
    selectedBillingAddressId?: string;
  } | null;

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<string>(SAVED_CARDS[0].id);
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Guards
  if (cart.items.length === 0) {
    return <Navigate replace to={ROUTES.cart} />;
  }
  if (!checkoutState || !checkoutState.deliveryMethod) {
    return <Navigate replace to={ROUTES.checkout} />;
  }

  const { deliveryMethod, selectedDeliveryAddressId, selectedBillingAddressId } = checkoutState;
  const totals = calculateCartTotals(cart.items, deliveryMethod);
  
  const isNewCard = paymentMethod === "new_card";
  const isValid = !isNewCard || (
    cardForm.number.length >= 16 &&
    cardForm.expiry.length === 5 &&
    cardForm.cvv.length >= 3 &&
    cardForm.name.trim().length > 0
  );

  const handlePayNow = async () => {
    if (!isValid) return;
    if (!session.data?.data.user) {
      setError("You must be logged in to complete payment.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Derive delivery address object from the address ID stored in state
      // (the full address is not passed in current flow; the backend handles
      //  delivery details as an optional field — store_pickup mode needs none)
      const result = await checkout.mutateAsync({
        lines: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          rentalPeriod: {
            startsAt: item.startsAt,
            endsAt: item.endsAt,
            unit: item.rentalUnit,
            quantity: 1,
            timezone: "Asia/Kolkata",
          },
        })),
        deliveryMethod: deliveryMethod === "delivery" ? "delivery" : "pickup",
        idempotencyKey: `checkout_${Date.now()}_${session.data?.data?.user?.id ?? "anon"}`,
      });

      const { order, invoiceNumber, paymentReference } = result.data;

      const checkoutOrder: CheckoutOrder = {
        id: order.id,
        number: order.number,
        customerName: session.data?.data?.user?.name || "Customer",
        email: session.data?.data?.user?.email || "",
        phone: "+91 0000000000",
        fulfillmentMode: deliveryMethod,
        address: selectedDeliveryAddressId || undefined,
        items: cart.items,
        totals,
        createdAt: order.createdAt,
        invoiceNumber,
        paymentReference,
      };

      cart.clearCart();
      navigate(ROUTES.checkoutSuccess, { replace: true, state: { order: checkoutOrder } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Breadcrumbs separator=">" aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Typography color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.cart)}>
          Cart
        </Typography>
        <Typography color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.checkout)}>
          Address
        </Typography>
        <Typography color="primary" sx={{ fontWeight: "bold" }}>Payment</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
        Payment
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT: PAYMENT DETAILS */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            
            {/* Payment Method */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Payment Method
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <RadioGroup 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Stack spacing={2}>
                    {SAVED_CARDS.map(card => (
                      <Box key={card.id} sx={{ p: 2, border: "1px solid", borderColor: paymentMethod === card.id ? "primary.main" : "divider", borderRadius: 1 }}>
                        <FormControlLabel 
                          value={card.id}
                          control={<Radio />} 
                          sx={{ width: "100%", alignItems: "center", m: 0 }}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography sx={{ fontWeight: "bold" }}>{card.brand} ending in {card.masked.slice(-4)}</Typography>
                              <Typography variant="body2" color="text.secondary">Expires {card.expiry}</Typography>
                            </Box>
                          }
                        />
                      </Box>
                    ))}

                    <Box sx={{ p: 2, border: "1px solid", borderColor: isNewCard ? "primary.main" : "divider", borderRadius: 1 }}>
                      <FormControlLabel 
                        value="new_card"
                        control={<Radio />} 
                        sx={{ width: "100%", alignItems: "center", m: 0 }}
                        label={<Typography sx={{ ml: 1, fontWeight: "bold" }}>Use a new credit or debit card</Typography>}
                      />
                      
                      {isNewCard && (
                        <Box sx={{ mt: 3, ml: 4 }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                              <TextField 
                                label="Card Number" 
                                placeholder="0000 0000 0000 0000"
                                fullWidth 
                                required
                                value={cardForm.number}
                                onChange={e => setCardForm({...cardForm, number: e.target.value})}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4 }}>
                              <TextField 
                                label="Expiry (MM/YY)" 
                                placeholder="MM/YY"
                                fullWidth 
                                required
                                value={cardForm.expiry}
                                onChange={e => setCardForm({...cardForm, expiry: e.target.value})}
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 4 }}>
                              <TextField 
                                label="CVV" 
                                placeholder="123"
                                type="password"
                                fullWidth 
                                required
                                value={cardForm.cvv}
                                onChange={e => setCardForm({...cardForm, cvv: e.target.value})}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <TextField 
                                label="Cardholder Name" 
                                fullWidth 
                                required
                                value={cardForm.name}
                                onChange={e => setCardForm({...cardForm, name: e.target.value})}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <FormControlLabel
                                control={<Checkbox checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />}
                                label="Save my payment details for future use"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery & Billing Summary */}
            <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Delivery & Billing Summary
                  </Typography>
                  <IconButton size="small" component={RouterLink} to={ROUTES.checkout} title="Edit Address">
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>Fulfillment</Typography>
                    <Typography variant="body2">
                      {deliveryMethod === "delivery" ? "Standard Delivery" : "Store Pickup"}
                    </Typography>
                  </Grid>
                  {deliveryMethod === "delivery" && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>Delivery To</Typography>
                      <Typography variant="body2">Saved Address ({selectedDeliveryAddressId})</Typography>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold" }}>Billing Address</Typography>
                    <Typography variant="body2">
                      {selectedBillingAddressId === selectedDeliveryAddressId 
                        ? "Same as delivery address" 
                        : `Saved Address (${selectedBillingAddressId})`}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* RIGHT: ORDER SUMMARY PANEL */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ position: "sticky", top: 24 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Order Summary
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  {cart.items.map(item => (
                    <Box key={item.id} sx={{ display: "flex", gap: 2 }}>
                      <Box 
                        component="img" 
                        src="https://placehold.co/60x60/EEE/31343C?text=Prod"
                        alt={item.productName}
                        sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 1 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", lineHeight: 1.2, mb: 0.5 }}>
                          {item.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Qty: {item.quantity} {item.variantName && `• ${item.variantName}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {dayjs(item.startsAt).format("MMM D")} - {dayjs(item.endsAt).format("MMM D")}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                        ₹{getCartItemRentalAmount(item)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(totals.rental)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Delivery Charges</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(totals.delivery)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Security Deposit</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(totals.deposit)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Taxes</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(totals.tax)}</Typography>
                  </Stack>
                </Stack>
                
                <Divider sx={{ mb: 3 }} />
                
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 4, alignItems: "center" }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>Total</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    {formatMoney(totals.total)}
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large" 
                    onClick={handlePayNow}
                    disabled={!isValid || isProcessing}
                  >
                    {isProcessing ? <CircularProgress size={24} color="inherit" /> : `Pay Now ${formatMoney(totals.total)}`}
                  </Button>
                  <Button 
                    component={RouterLink}
                    to={ROUTES.checkout}
                    variant="text" 
                    fullWidth 
                    disabled={isProcessing}
                  >
                    {"< Back to Address"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
