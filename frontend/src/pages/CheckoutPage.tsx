import React, { useState } from "react";
import { Link as RouterLink, useNavigate, Navigate } from "react-router-dom";
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
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import { ROUTES } from "../constants/routes";
import { useCart } from "../features/cart/useCart";
import { calculateCartTotals, getCartItemRentalAmount } from "../features/cart/cart";
import { formatMoney } from "../utils/catalog";

interface Address {
  id: string;
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default: boolean;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  
  // Mock data for addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: "addr_1",
      name: "Nisha Rao",
      address_line: "123 Tech Park Road, Floor 4",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560001",
      country: "India",
      phone: "+91 9876543210",
      is_default: true,
    }
  ]);
  
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "store_pickup">("delivery");
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>(savedAddresses[0]?.id || "");
  
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>(savedAddresses[0]?.id || "");

  // Modal states
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  // New address form state
  const [addressForm, setAddressForm] = useState({
    name: "",
    address_line: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });

  // Derived state
  const requiresDeliveryAddress = deliveryMethod === "delivery";
  const totals = calculateCartTotals(cart.items, deliveryMethod);

  const isValid = () => {
    if (requiresDeliveryAddress && !selectedDeliveryAddressId) return false;
    if (!billingSameAsDelivery && !selectedBillingAddressId) return false;
    return true;
  };

  if (cart.items.length === 0) {
    return <Navigate replace to={ROUTES.cart} />;
  }

  const handleContinue = () => {
    if (!isValid()) return;
    
    // In a real app, we'd save these preferences to the checkout session API
    // Navigate to Payment step
    navigate(ROUTES.checkout + "/payment");
  };

  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: "",
      address_line: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    });
    setAddressModalOpen(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name,
      address_line: addr.address_line,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone,
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.address_line || !addressForm.city || !addressForm.zip || !addressForm.country) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingAddressId) {
      setSavedAddresses(savedAddresses.map(a => a.id === editingAddressId ? { ...a, ...addressForm } : a));
    } else {
      const newAddress = {
        id: `addr_${Date.now()}`,
        ...addressForm,
        is_default: savedAddresses.length === 0,
      };
      setSavedAddresses([...savedAddresses, newAddress]);
      
      // Auto-select if it's the first one
      if (savedAddresses.length === 0) {
        setSelectedDeliveryAddressId(newAddress.id);
        setSelectedBillingAddressId(newAddress.id);
      }
    }
    setAddressModalOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Breadcrumbs separator=">" aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Typography color="text.secondary" sx={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.cart)}>
          Cart
        </Typography>
        <Typography color="primary" sx={{ fontWeight: "bold" }}>Address</Typography>
        <Typography color="text.disabled">Payment</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
        Delivery & Address
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT: DELIVERY METHOD & ADDRESSES */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            
            {/* Delivery Method */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Delivery Method
                </Typography>
                <RadioGroup
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as "delivery" | "store_pickup")}
                >
                  <FormControlLabel 
                    value="delivery" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: "bold" }}>Standard Delivery</Typography>
                        <Typography variant="body2" color="text.secondary">Calculated charge (₹750 flat for demo)</Typography>
                      </Box>
                    }
                    sx={{ mb: 2, alignItems: "flex-start" }}
                  />
                  <FormControlLabel 
                    value="store_pickup" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: "bold" }}>Pick up from Store</Typography>
                        <Typography variant="body2" color="text.secondary">Free • Pickup available at Main Warehouse, Tech Park</Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start" }}
                  />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {requiresDeliveryAddress && (
              <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Delivery Address
                    </Typography>
                    {savedAddresses.length > 0 && (
                      <Button startIcon={<AddIcon />} size="small" onClick={handleOpenNewAddress}>
                        New Address
                      </Button>
                    )}
                  </Stack>

                  {savedAddresses.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4, bgcolor: "background.default", borderRadius: 1 }}>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>No saved addresses found.</Typography>
                      <Button variant="contained" onClick={handleOpenNewAddress}>
                        Add Delivery Address
                      </Button>
                    </Box>
                  ) : (
                    <RadioGroup 
                      value={selectedDeliveryAddressId} 
                      onChange={(e) => setSelectedDeliveryAddressId(e.target.value)}
                    >
                      <Stack spacing={2}>
                        {savedAddresses.map(addr => (
                          <Box key={addr.id} sx={{ p: 2, border: "1px solid", borderColor: selectedDeliveryAddressId === addr.id ? "primary.main" : "divider", borderRadius: 1 }}>
                            <FormControlLabel 
                              value={addr.id}
                              control={<Radio />} 
                              sx={{ width: "100%", alignItems: "flex-start", m: 0 }}
                              label={
                                <Box sx={{ ml: 1, width: "100%" }}>
                                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                    <Typography sx={{ fontWeight: "bold" }}>{addr.name}</Typography>
                                    <IconButton size="small" onClick={(e) => { e.preventDefault(); handleEditAddress(addr); }}>
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    {addr.address_line}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {addr.city}, {addr.state} {addr.zip}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {addr.country} • {addr.phone}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Box>
                        ))}
                      </Stack>
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Billing Address
                </Typography>
                
                <FormControlLabel
                  control={<Switch checked={billingSameAsDelivery} onChange={(e) => setBillingSameAsDelivery(e.target.checked)} />}
                  label="Billing address same as delivery address"
                  sx={{ mb: billingSameAsDelivery ? 0 : 3 }}
                />

                {!billingSameAsDelivery && (
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Select Billing Address</Typography>
                      {savedAddresses.length > 0 && (
                        <Button startIcon={<AddIcon />} size="small" onClick={handleOpenNewAddress}>
                          New Address
                        </Button>
                      )}
                    </Stack>

                    {savedAddresses.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, bgcolor: "background.default", borderRadius: 1 }}>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>No saved addresses found.</Typography>
                        <Button variant="contained" onClick={handleOpenNewAddress}>
                          Add Billing Address
                        </Button>
                      </Box>
                    ) : (
                      <RadioGroup 
                        value={selectedBillingAddressId} 
                        onChange={(e) => setSelectedBillingAddressId(e.target.value)}
                      >
                        <Stack spacing={2}>
                          {savedAddresses.map(addr => (
                            <Box key={addr.id} sx={{ p: 2, border: "1px solid", borderColor: selectedBillingAddressId === addr.id ? "primary.main" : "divider", borderRadius: 1 }}>
                              <FormControlLabel 
                                value={addr.id}
                                control={<Radio />} 
                                sx={{ width: "100%", alignItems: "flex-start", m: 0 }}
                                label={
                                  <Box sx={{ ml: 1, width: "100%" }}>
                                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                      <Typography sx={{ fontWeight: "bold" }}>{addr.name}</Typography>
                                      <IconButton size="small" onClick={(e) => { e.preventDefault(); handleEditAddress(addr); }}>
                                        <EditOutlinedIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                      {addr.address_line}, {addr.city}, {addr.state} {addr.zip}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Box>
                          ))}
                        </Stack>
                      </RadioGroup>
                    )}
                  </Box>
                )}
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
                    <Typography color="text.secondary">Delivery Method</Typography>
                    <Typography sx={{ fontWeight: 500 }}>{deliveryMethod === "delivery" ? "Standard" : "Pickup"}</Typography>
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
                    onClick={handleContinue}
                    disabled={!isValid()}
                  >
                    Continue
                  </Button>
                  <Button 
                    component={RouterLink}
                    to={ROUTES.cart}
                    variant="text" 
                    fullWidth 
                  >
                    {"< Back to Cart"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* NEW/EDIT ADDRESS MODAL */}
      <Dialog open={isAddressModalOpen} onClose={() => setAddressModalOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSaveAddress}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {editingAddressId ? "Edit Address" : "New Address"}
            </Typography>
            <IconButton onClick={() => setAddressModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  label="Full Name" 
                  fullWidth 
                  required
                  value={addressForm.name}
                  onChange={e => setAddressForm({...addressForm, name: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  label="Address Line" 
                  fullWidth 
                  required
                  value={addressForm.address_line}
                  onChange={e => setAddressForm({...addressForm, address_line: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="City" 
                  fullWidth 
                  required
                  value={addressForm.city}
                  onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="State / Province" 
                  fullWidth 
                  value={addressForm.state}
                  onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="Zip / Postal Code" 
                  fullWidth 
                  required
                  value={addressForm.zip}
                  onChange={e => setAddressForm({...addressForm, zip: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField 
                  label="Country" 
                  fullWidth 
                  required
                  value={addressForm.country}
                  onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField 
                  label="Phone Number" 
                  fullWidth 
                  required
                  value={addressForm.phone}
                  onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit">
              Save Address
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
