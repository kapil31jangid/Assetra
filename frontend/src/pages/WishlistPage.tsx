import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { ProductVisual } from "../features/catalog/ProductVisual";
import { useWishlist } from "../features/catalog/useWishlist";
import { ROUTES } from "../constants/routes";
import { useProductsQuery } from "../services/queries";
import {
  formatMoney,
  getProductDailyRate,
  getProductDetailRoute,
} from "../utils/catalog";

export function WishlistPage() {
  const products = useProductsQuery({ pageSize: 100 });
  const wishlist = useWishlist();

  if (products.isLoading) return <LoadingState label="Loading wishlist" />;
  if (products.isError || !products.data)
    return <ErrorState message="Wishlist products could not be loaded." />;

  const savedProducts = products.data.data.filter((product) =>
    wishlist.wishlist.includes(product.id),
  );

  return (
    <>
      <PageHeader
        description="Saved products stay here while you compare rentals."
        title="Wishlist"
      />

      {savedProducts.length === 0 ? (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h3">No saved products yet</Typography>
              <Typography color="text.secondary" variant="body2">
                Save products from the catalog to compare them later.
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
        <Grid container spacing={2}>
          {savedProducts.map((product) => (
            <Grid key={product.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ height: "100%", overflow: "hidden" }}>
                <ProductVisual compact product={product} />
                <CardContent>
                  <Typography variant="h3">{product.name}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                    {product.category.name} · {formatMoney(getProductDailyRate(product))} per day
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      component={RouterLink}
                      to={getProductDetailRoute(product.id)}
                      variant="contained"
                    >
                      Configure
                    </Button>
                    <Button
                      color="secondary"
                      onClick={() => wishlist.toggleWishlist(product.id)}
                      startIcon={<FavoriteOutlinedIcon />}
                      variant="outlined"
                    >
                      Remove
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
