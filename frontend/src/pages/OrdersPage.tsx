import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/GridLegacy";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { OrdersList } from "../components/orders/OrdersList";
import { OrderForm } from "../components/orders/OrderForm";

import { useOrdersQuery, useProductsQuery, useCreateOrderMutation } from "../services/queries";
import type { CreateRentalOrderRequest } from "../services/api-contract";
import type { RentalOrder } from "../types";

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const initialFilter = searchParams.get("filter");
  const [activeFilter, setActiveFilter] = useState<"All" | "Today" | "Pickup" | "Return" | "Late" | "Active">(
    initialFilter === "late" ? "Late" : initialFilter === "pickup" ? "Pickup" : initialFilter === "today" ? "Today" : initialFilter === "active" ? "Active" : "All",
  );
  
  const [editingOrder, setEditingOrder] = useState<RentalOrder | "new" | null>(null);
  
  const ordersQuery = useOrdersQuery({ pageSize: 100 });
  const productsQuery = useProductsQuery({ pageSize: 100 });
  const createOrder = useCreateOrderMutation();
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "late") setActiveFilter("Late");
    else if (filter === "pickup") setActiveFilter("Pickup");
    else if (filter === "today") setActiveFilter("Today");
    else if (filter === "active") setActiveFilter("Active");
    if (ordersQuery.isSuccess && !editingOrder) {
      const orderId = searchParams.get("id");
      const isNew = searchParams.get("new");
      
      if (orderId) {
        const order = ordersQuery.data?.data.find(o => o.id === orderId);
        if (order) {
          setEditingOrder(order);
        }
      } else if (isNew) {
        setEditingOrder("new");
      }
    }
  }, [searchParams, ordersQuery.isSuccess]);

  const handleSave = async (orderData: Partial<RentalOrder>) => {
    setSaveError(null);
    if (editingOrder === "new") {
      const start = orderData.rentalStart || dayjs().add(1, "day").hour(10).minute(0).format();
      const end = orderData.rentalEnd || dayjs(start).add(1, "day").format();
      const lines = (orderData.lines ?? []).flatMap((line: any) => {
        const productId = line.productId || line.product_id;
        const product = productsQuery.data?.data.find((item) => item.id === productId);
        const variantId = line.variantId || product?.variants?.[0]?.id;
        return productId && variantId ? [{
          productId,
          variantId,
          quantity: Math.max(0, Number(line.quantity ?? line.qty ?? 1)),
          rentalPeriod: { startsAt: start, endsAt: end, unit: "daily" as const, quantity: 1, timezone: "Asia/Kolkata" },
        }] : [];
      });
      if (!lines.length) {
        setSaveError("Add at least one product with an available variant.");
        return;
      }
      try {
        await createOrder.mutateAsync({
          customerId: orderData.customer?.id || "",
          lines,
          schedule: {
            mode: "store_pickup",
            scheduledPickupAt: start,
            scheduledReturnAt: end,
            gracePeriodMinutes: 0,
          },
          pricelistId: orderData.pricelistId,
        } satisfies CreateRentalOrderRequest);
        setEditingOrder(null);
        setSearchParams({});
      } catch {
        setSaveError("Order could not be saved. Check the customer, product, and rental dates.");
      }
    }
  };

  if (ordersQuery.isLoading || productsQuery.isLoading) {
    return <LoadingState label="Loading rental orders" />;
  }
  
  if (ordersQuery.isError) {
    return <ErrorState message="Rental orders could not be loaded." />;
  }

  const allOrders = ordersQuery.data?.data || [];
  
  let filteredOrders = allOrders;
  if (search) {
    filteredOrders = filteredOrders.filter(
      (o) => o.ref?.toLowerCase().includes(search.toLowerCase()) || 
             o.number?.toLowerCase().includes(search.toLowerCase()) ||
             o.customer?.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (activeFilter !== "All") {
    const today = dayjs().format("YYYY-MM-DD");
    filteredOrders = filteredOrders.filter((order) => {
      const pickup = order.rentalStart || order.schedule?.scheduledPickupAt || "";
      const returned = order.rentalEnd || order.schedule?.scheduledReturnAt || "";
      if (activeFilter === "Late") return ["late_pickup", "late_return"].includes(order.status);
      if (activeFilter === "Active") return ["reserved", "picked_up", "late_pickup", "late_return"].includes(order.status);
      if (activeFilter === "Pickup") return order.status === "reserved" || pickup.startsWith(today);
      if (activeFilter === "Return") return order.status === "picked_up" || returned.startsWith(today);
      return pickup.startsWith(today) || returned.startsWith(today);
    });
  }

  if (editingOrder !== null) {
    // When creating new from scheduler, pass the default rentalStart
    const newOrderProps = editingOrder === "new" ? {
      rentalStart: searchParams.get("rentalStart") || "",
    } : undefined;

    return (
      <OrderForm
        order={editingOrder === "new" ? newOrderProps as RentalOrder : editingOrder}
        products={productsQuery.data?.data || []}
        onSave={handleSave}
        onCancel={() => {
          setEditingOrder(null);
          setSearchParams({});
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={() => setEditingOrder("new")}
            startIcon={<AddOutlinedIcon />}
            variant="contained"
          >
            New
          </Button>
        }
        description="Manage your rental orders, quotations, and fulfillments."
        title="Rental Orders"
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Orders"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Order Ref, Customer..."
                size="small"
                value={search}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Tabs
                value={activeFilter}
                onChange={(_, next) => setActiveFilter(next)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 'auto' }}
              >
                <Tab label="All" value="All" sx={{ py: 0.5, minHeight: 'auto' }} />
                <Tab label="Today" value="Today" sx={{ py: 0.5, minHeight: 'auto' }} />
                <Tab label="Pickup" value="Pickup" sx={{ py: 0.5, minHeight: 'auto' }} />
                <Tab label="Return" value="Return" sx={{ py: 0.5, minHeight: 'auto' }} />
                <Tab label="Late" value="Late" sx={{ py: 0.5, minHeight: 'auto' }} />
              </Tabs>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
              <Tabs 
                value={view} 
                onChange={(_, next) => setView(next)}
                sx={{ minHeight: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Tab label="List" value="list" sx={{ py: 0.5, minHeight: 'auto' }} />
                <Tab label="Kanban" value="kanban" sx={{ py: 0.5, minHeight: 'auto' }} />
              </Tabs>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
      <OrdersList
        orders={filteredOrders}
        view={view}
        onSelectOrder={setEditingOrder}
      />
    </>
  );
}
