import React, { useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import { getCustomerOrders, type CustomerOrderRow } from "../features/customer-account/accountData";
import { formatMoney } from "../utils/catalog";
import { getCartItemRentalAmount } from "../features/cart/cart";
import { ROUTES } from "../constants/routes";

const statusColor: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  quotation: "info",
  confirmed: "success",
  picked_up: "success",
  returned: "default",
  late_return: "error",
  cancelled: "default"
};

export function CustomerOrdersPage() {
  const allOrders = getCustomerOrders(); // From mock data

  // State
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Derivations
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const status = order.status as string;
      const matchStatus = filterStatus === "all" || 
        (filterStatus === "active" && ["confirmed", "picked_up"].includes(status)) ||
        (filterStatus === "completed" && ["returned", "late_return"].includes(status)) ||
        (filterStatus === "cancelled" && status === "cancelled");
      
      const matchSearch = order.number.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchStatus && matchSearch;
    });
  }, [allOrders, filterStatus, searchQuery]);

  const selectedOrder = allOrders.find(o => o.id === selectedOrderId);

  // If an order is selected, show the Order Detail View (Step 6 layout)
  if (selectedOrder) {
    const order = selectedOrder.sourceOrder; // this maps to CheckoutOrder type from mock
    return (
      <Box>
        <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: "center", justifyContent: "space-between" }}>
          <Button 
            startIcon={<ArrowBackOutlinedIcon />} 
            onClick={() => setSelectedOrderId(null)}
            color="inherit"
          >
            Back to Orders
          </Button>
          <Button
            onClick={() => window.print()}
            startIcon={<PrintOutlinedIcon />}
            variant="outlined"
          >
            Download Invoice
          </Button>
        </Stack>

        <Grid container spacing={4}>
          {/* LEFT: ORDER RECAP */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={4}>
              <Box>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    Order {order.number}
                  </Typography>
                  <Chip
                    color={statusColor[selectedOrder.status] || "default"}
                    label={selectedOrder.status.replace("_", " ")}
                    size="small"
                    sx={{ textTransform: "capitalize", fontWeight: "bold" }}
                  />
                </Stack>
                <Typography color="text.secondary">
                  Placed on {dayjs(order.createdAt).format("MMM D, YYYY")}
                </Typography>
              </Box>

              {(selectedOrder.status as string) === "late_return" && (
                <Alert severity="error">
                  This order was returned late. A late fee of ₹500 has been deducted from your security deposit.
                </Alert>
              )}
              {selectedOrder.status === "picked_up" && (
                <Alert severity="info">
                  Your rental is currently active. Please return by {dayjs(order.items[0]?.endsAt).format("MMM D, YYYY")}.
                </Alert>
              )}

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
            </Stack>
          </Grid>

          {/* RIGHT: ORDER SUMMARY */}
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

  // Otherwise, show List View
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 4 }}>
          My Orders
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
          <TextField 
            size="small"
            placeholder="Search by order number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
            slotProps={{
              input: { startAdornment: <SearchOutlinedIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} /> }
            }}
          />
          <TextField
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </Stack>

        {filteredOrders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              {allOrders.length === 0 ? "You haven't placed any orders yet" : "No orders found"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {allOrders.length === 0 ? "Start exploring our catalog to place your first rental." : "Try adjusting your filters or search query."}
            </Typography>
            {allOrders.length === 0 && (
              <Button component={RouterLink} to={ROUTES.root} variant="contained">
                Browse Products
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={3}>
            {filteredOrders.map(order => {
              const firstItem = order.sourceOrder.items[0];
              const moreItemsCount = order.sourceOrder.items.length - 1;
              
              return (
                <Card key={order.id} variant="outlined" sx={{ '&:hover': { borderColor: "primary.main" } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", gap: 3 }}>
                      
                      <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
                        <Box 
                          component="img"
                          src="https://placehold.co/80x80/EEE/31343C?text=Prod"
                          sx={{ width: 80, height: 80, borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
                        />
                        <Box>
                          <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              {order.number}
                            </Typography>
                            <Chip
                              color={statusColor[order.status] || "default"}
                              label={order.status.replace("_", " ")}
                              size="small"
                              sx={{ textTransform: "capitalize", fontWeight: "bold", fontSize: "0.7rem", height: 20 }}
                            />
                          </Stack>
                          
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {firstItem?.productName} {moreItemsCount > 0 && <Typography component="span" color="text.secondary" variant="body2">(+{moreItemsCount} more)</Typography>}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(order.startsAt).format("MMM D, YYYY")} - {dayjs(order.endsAt).format("MMM D, YYYY")}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: { xs: "flex-start", md: "flex-end" }, gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                          {formatMoney(order.total)}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={() => setSelectedOrderId(order.id)}>
                            View Details
                          </Button>
                          <Button size="small" color="inherit" onClick={() => window.print()} title="Download Invoice">
                            <PrintOutlinedIcon fontSize="small" />
                          </Button>
                        </Stack>
                      </Box>
                      
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
