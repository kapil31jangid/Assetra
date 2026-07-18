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
import { useEffect, useState } from "react";

import { PageHeader } from "../PageHeader";
import { OrderLinesTable } from "./OrderLinesTable";
import type { RentalOrder, RentalOrderLine, Product } from "../../types";
import { formatMoney } from "../../utils/catalog";

// Mock customer list for the search dropdown
const MOCK_CUSTOMERS = [
  { id: "cus_1", name: "Alice Smith" },
  { id: "cus_2", name: "Bob Jones" },
];
// Mock pricelists and templates for the dropdowns
const MOCK_PRICELISTS = [{ id: "pl_1", name: "Default Pricelist" }];
const MOCK_TEMPLATES = [{ id: "tmpl_1", name: "Standard Equipment Rental" }];

interface OrderFormProps {
  order?: RentalOrder;
  products: Product[];
  onSave: (order: Partial<RentalOrder>) => void;
  onCancel: () => void;
}

export function OrderForm({ order, products, onSave, onCancel }: OrderFormProps) {
  const [status, setStatus] = useState<RentalOrder["status"]>(order?.status || "quotation");
  const [customerId, setCustomerId] = useState(order?.customer?.id || "");
  const [invoiceAddress, setInvoiceAddress] = useState(order?.invoiceAddress || "");
  const [deliveryAddress, setDeliveryAddress] = useState(order?.deliveryAddress || "");
  const [rentalStart, setRentalStart] = useState(order?.rentalStart || "");
  const [rentalEnd, setRentalEnd] = useState(order?.rentalEnd || "");
  const [pricelistId, setPricelistId] = useState(order?.pricelistId || "");
  const [quotationTemplateId, setQuotationTemplateId] = useState(order?.quotationTemplateId || "");
  const [lines, setLines] = useState<RentalOrderLine[]>(order?.lines || []);

  const untaxedAmount = lines.reduce((acc, line) => acc + (line.qty * line.unit_price), 0);
  const taxAmount = lines.reduce((acc, line) => acc + ((line.qty * line.unit_price * (line.tax_percent || 0)) / 100), 0);
  const totalAmount = untaxedAmount + taxAmount;

  const handleAction = (newStatus: RentalOrder["status"]) => {
    setStatus(newStatus);
    onSave({
      status: newStatus,
      customer: { id: customerId, name: "Selected Customer", email: "", phone: "" },
      invoiceAddress,
      deliveryAddress,
      rentalStart,
      rentalEnd,
      pricelistId,
      quotationTemplateId,
      lines,
      untaxedAmount,
      taxAmount,
      totalAmount,
    });
  };

  return (
    <Box>
      <PageHeader
        actions={
          <Stack direction="row" spacing={1}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              disabled={!customerId || !rentalStart || !rentalEnd || lines.length === 0}
              onClick={() => handleAction(status)}
              variant="contained"
            >
              Save
            </Button>
          </Stack>
        }
        title={order?.ref ? `Order ${order.ref}` : "New Order / Quotation"}
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2, bgcolor: "background.default" }}>
          <Stack direction="row" spacing={1}>
            {status === "quotation" && (
              <>
                <Button onClick={() => handleAction("quotation_sent")} variant="contained" size="small">Send</Button>
                <Button onClick={() => handleAction("sale_order")} variant="outlined" size="small">Confirm</Button>
                <Button size="small">Print</Button>
              </>
            )}
            {status === "quotation_sent" && (
              <>
                <Button onClick={() => handleAction("sale_order")} variant="contained" size="small">Confirm</Button>
                <Button size="small">Print</Button>
              </>
            )}
            {status === "sale_order" && (
              <>
                <Button variant="contained" size="small" color="primary">Create Invoice</Button>
                <Button variant="contained" size="small" color="success">Pickup</Button>
                <Button size="small">Print</Button>
                <Button onClick={() => handleAction("cancelled")} color="error" size="small">Cancel Order</Button>
              </>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ alignSelf: "center", fontWeight: "bold" }}>
              {status === "quotation" && "Quotation"}
              {status === "quotation_sent" && "Quotation Sent"}
              {status === "sale_order" && "Sale Order Confirmed"}
              {status === "cancelled" && "Cancelled"}
            </Typography>
          </Stack>
        </Box>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  select
                  label="Customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  {MOCK_CUSTOMERS.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Invoice Address"
                  value={invoiceAddress}
                  onChange={(e) => setInvoiceAddress(e.target.value)}
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  multiline
                  rows={2}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Quotation Template"
                  select
                  value={quotationTemplateId}
                  onChange={(e) => setQuotationTemplateId(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {MOCK_TEMPLATES.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Rental Start Date"
                    type="date"
                    value={rentalStart}
                    onChange={(e) => setRentalStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Rental End Date"
                    type="date"
                    value={rentalEnd}
                    onChange={(e) => setRentalEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Stack>
                <TextField
                  fullWidth
                  label="Price List"
                  select
                  value={pricelistId}
                  onChange={(e) => setPricelistId(e.target.value)}
                >
                  <MenuItem value="">Default / All Products</MenuItem>
                  {MOCK_PRICELISTS.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Order Lines</Typography>
            <OrderLinesTable lines={lines} onChange={setLines} products={products} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Box sx={{ width: 300 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Untaxed Amount:</Typography>
                  <Typography>{formatMoney({ amount: untaxedAmount, currency: "USD" })}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Taxes:</Typography>
                  <Typography>{formatMoney({ amount: taxAmount, currency: "USD" })}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">{formatMoney({ amount: totalAmount, currency: "USD" })}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
