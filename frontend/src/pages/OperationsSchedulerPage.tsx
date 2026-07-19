import Box from "@mui/material/Box";
import Grid from "@mui/material/GridLegacy";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { MonthCalendar } from "../components/scheduler/MonthCalendar";
import { BookingDetailList } from "../components/scheduler/BookingDetailList";
import { Legend } from "../components/scheduler/Legend";
import { useOrdersQuery } from "../services/queries";
import { ROUTES } from "../constants/routes";

export function OperationsSchedulerPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [selectedDates, setSelectedDates] = useState<string[]>([dayjs().format("YYYY-MM-DD")]);

  const ordersQuery = useOrdersQuery({ pageSize: 500 }); // We want a lot of orders to map a month.

  const handleSelectDate = (date: string, shiftKey: boolean) => {
    if (shiftKey && selectedDates.length > 0) {
      // Range selection logic
      const sorted = [...selectedDates].sort();
      const firstDate = dayjs(sorted[0]);
      const lastDate = dayjs(sorted[sorted.length - 1]);
      const targetDate = dayjs(date);
      
      let start = targetDate.isBefore(firstDate) ? targetDate : firstDate;
      let end = targetDate.isAfter(lastDate) ? targetDate : lastDate;
      
      const newRange = [];
      let current = start;
      while (current.isBefore(end) || current.isSame(end, "day")) {
        newRange.push(current.format("YYYY-MM-DD"));
        current = current.add(1, "day");
      }
      setSelectedDates(newRange);
    } else {
      setSelectedDates([date]);
    }
  };

  const handleMonthChange = (date: dayjs.Dayjs) => {
    setCurrentMonth(date);
    setSelectedDates([]);
  };

  const handleNewBooking = (date: string) => {
    // Navigate to orders with the date passed as query param to pre-fill
    navigate(`${ROUTES.orders}?new=1&rentalStart=${date}`);
  };

  if (ordersQuery.isLoading) return <LoadingState label="Loading schedule" />;
  if (ordersQuery.isError || !ordersQuery.data) return <ErrorState message="Schedule could not be loaded." />;

  const orders = ordersQuery.data.data;

  return (
    <>
      <PageHeader
        description="Visualize bookings, pickups, and returns on a monthly calendar."
        title="Schedule"
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 1, boxShadow: 1 }}>
            <MonthCalendar 
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              selectedDates={selectedDates}
              onSelectDate={handleSelectDate}
              orders={orders}
              onNewBooking={handleNewBooking}
            />
            <Legend />
          </Box>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 1, boxShadow: 1, minHeight: 400 }}>
            <BookingDetailList 
              selectedDates={selectedDates}
              orders={orders}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
