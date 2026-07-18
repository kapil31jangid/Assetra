import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { useInvoicesQuery } from "../services/queries";
import type { Invoice, InvoiceStatus } from "../types";
import { formatMoney } from "../utils/catalog";

const invoiceColor: Record<InvoiceStatus, "default" | "info" | "success" | "error"> = {
  draft: "default",
  posted: "info",
  paid: "success",
  cancelled: "error",
};

export function OperationsInvoicesPage() {
  const invoices = useInvoicesQuery();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  if (invoices.isLoading) return <LoadingState label="Loading invoices" />;
  if (invoices.isError || !invoices.data)
    return <ErrorState message="Invoices could not be loaded." />;

  const invoiceItems = invoices.data.data;
  const selectedInvoice =
    invoiceItems.find((invoice) => invoice.id === selectedInvoiceId) ??
    invoiceItems[0];

  return (
    <>
      <PageHeader
        description="Review invoice state, details, and print/download placeholders."
        title="Invoices"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={1.5}>
            {invoiceItems.map((invoice) => (
              <InvoiceCard
                invoice={invoice}
                key={invoice.id}
                onSelect={() => setSelectedInvoiceId(invoice.id)}
                selected={selectedInvoice?.id === invoice.id}
              />
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Invoice detail
              </Typography>
              {selectedInvoice ? (
                <Stack spacing={1.5}>
                  <Chip
                    color={invoiceColor[selectedInvoice.status]}
                    label={selectedInvoice.status}
                    sx={{ textTransform: "capitalize", width: "fit-content" }}
                  />
                  <Typography variant="h2">{selectedInvoice.number}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedInvoice.customer.name} · {selectedInvoice.customer.email}
                  </Typography>
                  <Divider />
                  {selectedInvoice.lines.map((line) => (
                    <Stack
                      direction="row"
                      key={line.id}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">{line.description}</Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {formatMoney(line.total)}
                      </Typography>
                    </Stack>
                  ))}
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Tax
                    </Typography>
                    <Typography variant="body2">
                      {formatMoney(selectedInvoice.tax)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Total</Typography>
                    <Typography variant="h4">
                      {formatMoney(selectedInvoice.total)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => window.print()}
                      startIcon={<PrintOutlinedIcon />}
                      variant="outlined"
                    >
                      Print
                    </Button>
                    <Button startIcon={<DownloadOutlinedIcon />} variant="outlined">
                      Download
                    </Button>
                  </Stack>
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function InvoiceCard({
  invoice,
  selected,
  onSelect,
}: {
  invoice: Invoice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      onClick={onSelect}
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        cursor: "pointer",
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <div>
            <Typography variant="h3">{invoice.number}</Typography>
            <Typography color="text.secondary" variant="body2">
              {invoice.customer.name} · due {invoice.dueAt ?? "on receipt"}
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Chip
              color={invoiceColor[invoice.status]}
              label={invoice.status}
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
            <Chip label={formatMoney(invoice.total)} size="small" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
