import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { OrdersList } from "../components/orders/OrdersList";
import { OrderForm } from "../components/orders/OrderForm";

import { useOrdersQuery, useProductsQuery, useCreateOrderMutation } from "../services/queries";
import type { RentalOrder } from "../types";

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Today" | "Pickup" | "Return" | "Late">("All");
  
  const [editingOrder, setEditingOrder] = useState<RentalOrder | "new" | null>(null);
  
  const ordersQuery = useOrdersQuery({ pageSize: 100 });
  const productsQuery = useProductsQuery({ pageSize: 100 });
  const createOrder = useCreateOrderMutation();

  useEffect(() => {
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

  const handleSave = (orderData: Partial<RentalOrder>) => {
    // Basic mock save implementation
    if (editingOrder === "new") {
      console.log("Saving new order", orderData);
    } else {
      console.log("Updating order", orderData);
    }
    setEditingOrder(null);
    setSearchParams({});
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

      <OrdersList
        orders={filteredOrders}
        view={view}
        onSelectOrder={setEditingOrder}
      />
    </>
  );
}
