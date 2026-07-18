import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import dayjs from "dayjs";
import { useMemo } from "react";
import type { RentalOrder } from "../../types";
import { SCHEDULER_COLORS } from "./Legend";

interface MonthCalendarProps {
  currentMonth: dayjs.Dayjs;
  onMonthChange: (date: dayjs.Dayjs) => void;
  selectedDates: string[];
  onSelectDate: (date: string, multiple: boolean) => void;
  orders: RentalOrder[];
  onNewBooking: (date: string) => void;
}

export function MonthCalendar({
  currentMonth,
  onMonthChange,
  selectedDates,
  onSelectDate,
  orders,
  onNewBooking,
}: MonthCalendarProps) {
  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  
  const startDate = startOfMonth.startOf("week");
  const endDate = endOfMonth.endOf("week");

  const calendarGrid = useMemo(() => {
    const grid = [];
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
      grid.push(current);
      current = current.add(1, "day");
    }
    return grid;
  }, [startDate, endDate]);

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => onMonthChange(currentMonth.subtract(1, "month"))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" sx={{ width: 150, textAlign: "center" }}>
            {currentMonth.format("MMMM YYYY")}
          </Typography>
          <IconButton onClick={() => onMonthChange(currentMonth.add(1, "month"))}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Button 
          variant="contained" 
          startIcon={<AddOutlinedIcon />}
          onClick={() => {
            const defaultDate = selectedDates.length > 0 ? selectedDates[0] : dayjs().format("YYYY-MM-DD");
            onNewBooking(defaultDate);
          }}
        >
          New
        </Button>
      </Stack>

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
        <Grid container>
          {WEEKDAYS.map((day) => (
            <Grid item xs={12 / 7} key={day} sx={{ p: 1, borderBottom: "1px solid", borderColor: "divider", textAlign: "center", bgcolor: "background.default" }}>
              <Typography variant="subtitle2" color="text.secondary">{day}</Typography>
            </Grid>
          ))}
          
          {calendarGrid.map((date, i) => {
            const dateStr = date.format("YYYY-MM-DD");
            const isSelected = selectedDates.includes(dateStr);
            const isToday = date.isSame(dayjs(), "day");
            const isCurrentMonth = date.isSame(currentMonth, "month");

            // Compute indicators
            const statuses = getDayStatuses(date, orders);

            return (
              <Grid 
                item 
                xs={12 / 7} 
                key={dateStr}
                onClick={(e) => onSelectDate(dateStr, e.shiftKey)}
                sx={{
                  height: 100,
                  borderBottom: "1px solid",
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid" : "none",
                  borderColor: "divider",
                  p: 1,
                  cursor: "pointer",
                  bgcolor: isSelected ? "primary.50" : (isCurrentMonth ? "transparent" : "background.default"),
                  opacity: isCurrentMonth ? 1 : 0.5,
                  transition: "background-color 0.2s",
                  "&:hover": {
                    bgcolor: isSelected ? "primary.100" : "action.hover",
                  },
                }}
              >
                <Stack spacing={0.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isToday ? "bold" : "normal",
                        color: isToday ? "primary.main" : "text.primary",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        border: isToday ? "2px solid" : "none",
                        borderColor: "primary.main",
                      }}
                    >
                      {date.format("D")}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {statuses.booked && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: SCHEDULER_COLORS.booked }} title="Booked" />}
                    {statuses.pickup && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: SCHEDULER_COLORS.pickup }} title="Pickup" />}
                    {statuses.latePickup && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: SCHEDULER_COLORS.latePickup }} title="Late Pickup" />}
                    {statuses.lateDelivery && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: SCHEDULER_COLORS.lateDelivery }} title="Late Return" />}
                  </Box>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}

function getDayStatuses(date: dayjs.Dayjs, orders: RentalOrder[]) {
  let booked = false;
  let pickup = false;
  let latePickup = false;
  let lateDelivery = false;

  const target = date.startOf("day");
  const today = dayjs().startOf("day");

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    if (order.return_data?.actual_return_at) continue; // Completed

    const start = dayjs(order.rentalStart).startOf("day");
    const end = dayjs(order.rentalEnd).startOf("day");

    // Overlaps?
    if ((target.isSame(start) || target.isAfter(start)) && (target.isSame(end) || target.isBefore(end))) {
      booked = true;
    }

    if (target.isSame(start)) {
      pickup = true;
    }

    // Late pickup: if today is target, and order was supposed to be picked up in the past, and is not picked up
    if (target.isSame(today)) {
      if (today.isAfter(start) && !order.pickup?.confirmed_at) {
        latePickup = true;
      }
      if (today.isAfter(end) && !order.return_data?.actual_return_at) {
        lateDelivery = true;
      }
    }
  }

  return { booked, pickup, latePickup, lateDelivery };
}
