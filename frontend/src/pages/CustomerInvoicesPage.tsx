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

import { PageHeader } from "../components/PageHeader";
import { getCustomerInvoices } from "../features/customer-account/accountData";
import { formatMoney } from "../utils/catalog";

export function CustomerInvoicesPage() {
  const invoices = getCustomerInvoices();

  return (
    <>
      <PageHeader
        description="Access invoice previews for completed and current rentals."
        title="My Invoices"
      />

      <Grid container spacing={2}>
        {invoices.map((invoice) => (
          <Grid key={invoice.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "space-between", mb: 2 }}
                >
                  <div>
                    <Typography variant="h3">{invoice.number}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Order {invoice.orderNumber}
                    </Typography>
                  </div>
                  <Chip
                    color={invoice.status === "paid" ? "success" : "info"}
                    label={invoice.status}
                    size="small"
                    sx={{ textTransform: "capitalize" }}
                  />
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Issued
                    </Typography>
                    <Typography variant="body2">{invoice.issuedAt.slice(0, 10)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Due
                    </Typography>
                    <Typography variant="body2">{invoice.dueAt}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Total</Typography>
                    <Typography variant="h4">{formatMoney(invoice.total)}</Typography>
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
