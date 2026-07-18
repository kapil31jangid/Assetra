import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ShoppingCartCheckoutOutlinedIcon from "@mui/icons-material/ShoppingCartCheckoutOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import {
  calculateCartTotals,
  getCartItemRentalAmount,
  getRentalQuantity,
} from "../features/cart/cart";
import { useCart } from "../features/cart/useCart";
import { ROUTES } from "../constants/routes";
import { formatMoney } from "../utils/catalog";

export function CartPage() {
  const cart = useCart();
  const totals = calculateCartTotals(cart.items);

  return (
    <>
      <PageHeader
        actions={
          <Button component={RouterLink} to={ROUTES.catalog} variant="outlined">
            Continue browsing
          </Button>
        }
        description="Review configured rentals before checkout."
        title="Cart"
      />

      {cart.items.length === 0 ? (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">Your cart is empty</Typography>
              <Typography color="text.secondary" variant="body2">
                Add a configured rental from the catalog to begin checkout.
              </Typography>
              <Box>
                <Button component={RouterLink} to={ROUTES.catalog} variant="contained">
                  Browse catalog
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2}>
              {cart.items.map((item) => {
                const duration = getRentalQuantity(
                  item.startsAt,
                  item.endsAt,
                  item.rentalUnit,
                );
                const lineTotal = {
                  ...item.unitPrice,
                  amount: getCartItemRentalAmount(item),
                };

                return (
                  <Card key={item.id}>
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h3">{item.productName}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            {item.variantName} · {duration} {item.rentalUnit}
                          </Typography>
                          <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                            {item.startsAt} to {item.endsAt}
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "center" }}
                        >
                          <TextField
                            label="Qty"
                            onChange={(event) =>
                              cart.updateQuantity(
                                item.id,
                                Math.max(1, Number(event.target.value)),
                              )
                            }
                            size="small"
                            slotProps={{ input: { inputProps: { min: 1 } } }}
                            sx={{ width: 92 }}
                            type="number"
                            value={item.quantity}
                          />
                          <IconButton
                            aria-label="Remove item"
                            onClick={() => cart.removeItem(item.id)}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Divider sx={{ my: 2 }} />
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Typography color="text.secondary" variant="body2">
                          Line rental
                        </Typography>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">
                          {formatMoney(lineTotal)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Order summary
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Rental
                    </Typography>
                    <Typography variant="body2">{formatMoney(totals.rental)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Security deposit
                    </Typography>
                    <Typography variant="body2">{formatMoney(totals.deposit)}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography color="text.secondary" variant="body2">
                      Estimated tax
                    </Typography>
                    <Typography variant="body2">{formatMoney(totals.tax)}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="h4">Total due</Typography>
                    <Typography variant="h4">{formatMoney(totals.total)}</Typography>
                  </Stack>
                  <Button
                    component={RouterLink}
                    startIcon={<ShoppingCartCheckoutOutlinedIcon />}
                    to={ROUTES.checkout}
                    variant="contained"
                  >
                    Checkout
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
}
