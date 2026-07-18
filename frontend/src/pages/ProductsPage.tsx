import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { ProductVisual } from "../features/catalog/ProductVisual";
import { useProductConfiguration } from "../features/products/productConfig";
import { useProductsQuery } from "../services/queries";
import type { ProductRepairStatus } from "../types";
import { formatMoney, getProductDailyRate } from "../utils/catalog";

const repairStatuses: ProductRepairStatus[] = [
  "ready",
  "maintenance",
  "repair",
  "retired",
];

export function ProductsPage() {
  const products = useProductsQuery({ pageSize: 100 });
  const [selectedProductId, setSelectedProductId] = useState("");
  const productItems = products.data?.data ?? [];
  const configStore = useProductConfiguration(productItems);

  if (products.isLoading) return <LoadingState label="Loading products" />;
  if (products.isError || !products.data)
    return <ErrorState message="Products could not be loaded." />;

  const selectedProduct =
    productItems.find((product) => product.id === selectedProductId) ??
    productItems[0];
  const config = selectedProduct ? configStore.getConfig(selectedProduct) : null;

  return (
    <>
      <PageHeader
        description="Configure products, variants, deposits, stock, padding, and late fee policy."
        title="Products"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={1.5}>
            {productItems.map((product) => (
              <Card
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                sx={{
                  borderColor:
                    selectedProduct?.id === product.id ? "primary.main" : "divider",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <ProductVisual compact product={product} />
                <CardContent>
                  <Typography variant="h3">{product.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {product.category.name} · {product.brand ?? "Assetra"}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={`${product.stock.available} available`} size="small" />
                    <Chip
                      label={formatMoney(getProductDailyRate(product))}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          {selectedProduct && config ? (
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography variant="h2">{selectedProduct.name}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                        {selectedProduct.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="body2">Active</Typography>
                      <Switch
                        checked={config.active}
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            active: event.target.checked,
                          })
                        }
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography sx={{ mb: 2 }} variant="h3">
                    General and rental settings
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Repair status"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            repairStatus: event.target.value as ProductRepairStatus,
                          })
                        }
                        select
                        value={config.repairStatus}
                      >
                        {repairStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Available stock"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            availableStock: Number(event.target.value),
                          })
                        }
                        type="number"
                        value={config.availableStock}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Deposit amount"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            depositAmount: Number(event.target.value),
                          })
                        }
                        type="number"
                        value={config.depositAmount}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Late fee per hour"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            lateFeePerHour: Number(event.target.value),
                          })
                        }
                        type="number"
                        value={config.lateFeePerHour}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Pickup padding minutes"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            pickupPaddingMinutes: Number(event.target.value),
                          })
                        }
                        type="number"
                        value={config.pickupPaddingMinutes}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Return padding minutes"
                        onChange={(event) =>
                          configStore.updateConfig(selectedProduct.id, {
                            returnPaddingMinutes: Number(event.target.value),
                          })
                        }
                        type="number"
                        value={config.returnPaddingMinutes}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography sx={{ mb: 2 }} variant="h3">
                    Attributes and variants
                  </Typography>
                  <Grid container spacing={1.5}>
                    {selectedProduct.variants.map((variant) => (
                      <Grid key={variant.id} size={{ xs: 12, md: 6 }}>
                        <Box
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 1.5,
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }} variant="body2">
                            {variant.name}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {variant.sku} · {variant.stock.total} total ·{" "}
                            {variant.repairStatus}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    {selectedProduct.attributes.flatMap((attribute) =>
                      attribute.values.map((value) => (
                        <Chip
                          key={`${attribute.id}_${value.id}`}
                          label={`${attribute.name}: ${value.label}`}
                          variant="outlined"
                        />
                      )),
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Alert icon={<SaveOutlinedIcon />} severity="success">
                Changes are saved locally for the mock configuration workspace.
              </Alert>
            </Stack>
          ) : null}
        </Grid>
      </Grid>
    </>
  );
}
