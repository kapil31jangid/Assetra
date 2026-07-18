import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { ROUTES } from "../constants/routes";
import { useCart } from "../features/cart/useCart";
import { calculateCartTotals, getCartItemRentalAmount } from "../features/cart/cart";

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  
  const [isExpressModalOpen, setExpressModalOpen] = useState(false);
  const [expressForm, setExpressForm] = useState({
    cardNumber: "",
    name: "",
    email: "",
    address: "",
    zipCode: "",
    city: "",
    country: "",
  });
  
  // Handlers
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "ASSET10") {
      setAppliedCoupon("ASSET10");
      setCouponError("");
    } else {
      setAppliedCoupon("");
      setCouponError("Invalid or expired coupon code");
    }
  };

  const handleCheckout = () => {
    navigate(ROUTES.checkout);
  };

  const handleExpressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate fields
    if (!expressForm.cardNumber || !expressForm.name || !expressForm.email || !expressForm.address || !expressForm.city) {
      alert("Please fill in all required fields.");
      return;
    }
    // Simulate API call and redirect
    cart.clearCart();
    setExpressModalOpen(false);
    navigate(ROUTES.checkoutSuccess); // Order confirmation
  };

  const totals = calculateCartTotals(cart.items, "delivery", appliedCoupon);
  
  // Check for mock stock out (If qty > 10)
  const isAnyItemOutOfStock = cart.items.some(item => item.quantity > 10);

  if (cart.items.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 }, textAlign: "center", py: 10 }}>
        <ShoppingBagOutlinedIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
          Your cart is empty
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Looks like you haven't added any products to your rental cart yet.
        </Typography>
        <Button variant="contained" size="large" component={RouterLink} to={ROUTES.root}>
          Browse Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Breadcrumbs separator=">" aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Typography color="primary" sx={{ fontWeight: "bold" }}>Add to Cart</Typography>
        <Typography color="text.disabled">Address</Typography>
        <Typography color="text.disabled">Payment</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
        Order Summary
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT: ORDER SUMMARY & LINE ITEMS */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {cart.items.map((item) => {
              const outOfStock = item.quantity > 10;
              const itemTotal = getCartItemRentalAmount(item);
              
              return (
                <Card key={item.id} variant="outlined" sx={{ borderColor: outOfStock ? "error.main" : "divider" }}>
                  <CardContent sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3, p: 3 }}>
                    <Box 
                      component="img" 
                      src={"https://placehold.co/120x120/EEE/31343C?text=Product"}
                      alt={item.productName}
                      sx={{ width: 120, height: 120, objectFit: "cover", borderRadius: 2 }}
                    />
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{item.productName}</Typography>
                        <IconButton color="error" onClick={() => cart.removeItem(item.id)} size="small">
                          <DeleteOutlinedIcon />
                        </IconButton>
                      </Stack>
                      
                      {item.variantName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                          Variant: {item.variantName}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Rental Period: {dayjs(item.startsAt).format("MMM D, HH:mm")} to {dayjs(item.endsAt).format("MMM D, HH:mm")}
                      </Typography>

                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                          <Stack direction="row" sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                            <IconButton size="small" onClick={() => cart.updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ px: 2, fontWeight: "bold" }}>{item.quantity}</Typography>
                            <IconButton size="small" onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          {outOfStock && (
                            <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>
                              Only 10 available
                            </Typography>
                          )}
                        </Stack>
                        
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                          ₹{itemTotal}
                        </Typography>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Grid>

        {/* RIGHT: CHARGES & ACTIONS */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
                Cart Totals
              </Typography>
              
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Rental Charges</Typography>
                  <Typography sx={{ fontWeight: 500 }}>₹{totals.rental.amount}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Delivery Charges</Typography>
                  <Typography sx={{ fontWeight: 500 }}>₹{totals.delivery.amount}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Security Deposit</Typography>
                  <Typography sx={{ fontWeight: 500 }}>₹{totals.deposit.amount}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Taxes (18%)</Typography>
                  <Typography sx={{ fontWeight: 500 }}>₹{totals.tax.amount}</Typography>
                </Stack>
                {totals.discount.amount > 0 && (
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="success.main">Discount</Typography>
                    <Typography color="success.main" sx={{ fontWeight: 500 }}>- ₹{totals.discount.amount}</Typography>
                  </Stack>
                )}
              </Stack>
              
              <Divider sx={{ mb: 3 }} />
              
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 4, alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  ₹{totals.total.amount}
                </Typography>
              </Stack>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Have a coupon?
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField 
                    size="small" 
                    placeholder="Enter code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    fullWidth
                    disabled={Boolean(appliedCoupon)}
                  />
                  {!appliedCoupon ? (
                    <Button variant="outlined" onClick={handleApplyCoupon} disabled={!couponCode}>
                      Apply
                    </Button>
                  ) : (
                    <Button variant="text" color="error" onClick={() => { setAppliedCoupon(""); setCouponCode(""); }}>
                      Remove
                    </Button>
                  )}
                </Stack>
                {couponError && <Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>{couponError}</Typography>}
                {appliedCoupon && (
                  <Chip label={`Coupon ${appliedCoupon} applied`} color="success" size="small" sx={{ mt: 1 }} />
                )}
              </Box>

              <Stack spacing={2}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  size="large"
                  onClick={() => setExpressModalOpen(true)}
                  disabled={isAnyItemOutOfStock}
                >
                  Pay with Saved Card
                </Button>
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  onClick={handleCheckout}
                  disabled={isAnyItemOutOfStock}
                >
                  Checkout
                </Button>
              </Stack>
              {isAnyItemOutOfStock && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: "block", textAlign: "center" }}>
                  Please remove out of stock items to proceed.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* EXPRESS CHECKOUT MODAL */}
      <Dialog open={isExpressModalOpen} onClose={() => setExpressModalOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleExpressSubmit}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>Express Checkout</Typography>
            <IconButton onClick={() => setExpressModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Payment Details</Typography>
              <TextField 
                label="Card Details (Masked)" 
                placeholder="**** **** **** 1234"
                fullWidth 
                required
                value={expressForm.cardNumber}
                onChange={e => setExpressForm({...expressForm, cardNumber: e.target.value})}
              />

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>Shipping Information</Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Full Name" 
                    fullWidth 
                    required
                    value={expressForm.name}
                    onChange={e => setExpressForm({...expressForm, name: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField 
                    label="Email Address" 
                    type="email"
                    fullWidth 
                    required
                    value={expressForm.email}
                    onChange={e => setExpressForm({...expressForm, email: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    label="Street Address" 
                    fullWidth 
                    required
                    multiline
                    rows={2}
                    value={expressForm.address}
                    onChange={e => setExpressForm({...expressForm, address: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField 
                    label="Zip Code" 
                    fullWidth 
                    required
                    value={expressForm.zipCode}
                    onChange={e => setExpressForm({...expressForm, zipCode: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField 
                    label="City" 
                    fullWidth 
                    required
                    value={expressForm.city}
                    onChange={e => setExpressForm({...expressForm, city: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField 
                    label="Country" 
                    fullWidth 
                    required
                    value={expressForm.country}
                    onChange={e => setExpressForm({...expressForm, country: e.target.value})}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setExpressModalOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit" size="large">
              Pay Now (₹{totals.total.amount})
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
