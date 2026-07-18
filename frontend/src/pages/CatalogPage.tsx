import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { useProductsQuery } from "../services/queries";

export function CatalogPage() {
  const products = useProductsQuery();

  if (products.isLoading) return <LoadingState label="Loading catalog" />;
  if (products.isError || !products.data)
    return <ErrorState message="Catalog products could not be loaded." />;

  return (
    <>
      <PageHeader
        description="Mock-ready customer catalog entry point."
        title="Catalog"
      />
      <Grid container spacing={2}>
        {products.data.data.map((product) => (
          <Grid key={product.id} size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h3">{product.name}</Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.75 }}
                  variant="body2"
                >
                  {product.category.name} · {product.brand ?? "Assetra"}
                </Typography>
                <Typography sx={{ mt: 1.5 }} variant="body2">
                  {product.description}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1.5 }}
                  variant="caption"
                >
                  {product.stock.available} available of {product.stock.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
