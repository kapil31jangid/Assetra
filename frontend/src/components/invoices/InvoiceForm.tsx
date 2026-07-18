import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import dayjs from "dayjs";

import { PageHeader } from "../PageHeader";
import { InvoiceLinesTable } from "./InvoiceLinesTable";
import { PaymentModal } from "./PaymentModal";
import type { Invoice, InvoiceLine, Product, InvoicePayment } from "../../types";
import { formatMoney } from "../../utils/catalog";

interface InvoiceFormProps {
  invoice: Invoice;
  products: Product[];
  onSave: (invoice: Partial<Invoice>) => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, products, onSave, onCancel }: InvoiceFormProps) {
  const [status, setStatus] = useState<Invoice["status"]>(invoice.status || "draft");
  const [paymentStatus, setPaymentStatus] = useState<Invoice["payment_status"]>(invoice.payment_status || "unpaid");
  
  const [customerInfo, setCustomerInfo] = useState(invoice.customer?.name || "");
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date || dayjs().format("YYYY-MM-DD"));
  const [invoiceAddress, setInvoiceAddress] = useState(invoice.invoice_address || "");
  const [deliveryAddress, setDeliveryAddress] = useState(invoice.delivery_address || "");
  const [lines, setLines] = useState<InvoiceLine[]>(invoice.lines || []);
  const [payments, setPayments] = useState<InvoicePayment[]>(invoice.payments || []);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const untaxedAmount = lines.reduce((acc, line) => acc + (line.qty * line.unit_price), 0);
  const taxAmount = lines.reduce((acc, line) => acc + ((line.qty * line.unit_price * (line.tax_percent || 0)) / 100), 0);
  const totalAmount = untaxedAmount + taxAmount;
  
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = totalAmount - totalPaid;

  const isDraft = status === "draft";

  const handleConfirm = () => {
    setStatus("posted");
    onSave({
      status: "posted",
      lines,
      untaxed_amount: untaxedAmount,
      tax_amount: taxAmount,
      total: totalAmount,
    });
  };

  const handlePayment = (payment: InvoicePayment) => {
    const newPayments = [...payments, payment];
    setPayments(newPayments);
    
    const newTotalPaid = newPayments.reduce((acc, p) => acc + p.amount, 0);
    const newPaymentStatus = newTotalPaid >= totalAmount ? "paid" : "partially_paid";
    setPaymentStatus(newPaymentStatus);
    
    onSave({ payments: newPayments, payment_status: newPaymentStatus });
  };

  return (
    <Box>
      <PageHeader
        actions={
          <Stack direction="row" spacing={1}>
            <Button onClick={onCancel}>Back to Orders / Cancel</Button>
            {isDraft && (
              <Button
                disabled={lines.length === 0}
                onClick={handleConfirm}
                variant="contained"
              >
                Confirm Invoice
              </Button>
            )}
          </Stack>
        }
        title={isDraft ? "Draft Invoice" : `Invoice ${invoice.invoice_number || invoice.number}`}
        description={`Source Order: ${invoice.order_id || 'Unknown'}`}
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2, bgcolor: "background.default" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {isDraft ? (
              <>
                <Button onClick={handleConfirm} variant="contained" size="small">Confirm</Button>
                <Button onClick={onCancel} color="error" size="small">Cancel</Button>
              </>
            ) : (
              <>
                <Button variant="contained" size="small" onClick={() => setIsSent(true)} disabled={isSent}>
                  {isSent ? "Sent" : "Send"}
                </Button>
                <Button variant="outlined" size="small" onClick={() => window.print()}>Print</Button>
                {paymentStatus !== "paid" && (
                  <Button variant="contained" color="success" size="small" onClick={() => setIsPaymentModalOpen(true)}>
                    Pay
                  </Button>
                )}
              </>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Stack direction="row" spacing={1}>
              {paymentStatus === "paid" && <Chip label="Paid" color="success" size="small" />}
              {paymentStatus === "partially_paid" && <Chip label="Partially Paid" color="warning" size="small" />}
              
              <Typography variant="body2" sx={{ alignSelf: "center", fontWeight: "bold" }}>
                {status === "draft" && "Draft"}
                {status === "posted" && "Posted"}
                {status === "cancelled" && "Cancelled"}
              </Typography>
            </Stack>
          </Stack>
        </Box>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Customer"
                  value={customerInfo}
                  disabled
                />
                <TextField
                  fullWidth
                  label="Invoice Address"
                  value={invoiceAddress}
                  onChange={(e) => setInvoiceAddress(e.target.value)}
                  multiline
                  rows={2}
                  disabled={!isDraft}
                />
                <TextField
                  fullWidth
                  label="Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  multiline
                  rows={2}
                  disabled={!isDraft}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={!isDraft}
                />
              </Stack>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Invoice Lines</Typography>
            <InvoiceLinesTable lines={lines} onChange={setLines} products={products} readOnly={!isDraft} />
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
                {payments.length > 0 && (
                  <>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="success.main">Amount Paid:</Typography>
                      <Typography color="success.main">-{formatMoney({ amount: totalPaid, currency: "USD" })}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight="bold">Amount Due:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold">{formatMoney({ amount: balanceDue, currency: "USD" })}</Typography>
                    </Stack>
                  </>
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <PaymentModal 
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePayment}
        maxAmount={balanceDue}
      />
    </Box>
  );
}
