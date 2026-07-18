import React from "react";
import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";

import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import { getCartItemRentalAmount, type CheckoutOrder } from "../features/cart/cart";
import { ROUTES } from "../constants/routes";
import { formatMoney } from "../utils/catalog";

export function CheckoutSuccessPage() {
  const location = useLocation();
  const order = (location.state as { order?: CheckoutOrder } | null)?.order;

  // Graceful fallback if directly accessed without order context
  if (!order) {
    return <Navigate replace to={ROUTES.root} />;
  }

  const handlePrintInvoice = () => {
    // Note: Ties to the backend's Invoice module. 
    // Triggers a print modal for the specific generated invoice.
    window.print();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      
      {/* Top Actions */}
      <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 3 }}>
        <Button
          onClick={handlePrintInvoice}
          startIcon={<PrintOutlinedIcon />}
          variant="outlined"
          color="inherit"
        >
          Print Invoice
        </Button>
      </Stack>

      <Grid container spacing={4}>
        
        {/* LEFT: CONFIRMATION MESSAGE & RECAP */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            
            {/* Success Banner */}
            <Box sx={{ textAlign: "center", py: 4, bgcolor: "success.light", borderRadius: 2, color: "success.contrastText" }}>
              <CheckCircleIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
                Thank you for your order!
              </Typography>
              <Typography variant="h6">
                Order #{order.number}
              </Typography>
            </Box>

            <Alert severity="success" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              Your Payment has been processed successfully.
            </Alert>

            {/* Delivery & Billing Recap */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                  Delivery & Billing
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold", mb: 0.5 }}>Customer Name</Typography>
                    <Typography variant="body2">{order.customerName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{order.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{order.phone}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold", mb: 0.5 }}>Fulfillment Method</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {order.fulfillmentMode === "delivery" ? "Standard Delivery" : "Store Pickup"}
                    </Typography>
                    
                    {order.fulfillmentMode === "delivery" && order.address && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "bold", mb: 0.5 }}>Delivery Address</Typography>
                        <Typography variant="body2">{order.address}</Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
              <Button component={RouterLink} to={ROUTES.root} variant="contained" size="large">
                Continue Shopping
              </Button>
              <Button component={RouterLink} to={ROUTES.customerOrders} variant="outlined" size="large">
                View Order Details
              </Button>
            </Stack>
            
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
                  {order.items.map((item) => (
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
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(order.totals.rental)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Delivery Charges</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(order.totals.delivery)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Security Deposit</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(order.totals.deposit)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary">Taxes</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{formatMoney(order.totals.tax)}</Typography>
                  </Stack>
                  {order.totals.discount.amount > 0 && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography color="success.main">Discount</Typography>
                      <Typography color="success.main" sx={{ fontWeight: 500 }}>-{formatMoney(order.totals.discount)}</Typography>
                    </Stack>
                  )}
                </Stack>
                
                <Divider sx={{ mb: 3 }} />
                
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>Total Paid</Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    {formatMoney(order.totals.total)}
                  </Typography>
                </Stack>

              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
