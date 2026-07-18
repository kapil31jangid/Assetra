import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { InvoiceForm } from "../components/invoices/InvoiceForm";
import { useInvoicesQuery, useProductsQuery, useOrdersQuery } from "../services/queries";
import type { Invoice, InvoiceStatus, RentalOrderLine } from "../types";
import { formatMoney } from "../utils/catalog";

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case "draft": return "default";
    case "posted": return "info";
    case "cancelled": return "error";
    default: return "default";
  }
};

export function OperationsInvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const newFromOrder = searchParams.get("new_from_order");

  const invoices = useInvoicesQuery({ pageSize: 100 });
  const products = useProductsQuery({ pageSize: 100 });
  // In a real app we'd fetch just the specific order, but this is a mock scaffold
  const orders = useOrdersQuery({ pageSize: 100 });

  const [editingInvoice, setEditingInvoice] = useState<Invoice | "new" | null>(null);

  useEffect(() => {
    if (newFromOrder && orders.isSuccess && !editingInvoice) {
      // Find the order
      const order = orders.data?.data.find((o) => o.id === newFromOrder);
      if (order) {
        // Pre-fill invoice with order data
        const newInvoice: Invoice = {
          id: `new_inv_${Date.now()}`,
          order_id: order.id,
          customer_id: order.customerId || order.customer?.id,
          customer: order.customer,
          invoice_address: order.invoiceAddress || "",
          delivery_address: order.deliveryAddress || "",
          status: "draft",
          payment_status: "unpaid",
          lines: order.lines.map((l) => ({
            product_id: l.productId || l.product_id,
            description: l.productName || l.noteText || "Line item",
            qty: l.quantity || l.qty,
            unit: l.unit || "Days",
            unit_price: l.unitPrice?.amount || l.unit_price,
            tax_percent: l.taxPercent || l.tax_percent || 0,
            amount: l.lineTotal?.amount || l.amount || 0,
          })),
          untaxed_amount: order.untaxedAmount || order.price?.rental?.amount || 0,
          tax_amount: order.taxAmount || order.price?.tax?.amount || 0,
          total: order.totalAmount || order.price?.total?.amount || 0,
          payments: [],
        };
        setEditingInvoice(newInvoice);
      } else {
        setEditingInvoice("new");
      }
    }
  }, [newFromOrder, orders.isSuccess]);

  const handleSave = (invoiceData: Partial<Invoice>) => {
    console.log("Saving invoice", invoiceData);
    if (newFromOrder) {
      // Clear URL params
      setSearchParams({});
    }
    setEditingInvoice(null);
  };

  const handleCancel = () => {
    if (newFromOrder) {
      setSearchParams({});
    }
    setEditingInvoice(null);
  };

  if (invoices.isLoading || products.isLoading || orders.isLoading) {
    return <LoadingState label="Loading invoices" />;
  }
  
  if (invoices.isError) {
    return <ErrorState message="Invoices could not be loaded." />;
  }

  if (editingInvoice !== null) {
    const invoiceData = editingInvoice === "new" ? {
      id: `new_inv_${Date.now()}`,
      status: "draft" as InvoiceStatus,
      payment_status: "unpaid" as const,
      lines: [],
      untaxed_amount: 0,
      tax_amount: 0,
      total: 0,
      payments: [],
    } : editingInvoice;

    return (
      <InvoiceForm 
        invoice={invoiceData as Invoice}
        products={products.data?.data || []}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  const invoiceItems = invoices.data?.data || [];

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={() => setEditingInvoice("new")}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            New Invoice
          </Button>
        }
        description="Review invoice state, details, and record payments."
        title="Invoices"
      />

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceItems.map((invoice) => (
              <TableRow
                hover
                key={invoice.id}
                onClick={() => setEditingInvoice(invoice)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{invoice.invoice_number || invoice.number}</TableCell>
                <TableCell>{invoice.customer?.name}</TableCell>
                <TableCell>{invoice.dueAt || "On Receipt"}</TableCell>
                <TableCell>{formatMoney({ amount: invoice.total, currency: "USD" })}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </TableCell>
                <TableCell>
                  {invoice.payment_status === "paid" && <Chip label="Paid" color="success" size="small" />}
                  {invoice.payment_status === "partially_paid" && <Chip label="Partial" color="warning" size="small" />}
                  {(!invoice.payment_status || invoice.payment_status === "unpaid") && <Chip label="Unpaid" size="small" />}
                </TableCell>
              </TableRow>
            ))}
            {invoiceItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
