import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { useProductConfiguration } from "../features/products/productConfig";
import { useProductsQuery } from "../services/queries";
import { formatMoney } from "../utils/catalog";

export function PricingPage() {
  const products = useProductsQuery({ pageSize: 100 });
  const productItems = products.data?.data ?? [];
  const configStore = useProductConfiguration(productItems);

  if (products.isLoading) return <LoadingState label="Loading pricing" />;
  if (products.isError || !products.data)
    return <ErrorState message="Pricing data could not be loaded." />;

  const rules = productItems.flatMap((product) =>
    configStore.getPricing(product).map((rule) => ({ product, rule })),
  );
  const selectableRules = rules.filter(({ rule }) => rule.selectable).length;

  return (
    <>
      <PageHeader
        description="Manage mock pricelists, fixed prices, minimum quantities, and selectable rental rules."
        title="Pricing"
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Active rules
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h2">
                {selectableRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Products priced
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h2">
                {productItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Pricelist
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h3">
                Standard Rental
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack spacing={2}>
        {productItems.map((product) => (
          <Card key={product.id}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ justifyContent: "space-between", mb: 2 }}
              >
                <div>
                  <Typography variant="h3">{product.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Deposit {formatMoney(product.depositPolicy.amount)}
                  </Typography>
                </div>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {product.rentalUnits.map((unit) => (
                    <Chip key={unit} label={unit} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>

              <Grid container spacing={1.5}>
                {configStore.getPricing(product).map((rule) => (
                  <Grid key={rule.id} size={{ xs: 12, md: 6, xl: 4 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            sx={{
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography sx={{ textTransform: "capitalize" }} variant="h4">
                              {rule.periodUnit}
                            </Typography>
                            <Switch
                              checked={rule.selectable}
                              onChange={(event) =>
                                configStore.updatePricing({
                                  ...rule,
                                  selectable: event.target.checked,
                                })
                              }
                            />
                          </Stack>
                          <TextField
                            fullWidth
                            label="Fixed price"
                            onChange={(event) =>
                              configStore.updatePricing({
                                ...rule,
                                fixedPrice: Number(event.target.value),
                              })
                            }
                            type="number"
                            value={rule.fixedPrice}
                          />
                          <TextField
                            fullWidth
                            label="Minimum quantity"
                            onChange={(event) =>
                              configStore.updatePricing({
                                ...rule,
                                minimumQuantity: Number(event.target.value),
                              })
                            }
                            type="number"
                            value={rule.minimumQuantity}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );
}
