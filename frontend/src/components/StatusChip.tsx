import Chip from "@mui/material/Chip";

import { RENTAL_ORDER_STATUS_LABELS, type RentalOrderStatus } from "../types";

interface StatusChipProps {
  status: RentalOrderStatus;
}

const statusColor: Record<
  RentalOrderStatus,
  "default" | "primary" | "secondary" | "success" | "warning" | "error"
> = {
  draft: "default",
  quotation: "primary",
  quotation_sent: "primary",
  sale_order: "primary",
  confirmed: "secondary",
  invoiced: "secondary",
  reserved: "success",
  picked_up: "success",
  late_pickup: "warning",
  late_return: "error",
  returned: "default",
  cancelled: "default",
};

export function StatusChip({ status }: StatusChipProps) {
  return (
    <Chip
      color={statusColor[status]}
      label={RENTAL_ORDER_STATUS_LABELS[status]}
      size="small"
      variant="outlined"
    />
  );
}
