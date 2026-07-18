import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
} from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { ProductVisual } from "../features/catalog/ProductVisual";
import { useWishlist } from "../features/catalog/useWishlist";
import { getRentalQuantity } from "../features/cart/cart";
import { useCart } from "../features/cart/useCart";
import { ROUTES } from "../constants/routes";
import { useProductQuery } from "../services/queries";
import type { RentalPeriodUnit } from "../types";
import { formatMoney, getProductDailyRate } from "../utils/catalog";

const toDateTimeInput = (value: dayjs.Dayjs) => value.format("YYYY-MM-DDTHH:mm");

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const productQuery = useProductQuery(productId);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [startsAt, setStartsAt] = useState(() =>
    toDateTimeInput(dayjs().add(1, "day").hour(10).minute(0)),
  );
  const [endsAt, setEndsAt] = useState(() =>
    toDateTimeInput(dayjs().add(3, "day").hour(10).minute(0)),
  );

  const product = productQuery.data?.data;
  const [selectedUnit, setSelectedUnit] = useState<RentalPeriodUnit>("daily");
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ??
    product?.variants[0];
  const activeUnit = product?.rentalUnits.includes(selectedUnit)
    ? selectedUnit
    : product?.rentalUnits[0];

  const rentalQuantity = activeUnit
    ? getRentalQuantity(startsAt, endsAt, activeUnit)
    : 1;
  const rate = product ? getProductDailyRate(product) : null;
  const estimatedRental = rate
    ? {
        ...rate,
        amount: rate.amount * rentalQuantity * quantity,
      }
    : null;
  const canConfigure = useMemo(
    () =>
      dayjs(endsAt).isAfter(dayjs(startsAt)) &&
      quantity > 0 &&
      quantity <= (selectedVariant?.stock.available ?? 0),
    [endsAt, quantity, selectedVariant?.stock.available, startsAt],
  );

  if (productQuery.isLoading) return <LoadingState label="Loading product" />;
  if (productQuery.isError || !product)
    return <ErrorState message="Product details could not be loaded." />;

  const wishlisted = isWishlisted(product.id);

  return (
    <>
      <PageHeader
        actions={
          <Button
            component={RouterLink}
            startIcon={<ArrowBackOutlinedIcon />}
            to={ROUTES.catalog}
            variant="outlined"
          >
            Catalog
          </Button>
        }
        description={`${product.category.name} · ${product.brand ?? "Assetra"}`}
        title={product.name}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ overflow: "hidden" }}>
            <ProductVisual product={product} />
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  color={
                    product.availabilityStatus === "available"
                      ? "success"
                      : "warning"
                  }
                  label={product.availabilityStatus.replace("_", " ")}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
                <Chip
                  label={`${product.stock.available} of ${product.stock.total} available`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body1">{product.description}</Typography>

              <Divider sx={{ my: 3 }} />

              <Typography sx={{ mb: 1.5 }} variant="h3">
                Variants and attributes
              </Typography>
              <Grid container spacing={1.5}>
                {product.variants.map((variant) => (
                  <Grid key={variant.id} size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor:
                          selectedVariant?.id === variant.id
                            ? "primary.main"
                            : "divider",
                        borderRadius: 1,
                        p: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }} variant="body2">
                        {variant.name}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {variant.sku} · {variant.stock.available} available
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {product.accessories.length ? (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography sx={{ mb: 1.5 }} variant="h3">
                    Included accessories
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", rowGap: 1 }}
                  >
                    {product.accessories.map((accessory) => (
                      <Chip
                        key={accessory.id}
                        label={`${accessory.name} x${accessory.quantityRequired}`}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h2">
                    {rate ? formatMoney(rate) : "Price pending"}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    per day · refundable deposit{" "}
                    {formatMoney(product.depositPolicy.amount)}
                  </Typography>
                </Box>
                <Tooltip title={wishlisted ? "Remove from wishlist" : "Save"}>
                  <IconButton
                    aria-label={
                      wishlisted ? "Remove from wishlist" : "Save to wishlist"
                    }
                    color={wishlisted ? "secondary" : "default"}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    {wishlisted ? (
                      <FavoriteOutlinedIcon />
                    ) : (
                      <FavoriteBorderOutlinedIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Variant"
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                  select
                  value={selectedVariant?.id ?? ""}
                >
                  {product.variants.map((variant) => (
                    <MenuItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Rental unit"
                  onChange={(event) =>
                    setSelectedUnit(event.target.value as RentalPeriodUnit)
                  }
                  select
                  value={activeUnit ?? ""}
                >
                  {product.rentalUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </TextField>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Starts"
                      onChange={(event) => setStartsAt(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      type="datetime-local"
                      value={startsAt}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Returns"
                      onChange={(event) => setEndsAt(event.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      type="datetime-local"
                      value={endsAt}
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Quantity"
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  slotProps={{
                    input: {
                      inputProps: {
                        min: 1,
                        max: selectedVariant?.stock.available,
                      },
                    },
                  }}
                  type="number"
                  value={quantity}
                />

                {!canConfigure ? (
                  <Alert severity="warning">
                    Return time must be after pickup time and quantity must be
                    greater than zero.
                  </Alert>
                ) : null}

                <Box
                  sx={{
                    bgcolor: "background.default",
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      Rental duration
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {rentalQuantity} {activeUnit}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", mt: 1 }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      Estimated rental
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {estimatedRental ? formatMoney(estimatedRental) : "-"}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", mt: 1 }}
                  >
                    <Typography color="text.secondary" variant="body2">
                      Security deposit
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">
                      {formatMoney(product.depositPolicy.amount)}
                    </Typography>
                  </Stack>
                </Box>

                <Button
                  disabled={!canConfigure}
                  onClick={() => {
                    if (!activeUnit || !rate || !selectedVariant) return;

                    cart.addItem({
                      id: `cart_${crypto.randomUUID()}`,
                      productId: product.id,
                      productName: product.name,
                      variantId: selectedVariant.id,
                      variantName: selectedVariant.name,
                      quantity,
                      rentalUnit: activeUnit,
                      startsAt,
                      endsAt,
                      unitPrice: rate,
                      deposit: product.depositPolicy.amount,
                    });
                    navigate(ROUTES.cart);
                  }}
                  startIcon={<ShoppingCartOutlinedIcon />}
                  variant="contained"
                >
                  Add to cart
                </Button>
                <Typography color="text.secondary" variant="caption">
                  You can adjust quantity and continue to checkout from the
                  cart.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
