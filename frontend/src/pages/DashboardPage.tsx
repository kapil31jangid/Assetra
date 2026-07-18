import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { useDashboardSummaryQuery } from "../services/queries";
import { RENTAL_ORDER_STATUS_LABELS } from "../types";

export function DashboardPage() {
  const dashboard = useDashboardSummaryQuery();

  if (dashboard.isLoading) return <LoadingState label="Loading dashboard" />;
  if (dashboard.isError || !dashboard.data)
    return <ErrorState message="Dashboard data could not be loaded." />;

  const summary = dashboard.data.data;

  return (
    <>
      <PageHeader
        description="Mock-backed workspace foundation for admin and vendor roles."
        title="Operations Dashboard"
      />

      <Grid container spacing={2}>
        {summary.kpis.map((kpi) => (
          <Grid key={kpi.key} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {kpi.label}
                </Typography>
                <Typography sx={{ mt: 1 }} variant="h2">
                  {kpi.formattedValue}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                  variant="caption"
                >
                  {kpi.changePercent ?? 0}% this period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">Order Status</Typography>
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {Object.entries(summary.orderStatusCounts).map(
                  ([status, count]) => (
                    <Stack
                      direction="row"
                      key={status}
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <StatusChip
                        status={
                          status as keyof typeof RENTAL_ORDER_STATUS_LABELS
                        }
                      />
                      <Typography variant="body2">{count}</Typography>
                    </Stack>
                  ),
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h3">Upcoming Pickup</Typography>
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {summary.upcomingPickups.map((order) => (
                  <Stack
                    direction="row"
                    key={order.id}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2">{order.number}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {order.customer.name}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
