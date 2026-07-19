import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export const SCHEDULER_COLORS = {
  booked: "#2196f3", // Blue
  pickup: "#4caf50", // Green
  latePickup: "#ff9800", // Orange
  lateDelivery: "#f44336", // Red
};

export function Legend() {
  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
      <LegendItem color={SCHEDULER_COLORS.booked} label="Booked (Active)" />
      <LegendItem color={SCHEDULER_COLORS.pickup} label="Pickup Today" />
      <LegendItem color={SCHEDULER_COLORS.latePickup} label="Late Pickup" />
      <LegendItem color={SCHEDULER_COLORS.lateDelivery} label="Late Return" />
    </Stack>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}
