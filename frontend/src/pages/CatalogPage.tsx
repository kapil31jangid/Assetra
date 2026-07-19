import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/GridLegacy";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Pagination from "@mui/material/Pagination";
import { Link as RouterLink, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
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

const getUnique = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort();

const searchParam = (params: URLSearchParams, key: string) =>
  params.get(key) ?? "";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const allProducts = useProductsQuery({ pageSize: 100 });
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const currentBrands = searchParam(searchParams, "brand").split(",").filter(Boolean);
  const currentColor = searchParam(searchParams, "color");
  const currentUnit = searchParam(searchParams, "unit");
  const minPrice = searchParam(searchParams, "minPrice") ? Number(searchParam(searchParams, "minPrice")) : 0;
  const maxPrice = searchParam(searchParams, "maxPrice") ? Number(searchParam(searchParams, "maxPrice")) : 5000;
  const currentSearch = searchParam(searchParams, "search");
  
  const [priceRange, setPriceRange] = useState<number[]>([minPrice, maxPrice]);

  const query: ProductListQuery = {
    pageSize: 24, // Let's say we handle paging manually for now
    search: currentSearch || undefined,
    brand: currentBrands.length === 1 ? currentBrands[0] : undefined,
    color: currentColor || undefined,
    rentalUnit: currentUnit === "hour" ? "hourly" : currentUnit === "day" ? "daily" : currentUnit === "week" ? "weekly" : currentUnit === "month" ? "monthly" : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
  };
  const productsReq = useProductsQuery(query);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleBrandToggle = (brand: string) => {
    let nextBrands = [...currentBrands];
    if (nextBrands.includes(brand)) {
      nextBrands = nextBrands.filter((b) => b !== brand);
    } else {
      nextBrands.push(brand);
    }
    updateFilter("brand", nextBrands.join(","));
  };

  const handlePriceChangeCommitted = (event: Event | React.SyntheticEvent<Element, Event>, value: number | number[]) => {
    const [min, max] = value as number[];
    const next = new URLSearchParams(searchParams);
    if (min > 0) next.set("minPrice", min.toString());
    else next.delete("minPrice");
    
    if (max < 5000) next.set("maxPrice", max.toString());
    else next.delete("maxPrice");
    
    setSearchParams(next);
  };

  const resetFilters = () => {
    setPriceRange([0, 5000]);
    setSearchParams(new URLSearchParams(currentSearch ? `search=${currentSearch}` : ""));
  };

  const optionProducts = allProducts.data?.data ?? [];
  const brandOptions = getUnique(optionProducts.map((product) => product.brand));
  const colorOptions = getUnique(optionProducts.flatMap((product) => product.colors ?? []));

  if (productsReq.isLoading || allProducts.isLoading)
    return <LoadingState label="Loading catalog" />;
  if (productsReq.isError || !productsReq.data)
    return <ErrorState message="Catalog products could not be loaded." />;

  // Filter Goods and Published
  let filteredProducts = productsReq.data.data.filter(
    p => p.type === "goods" && p.published !== false
  );
  
  // Apply frontend filters
  if (currentBrands.length > 0) {
    filteredProducts = filteredProducts.filter(p => p.brand && currentBrands.includes(p.brand));
  }
  if (currentColor) {
    filteredProducts = filteredProducts.filter(p => p.colors?.includes(currentColor));
  }
  if (currentUnit) {
    const rentalUnit = currentUnit === "hour" ? "hourly" : currentUnit === "day" ? "daily" : currentUnit === "week" ? "weekly" : currentUnit === "month" ? "monthly" : currentUnit;
    filteredProducts = filteredProducts.filter(p => p.rentalUnits?.includes(rentalUnit));
  }
  filteredProducts = filteredProducts.filter(p => {
    const rate = getProductDailyRate(p).amount;
    return rate >= priceRange[0] && rate <= priceRange[1];
  });

  return (
    <Box>
      {/* Page Header Area */}
      <Box sx={{ mb: 4, mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" fontWeight="bold">Rental Equipment Catalog</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* LEFT SIDEBAR */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterListIcon fontSize="small" />
                <Typography variant="h6" fontWeight="bold">Filters</Typography>
              </Stack>
              <Button size="small" onClick={resetFilters} sx={{ textTransform: "none" }}>Clear All</Button>
            </Stack>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Search products"
              value={currentSearch}
              onChange={(event) => updateFilter("search", event.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>Brand</Typography>
              <Stack spacing={0}>
                {brandOptions.map(brand => (
                  <FormControlLabel
                    key={brand}
                    control={
                      <Checkbox 
                        size="small" 
                        checked={currentBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                      />
                    }
                    label={<Typography variant="body2">{brand}</Typography>}
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {colorOptions.map(color => {
                  const isSelected = currentColor === color;
                  return (
                    <Box
                      key={color}
                      onClick={() => updateFilter("color", isSelected ? "" : color)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: color.toLowerCase(), // basic fallback
                        border: isSelected ? "2px solid #000" : "1px solid #ccc",
                        cursor: "pointer",
                        position: 'relative',
                        "&:hover": { opacity: 0.8 }
                      }}
                      title={color}
                    >
                      {isSelected && (
                        <Box sx={{ 
                          position: 'absolute', top: '50%', left: '50%', 
                          transform: 'translate(-50%, -50%)', 
                          width: 12, height: 12, bgcolor: '#fff', borderRadius: '50%' 
                        }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>Duration</Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={currentUnit}
                onChange={(e) => updateFilter("unit", e.target.value)}
              >
                <MenuItem value="">Any Duration</MenuItem>
                <MenuItem value="hour">1 Hour</MenuItem>
                <MenuItem value="day">1 Day</MenuItem>
                <MenuItem value="week">1 Week</MenuItem>
                <MenuItem value="month">1 Month</MenuItem>
                <MenuItem value="year">1 Year</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: "bold" }}>
                Price Range
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as number[])}
                onChangeCommitted={handlePriceChangeCommitted}
                valueLabelDisplay="on"
                min={0}
                max={5000}
                step={50}
                sx={{ px: 1 }}
              />
            </Box>

          </Paper>
        </Grid>

        {/* RIGHT MAIN AREA */}
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredProducts.length} results {currentSearch ? `for "${currentSearch}"` : ""}
            </Typography>
          </Box>

          {filteredProducts.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found matching your filters
              </Typography>
              <Button variant="outlined" onClick={resetFilters} sx={{ mt: 2 }}>
                Clear Filters
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.map((product) => {
                const rate = getProductDailyRate(product);
                const wishlisted = isWishlisted(product.id);
                const outOfStock = product.stock.available <= 0;

                return (
                  <Grid key={product.id} item xs={12} sm={6} lg={4}>
                    <Card 
                      sx={{ 
                        height: "100%", 
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: "hidden",
                        position: 'relative',
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 4,
                          "& .price-box": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText"
                          }
                        },
                        opacity: outOfStock ? 0.7 : 1,
                      }}
                      onClick={() => navigate(getProductDetailRoute(product.id))}
                    >
                      <Box sx={{ cursor: 'pointer', position: 'relative' }}>
                        <ProductVisual compact product={product} />
                        {outOfStock && (
                          <Box sx={{ 
                            position: 'absolute', top: 10, left: 10, 
                            bgcolor: 'error.main', color: 'white', 
                            px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold', fontSize: '0.75rem' 
                          }}>
                            Out of Stock
                          </Box>
                        )}
                        <IconButton
                          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                          color={wishlisted ? "secondary" : "default"}
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                          sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255,255,255,0.7)', "&:hover": { bgcolor: 'rgba(255,255,255,0.9)' } }}
                        >
                          {wishlisted ? <FavoriteOutlinedIcon /> : <FavoriteBorderOutlinedIcon />}
                        </IconButton>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          {product.brand ?? "Assetra"}
                        </Typography>
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 1, lineHeight: 1.2 }}>
                          {product.name}
                        </Typography>
                        
                        <Box sx={{ mt: 'auto', pt: 2 }}>
                          <Box 
                            className="price-box"
                            sx={{ 
                              display: 'inline-block',
                              bgcolor: 'action.hover',
                              px: 1.5, py: 0.5,
                              borderRadius: 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold" component="span">
                              {formatMoney(rate)}
                            </Typography>
                            <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
                              Rent / per {product.rentalPeriodicity || 'day'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {filteredProducts.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
              <Pagination count={3} color="primary" />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
