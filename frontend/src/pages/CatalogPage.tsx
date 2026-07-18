import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { ProductVisual } from "../features/catalog/ProductVisual";
import { useWishlist } from "../features/catalog/useWishlist";
import type { ProductListQuery } from "../services/api-contract";
import { useProductsQuery } from "../services/queries";
import { RENTAL_PERIOD_UNITS, type Product } from "../types";
import {
  formatMoney,
  getProductDailyRate,
  getProductDetailRoute,
} from "../utils/catalog";

const availabilityLabels: Record<Product["availabilityStatus"], string> = {
  available: "Available",
  partially_available: "Partially available",
  unavailable: "Unavailable",
  maintenance: "Maintenance",
};

const getUnique = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort();

const searchParam = (params: URLSearchParams, key: string) =>
  params.get(key) ?? "";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const allProducts = useProductsQuery({ pageSize: 100 });
  const { isWishlisted, toggleWishlist } = useWishlist();

  const query: ProductListQuery = {
    pageSize: 24,
    search: searchParam(searchParams, "search") || undefined,
    categoryId: searchParam(searchParams, "category") || undefined,
    brand: searchParam(searchParams, "brand") || undefined,
    color: searchParam(searchParams, "color") || undefined,
    rentalUnit:
      (searchParam(searchParams, "unit") as ProductListQuery["rentalUnit"]) ||
      undefined,
    minPrice: searchParam(searchParams, "minPrice")
      ? Number(searchParam(searchParams, "minPrice"))
      : undefined,
    maxPrice: searchParam(searchParams, "maxPrice")
      ? Number(searchParam(searchParams, "maxPrice"))
      : undefined,
    availableFrom: searchParam(searchParams, "availableFrom") || undefined,
    availableTo: searchParam(searchParams, "availableTo") || undefined,
  };
  const products = useProductsQuery(query);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams({});

  const optionProducts = allProducts.data?.data ?? [];
  const categories = optionProducts.map((product) => product.category);
  const categoryOptions = Array.from(
    new Map(categories.map((category) => [category.id, category])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const brandOptions = getUnique(optionProducts.map((product) => product.brand));
  const colorOptions = getUnique(optionProducts.flatMap((product) => product.colors ?? []));

  if (products.isLoading || allProducts.isLoading)
    return <LoadingState label="Loading catalog" />;
  if (products.isError || !products.data)
    return <ErrorState message="Catalog products could not be loaded." />;

  return (
    <>
      <PageHeader
        description="Find rentable equipment, compare availability, and configure the period before checkout."
        title="Catalog"
      />

      <Paper
        sx={{
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          p: 2,
        }}
      >
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search"
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Products, brands, tags"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={searchParam(searchParams, "search")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Category"
              onChange={(event) => updateFilter("category", event.target.value)}
              select
              size="small"
              value={searchParam(searchParams, "category")}
            >
              <MenuItem value="">All</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Brand"
              onChange={(event) => updateFilter("brand", event.target.value)}
              select
              size="small"
              value={searchParam(searchParams, "brand")}
            >
              <MenuItem value="">All</MenuItem>
              {brandOptions.map((brand) => (
                <MenuItem key={brand} value={brand}>
                  {brand}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Color"
              onChange={(event) => updateFilter("color", event.target.value)}
              select
              size="small"
              value={searchParam(searchParams, "color")}
            >
              <MenuItem value="">All</MenuItem>
              {colorOptions.map((color) => (
                <MenuItem key={color} value={color}>
                  {color}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Duration"
              onChange={(event) => updateFilter("unit", event.target.value)}
              select
              size="small"
              value={searchParam(searchParams, "unit")}
            >
              <MenuItem value="">All</MenuItem>
              {RENTAL_PERIOD_UNITS.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Min price"
              onChange={(event) => updateFilter("minPrice", event.target.value)}
              size="small"
              type="number"
              value={searchParam(searchParams, "minPrice")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label="Max price"
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
              size="small"
              type="number"
              value={searchParam(searchParams, "maxPrice")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Available from"
              onChange={(event) =>
                updateFilter("availableFrom", event.target.value)
              }
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="datetime-local"
              value={searchParam(searchParams, "availableFrom")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Available to"
              onChange={(event) =>
                updateFilter("availableTo", event.target.value)
              }
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="datetime-local"
              value={searchParam(searchParams, "availableTo")}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              onClick={resetFilters}
              startIcon={<RestartAltOutlinedIcon />}
              sx={{ height: "100%" }}
              variant="outlined"
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          {products.data.pagination.total} products match your selection.
        </Typography>
      </Stack>

      {products.data.data.length === 0 ? (
        <ErrorState message="No products match these filters." />
      ) : (
        <Grid container spacing={2}>
          {products.data.data.map((product) => {
            const rate = getProductDailyRate(product);
            const wishlisted = isWishlisted(product.id);

            return (
              <Grid key={product.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card sx={{ height: "100%", overflow: "hidden" }}>
                  <ProductVisual compact product={product} />
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        label={availabilityLabels[product.availabilityStatus]}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${product.stock.available} available`}
                        size="small"
                      />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="h3">{product.name}</Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ mt: 0.75 }}
                          variant="body2"
                        >
                          {product.category.name} · {product.brand ?? "Assetra"}
                        </Typography>
                      </Box>
                      <Tooltip
                        title={wishlisted ? "Remove from wishlist" : "Save"}
                      >
                        <IconButton
                          aria-label={
                            wishlisted
                              ? "Remove from wishlist"
                              : "Save to wishlist"
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
                    <Typography sx={{ mt: 1.5 }} variant="body2">
                      {product.description}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h4">
                          {formatMoney(rate)}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          per day · Deposit{" "}
                          {formatMoney(product.depositPolicy.amount)}
                        </Typography>
                      </Box>
                      <Button
                        component={RouterLink}
                        to={getProductDetailRoute(product.id)}
                        variant="contained"
                      >
                        View
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}
