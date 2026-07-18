import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useSessionQuery, useAttributesQuery, useProductQuery, useCreateProductMutation, useUpdateProductMutation } from "../../services/queries";
import type { Product, ProductAttributeReference, RentalSettings, ProductDeposit } from "../../types";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";

interface ProductFormProps {
  productId: string | null;
  isNew: boolean;
  onClose: () => void;
}

const defaultProduct: Omit<Product, "id"> = {
  name: "",
  image: undefined,
  type: "goods",
  qtyOnHand: 0,
  salesPrice: 0,
  costPrice: 0,
  published: false,
  attributes: [],
  rentalSettings: {
    periodicity: "day",
  },
  deposit: {
    required: false,
    amount: 0,
  },
};

export function ProductForm({ productId, isNew, onClose }: ProductFormProps) {
  const session = useSessionQuery();
  const attributesQuery = useAttributesQuery();
  const productQuery = useProductQuery(productId || undefined);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  const [activeTab, setActiveTab] = useState(0);
  const [product, setProduct] = useState<Omit<Product, "id">>(defaultProduct);
  const [error, setError] = useState<string | null>(null);

  const user = session.data?.data?.user;
  const isAdmin = user?.role === "admin";
  const allAttributes = attributesQuery.data?.data || [];

  useEffect(() => {
    if (!isNew && productQuery.data?.data) {
      const p = productQuery.data.data;
      setProduct({
        name: p.name || "",
        image: p.image,
        type: p.type || "goods",
        qtyOnHand: p.qtyOnHand ?? 0,
        salesPrice: p.salesPrice ?? 0,
        costPrice: p.costPrice ?? 0,
        published: p.published ?? false,
        attributes: p.attributes || [],
        rentalSettings: p.rentalSettings || { periodicity: "day" },
        deposit: p.deposit || { required: false, amount: 0 },
      });
    }
  }, [isNew, productQuery.data]);

  if (!isNew && productQuery.isLoading) return <LoadingState />;
  if (!isNew && productQuery.isError) return <ErrorState />;

  const handleSave = async () => {
    if (!product.name.trim()) return setError("Product Name is required.");
    if (product.salesPrice < 0) return setError("Sales Price cannot be negative.");
    if (product.costPrice < 0) return setError("Cost Price cannot be negative.");
    if (product.type === "goods" && (product.qtyOnHand === undefined || product.qtyOnHand < 0)) return setError("Quantity on Hand must be a non-negative number for goods.");
    if (product.rentalSettings.lateFee && product.rentalSettings.lateFee > 0 && !product.rentalSettings.periodicity) {
      return setError("Periodicity must be selected if Late Fee is specified.");
    }
    if (product.deposit.required && (product.deposit.amount === undefined || product.deposit.amount < 0)) {
      return setError("Security Deposit Amount is required and must be non-negative if a deposit is required.");
    }

    setError(null);
    try {
      if (isNew) {
        await createMutation.mutateAsync(product as Product);
      } else {
        await updateMutation.mutateAsync({ productId: productId!, request: product });
      }
      onClose();
    } catch (e) {
      setError("Failed to save product.");
    }
  };

  const handleAttributeChange = (index: number, attrId: string) => {
    const newAttrs = [...product.attributes];
    newAttrs[index] = { attributeId: attrId, valueIds: [] };
    setProduct({ ...product, attributes: newAttrs });
  };

  const handleValuesChange = (index: number, valIds: string[]) => {
    const newAttrs = [...product.attributes];
    newAttrs[index] = { ...newAttrs[index], valueIds: valIds };
    setProduct({ ...product, attributes: newAttrs });
  };

  const handleAddAttributeLine = () => {
    setProduct({ ...product, attributes: [...product.attributes, { attributeId: "", valueIds: [] }] });
  };

  const handleRemoveAttributeLine = (index: number) => {
    const newAttrs = product.attributes.filter((_, i) => i !== index);
    setProduct({ ...product, attributes: newAttrs });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">{isNew ? "New Product" : `Edit Product: ${product.name}`}</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={onClose}>Discard</Button>
          <Button variant="contained" startIcon={<CheckIcon />} onClick={() => void handleSave()}>Save</Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <TextField
                label="Product Name"
                fullWidth
                required
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                variant="outlined"
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Tooltip title={!isAdmin ? "Only Admin can publish products." : ""}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={product.published}
                        onChange={(e) => setProduct({ ...product, published: e.target.checked })}
                        disabled={!isAdmin}
                      />
                    }
                    label="Published"
                  />
                </Tooltip>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Avatar variant="rounded" sx={{ width: 120, height: 120, mb: 1 }} src={product.image || ""} />
            <Button variant="outlined" size="small" component="label">
              Upload Image
              <input type="file" hidden accept="image/*" />
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="General Information" />
          <Tab label="Attributes & Variants" />
          <Tab label="Sales" />
        </Tabs>
      </Box>

      <Box sx={{ py: 3 }}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Product Type</Typography>
                  <RadioGroup
                    row
                    value={product.type}
                    onChange={(e) => setProduct({ ...product, type: e.target.value as any })}
                  >
                    <FormControlLabel value="goods" control={<Radio />} label="Goods" />
                    <FormControlLabel value="service" control={<Radio />} label="Service" />
                  </RadioGroup>
                </Box>
                {product.type === "goods" && (
                  <TextField
                    label="Quantity on Hand"
                    type="number"
                    fullWidth
                    required
                    value={product.qtyOnHand}
                    onChange={(e) => setProduct({ ...product, qtyOnHand: Number(e.target.value) })}
                  />
                )}
                <TextField
                  label="Sales Price ($)"
                  type="number"
                  fullWidth
                  required
                  value={product.salesPrice}
                  onChange={(e) => setProduct({ ...product, salesPrice: Number(e.target.value) })}
                />
                <TextField
                  label="Cost Price ($)"
                  type="number"
                  fullWidth
                  required
                  value={product.costPrice}
                  onChange={(e) => setProduct({ ...product, costPrice: Number(e.target.value) })}
                />
              </Stack>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Note: Capture attribute-value associations here. Full variant/SKU matrix generation will be implemented in a future enhancement.
            </Alert>
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "30%" }}>Attribute Name</TableCell>
                    <TableCell sx={{ width: "50%" }}>Values</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.attributes.map((attrRef, index) => {
                    const selectedAttr = allAttributes.find((a) => a.id === attrRef.attributeId);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            fullWidth
                            size="small"
                            value={attrRef.attributeId}
                            onChange={(e) => handleAttributeChange(index, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>Select Attribute</MenuItem>
                            {allAttributes.map((attr) => (
                              <MenuItem key={attr.id} value={attr.id}>{attr.name}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            fullWidth
                            size="small"
                            multiple
                            disabled={!selectedAttr}
                            value={attrRef.valueIds || []}
                            onChange={(e: SelectChangeEvent<string[]>) => {
                              const val = e.target.value;
                              handleValuesChange(index, typeof val === 'string' ? val.split(',') : val);
                            }}
                            input={<OutlinedInput />}
                            renderValue={(selected) => (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                {selected.map((value) => {
                                  const valObj = selectedAttr?.values.find((v) => v.id === value);
                                  return <Chip key={value} label={valObj?.value || value} size="small" />;
                                })}
                              </Box>
                            )}
                          >
                            {selectedAttr?.values.map((v) => (
                              <MenuItem key={v.id} value={v.id}>
                                {v.value} {v.extraPrice ? `(+ $${v.extraPrice})` : ""}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveAttributeLine(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Button startIcon={<AddIcon />} size="small" onClick={handleAddAttributeLine}>
                        Add a Line
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 2 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Rental Settings</Typography>
              <Stack spacing={3}>
                <TextField
                  label="Periodicity"
                  select
                  fullWidth
                  required
                  value={product.rentalSettings.periodicity}
                  onChange={(e) => setProduct({
                    ...product,
                    rentalSettings: { ...product.rentalSettings, periodicity: e.target.value as any }
                  })}
                >
                  <MenuItem value="hours">Hours</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </TextField>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Pickup Time"
                      type="time"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={product.rentalSettings.pickupTime || ""}
                      onChange={(e) => setProduct({
                        ...product,
                        rentalSettings: { ...product.rentalSettings, pickupTime: e.target.value }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Return Time"
                      type="time"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={product.rentalSettings.returnTime || ""}
                      onChange={(e) => setProduct({
                        ...product,
                        rentalSettings: { ...product.rentalSettings, returnTime: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Late Fees ($)"
                      type="number"
                      fullWidth
                      value={product.rentalSettings.lateFee ?? ""}
                      onChange={(e) => setProduct({
                        ...product,
                        rentalSettings: { ...product.rentalSettings, lateFee: Number(e.target.value) }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Grace/Padding Time (e.g. 2:00)"
                      fullWidth
                      placeholder="e.g. 2:00 Hours"
                      value={product.rentalSettings.gracePeriod || ""}
                      onChange={(e) => setProduct({
                        ...product,
                        rentalSettings: { ...product.rentalSettings, gracePeriod: e.target.value }
                      })}
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary">
                  This overrides the org-wide default Late Fee & Pickup/Return settings configured in Settings, if filled in here.
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Rental Deposit</Typography>
              <Stack spacing={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={product.deposit.required}
                      onChange={(e) => setProduct({
                        ...product,
                        deposit: { ...product.deposit, required: e.target.checked }
                      })}
                    />
                  }
                  label="Security Deposit Required"
                />
                
                <TextField
                  label="Security Deposit Amount ($)"
                  type="number"
                  fullWidth
                  required={product.deposit.required}
                  disabled={!product.deposit.required}
                  value={product.deposit.amount ?? ""}
                  onChange={(e) => setProduct({
                    ...product,
                    deposit: { ...product.deposit, amount: Number(e.target.value) }
                  })}
                />
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
