import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { useOrdersQuery } from "../services/queries";

export function OrdersPage() {
  const orders = useOrdersQuery();

  if (orders.isLoading) return <LoadingState label="Loading rental orders" />;
  if (orders.isError || !orders.data)
    return <ErrorState message="Rental orders could not be loaded." />;

  return (
    <>
      <PageHeader
        description="Route-ready placeholder for the Phase 7 order workspace."
        title="Rental Orders"
      />
      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            {orders.data.data.map((order) => (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                key={order.id}
                sx={{
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: 1.5,
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <Typography sx={{ fontWeight: 700 }}>
                    {order.number}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {order.customer.name} · {order.lines[0]?.productName}
                  </Typography>
                </div>
                <StatusChip status={order.status} />
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
