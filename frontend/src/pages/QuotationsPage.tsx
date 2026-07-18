import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import {
  useCreateOrderMutation,
  useOrdersQuery,
  useProductsQuery,
} from "../services/queries";
import type { RentalOrder } from "../types";
import { formatMoney, getProductDailyRate } from "../utils/catalog";

const quoteTemplates = [
  "Standard event rental",
  "Corporate AV package",
  "Studio production package",
];

export function QuotationsPage() {
  const orders = useOrdersQuery({
    pageSize: 100,
    status: ["quotation", "quotation_sent"],
  });
  const products = useProductsQuery({ pageSize: 100 });
  const createOrder = useCreateOrderMutation();
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [template, setTemplate] = useState(quoteTemplates[0]);

  if (orders.isLoading || products.isLoading)
    return <LoadingState label="Loading quotations" />;
  if (orders.isError || products.isError || !orders.data || !products.data)
    return <ErrorState message="Quotations could not be loaded." />;

  const quotes = orders.data.data;
  const selectedQuote =
    quotes.find((quote) => quote.id === selectedQuoteId) ?? quotes[0];
  const product =
    products.data.data.find((item) => item.id === selectedProductId) ??
    products.data.data[0];

  const createQuotation = () => {
    if (!product) return;
    const variant = product.variants[0];
    const startsAt = dayjs().add(2, "day").hour(10).minute(0).toISOString();
    const endsAt = dayjs().add(5, "day").hour(10).minute(0).toISOString();

    createOrder.mutate(
      {
        customerId: "cus_quote",
        lines: [
          {
            productId: product.id,
            variantId: variant.id,
            quantity: 1,
            rentalPeriod: {
              startsAt,
              endsAt,
              unit: "daily",
              quantity: 3,
              timezone: "Asia/Kolkata",
            },
          },
        ],
        schedule: {
          mode: "store_pickup",
          scheduledPickupAt: startsAt,
          scheduledReturnAt: endsAt,
          gracePeriodMinutes: 30,
        },
      },
      { onSuccess: () => setBuilderOpen(false) },
    );
  };

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={() => setBuilderOpen(true)}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            Build quote
          </Button>
        }
        description="Manage quote templates, draft quotations, and customer-facing previews."
        title="Quotations"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={1.5}>
            {quotes.map((quote) => (
              <QuotationCard
                key={quote.id}
                onSelect={() => setSelectedQuoteId(quote.id)}
                quote={quote}
                selected={selectedQuote?.id === quote.id}
              />
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Quote preview
              </Typography>
              {selectedQuote ? (
                <Stack spacing={1.5}>
                  <StatusChip status={selectedQuote.status} />
                  <Typography variant="h2">{selectedQuote.number}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {selectedQuote.customer.name} · {selectedQuote.customer.email}
                  </Typography>
                  <Divider />
                  {selectedQuote.lines.map((line) => (
                    <Stack
                      direction="row"
                      key={line.id}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <Typography variant="body2">{line.productName}</Typography>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {formatMoney(line.lineTotal)}
                      </Typography>
                    </Stack>
                  ))}
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Total</Typography>
                    <Typography variant="h4">
                      {formatMoney(selectedQuote.price.total)}
                    </Typography>
                  </Stack>
                  <Button
                    onClick={() => window.print()}
                    startIcon={<PrintOutlinedIcon />}
                    variant="outlined"
                  >
                    Print preview
                  </Button>
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  Build a quotation to preview it here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog fullWidth maxWidth="sm" onClose={() => setBuilderOpen(false)} open={builderOpen}>
        <DialogTitle>Quote builder</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Template"
              onChange={(event) => setTemplate(event.target.value)}
              select
              value={template}
            >
              {quoteTemplates.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Product"
              onChange={(event) => setSelectedProductId(event.target.value)}
              select
              value={selectedProductId || products.data.data[0]?.id || ""}
            >
              {products.data.data.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} · {formatMoney(getProductDailyRate(item))}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
          <Button disabled={createOrder.isPending} onClick={createQuotation} variant="contained">
            Create quote
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function QuotationCard({
  quote,
  selected,
  onSelect,
}: {
  quote: RentalOrder;
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
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h3">{quote.number}</Typography>
              <StatusChip status={quote.status} />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              {quote.customer.name} · {quote.lines[0]?.productName}
            </Typography>
          </div>
          <Chip label={formatMoney(quote.price.total)} />
        </Stack>
      </CardContent>
    </Card>
  );
}
