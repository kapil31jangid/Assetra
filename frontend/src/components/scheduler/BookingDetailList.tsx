import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import type { RentalOrder } from "../../types";
import { SCHEDULER_COLORS } from "./Legend";

interface BookingDetailListProps {
  selectedDates: string[];
  orders: RentalOrder[];
}

export function BookingDetailList({ selectedDates, orders }: BookingDetailListProps) {
  const navigate = useNavigate();

  if (selectedDates.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        <Typography>Select a date to view bookings.</Typography>
      </Box>
    );
  }

  // Group orders by selected date if multiple, or just show list for one date
  selectedDates.sort();

  return (
    <Stack spacing={3}>
      {selectedDates.map((date) => {
        // Find orders intersecting this date
        const dayOrders = orders.filter((o) => {
          if (!o.rentalStart || !o.rentalEnd) return false;
          const start = dayjs(o.rentalStart).startOf("day");
          const end = dayjs(o.rentalEnd).startOf("day");
          const target = dayjs(date).startOf("day");
          return (target.isSame(start) || target.isAfter(start)) && (target.isSame(end) || target.isBefore(end));
        });

        return (
          <Box key={date}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {dayjs(date).format("MMM D, YYYY")}
            </Typography>
            {dayOrders.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No bookings for this date.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {dayOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    variant="outlined"
                    sx={{ cursor: "pointer", "&:hover": { borderColor: "primary.main" } }}
                    onClick={() => {
                      // Navigate to orders page, we could use a query param or a specific route
                      navigate(`${ROUTES.orders}?id=${order.id}`);
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography fontWeight="bold">{order.ref || order.number}</Typography>
                          <Typography variant="body2" color="text.secondary">{order.customer?.name}</Typography>
                        </Stack>
                        
                        <Divider />
                        
                        {order.lines.filter(l => !l.isNote).map((line, idx) => (
                          <Stack direction="row" justifyContent="space-between" key={line.id || idx}>
                            <Typography variant="body2">{line.productName}</Typography>
                            <Typography variant="body2">
                              {line.qty} Unit(s) Booked 
                              <span style={{ color: "#888", marginLeft: 4 }}>
                                ({Math.max(0, 5 - line.qty)} Available)
                              </span>
                            </Typography>
                          </Stack>
                        ))}
                        
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {getStatusBadges(order, date).map((b, i) => (
                            <Chip 
                              key={i} 
                              label={b.label} 
                              size="small" 
                              sx={{ bgcolor: b.color, color: "#fff", fontSize: "0.7rem" }} 
                            />
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        );
      })}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Note: All statuses shown reflect product availability.
      </Typography>
    </Stack>
  );
}

function getStatusBadges(order: RentalOrder, targetDate: string) {
  const badges: { label: string; color: string }[] = [];
  const target = dayjs(targetDate).startOf("day");
  const today = dayjs().startOf("day");
  
  if (order.status === "cancelled") {
    badges.push({ label: "Cancelled", color: "#9e9e9e" });
    return badges;
  }
  
  const isPickedUp = !!order.pickup?.confirmed_at;
  const isReturned = !!order.return_data?.actual_return_at;
  
  if (isReturned) {
    badges.push({ label: "Returned", color: "#9e9e9e" });
    return badges;
  }
  
  const start = dayjs(order.rentalStart).startOf("day");
  const end = dayjs(order.rentalEnd).startOf("day");
  
  // Late pickup
  if (target.isSame(today) && today.isAfter(start) && !isPickedUp) {
    badges.push({ label: "Late Pickup", color: SCHEDULER_COLORS.latePickup });
  }
  // Late delivery
  else if (target.isSame(today) && today.isAfter(end) && !isReturned) {
    badges.push({ label: "Late Return", color: SCHEDULER_COLORS.lateDelivery });
  }
  // Pickup today
  else if (target.isSame(start)) {
    badges.push({ label: isPickedUp ? "Picked Up" : "Pickup Today", color: SCHEDULER_COLORS.pickup });
  }
  // Booked
  else {
    badges.push({ label: isPickedUp ? "In Possession" : "Booked", color: SCHEDULER_COLORS.booked });
  }
  
  return badges;
}
