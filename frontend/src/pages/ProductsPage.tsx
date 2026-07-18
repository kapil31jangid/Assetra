import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { AttributeManager } from "../components/attributes/AttributeManager";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useDeleteCategoryMutation,
  useDeleteProductMutation,
  useProductsQuery,
  useUpdateProductMutation,
  useUploadImageMutation,
} from "../services/queries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  brand: string;
  categoryId: string;
  imageUrls: string[];
  tags: string;
  colors: string;
  rentalUnits: string[];
  depositRequired: boolean;
  depositAmount: number;
  depositRefundable: boolean;
  variantName: string;
  variantSku: string;
  stockTotal: number;
}

const RENTAL_UNIT_OPTIONS = ["hourly", "daily", "weekly", "monthly"];

const emptyForm = (): ProductForm => ({
  name: "",
  slug: "",
  description: "",
  brand: "",
  categoryId: "",
  imageUrls: [],
  tags: "",
  colors: "",
  rentalUnits: ["daily"],
  depositRequired: false,
  depositAmount: 0,
  depositRefundable: true,
  variantName: "",
  variantSku: "",
  stockTotal: 0,
});

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Add / Edit Product Dialog
// ---------------------------------------------------------------------------

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  editProduct?: { id: string; name: string; description?: string; brand?: string; categoryId?: string; imageUrls?: string[]; tags?: string[]; colors?: string[]; rentalUnits?: string[]; depositPolicy?: { required: boolean; amount: { amount: number }; refundable: boolean }; active?: boolean } | null;
}

function ProductDialog({ open, onClose, editProduct }: ProductDialogProps) {
  const categories = useCategoriesQuery();
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const uploadImage = useUploadImageMutation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>(() =>
    editProduct
      ? {
          name: editProduct.name,
          slug: slugify(editProduct.name),
          description: editProduct.description ?? "",
          brand: editProduct.brand ?? "",
          categoryId: (editProduct as { category?: { id: string } }).category?.id ?? editProduct.categoryId ?? "",
          imageUrls: editProduct.imageUrls ?? [],
          tags: (editProduct.tags ?? []).join(", "),
          colors: (editProduct.colors ?? []).join(", "),
          rentalUnits: editProduct.rentalUnits ?? ["daily"],
          depositRequired: editProduct.depositPolicy?.required ?? false,
          depositAmount: editProduct.depositPolicy?.amount.amount ?? 0,
          depositRefundable: editProduct.depositPolicy?.refundable ?? true,
          variantName: "",
          variantSku: "",
          stockTotal: 0,
        }
      : emptyForm()
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof ProductForm, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleUnit = (unit: string) =>
    set(
      "rentalUnits",
      form.rentalUnits.includes(unit)
        ? form.rentalUnits.filter((u) => u !== unit)
        : [...form.rentalUnits, unit]
    );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage.mutateAsync(file);
      set("imageUrls", [...form.imageUrls, result.data.url]);
    } catch {
      setError("Image upload failed. Check file type (JPEG/PNG/WebP) and size (max 10 MB).");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.categoryId) {
      setError("Name and category are required.");
      return;
    }
    setError("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || undefined,
        brand: form.brand || undefined,
        categoryId: form.categoryId,
        imageUrls: form.imageUrls,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        colors: form.colors ? form.colors.split(",").map((c) => c.trim()).filter(Boolean) : [],
        rentalUnits: form.rentalUnits,
        depositRequired: form.depositRequired,
        depositAmount: form.depositAmount,
        depositRefundable: form.depositRefundable,
      };

      if (editProduct) {
        await updateProduct.mutateAsync({ productId: editProduct.id, request: payload });
      } else {
        await createProduct.mutateAsync({
          ...payload,
          variants: form.variantName
            ? [{ name: form.variantName, sku: form.variantSku, stockTotal: form.stockTotal }]
            : [],
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const catList = categories.data?.data ?? [];
  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Info */}
          <Typography variant="h3">Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Product Name *"
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!editProduct) set("slug", slugify(e.target.value));
                }}
                value={form.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                helperText="Auto-generated from name"
                label="URL Slug *"
                onChange={(e) => set("slug", e.target.value)}
                value={form.slug}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Category *"
                onChange={(e) => set("categoryId", e.target.value)}
                select
                value={form.categoryId}
              >
                {catList.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Brand"
                onChange={(e) => set("brand", e.target.value)}
                value={form.brand}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                value={form.description}
              />
            </Grid>
          </Grid>

          {/* Image Upload */}
          <Typography variant="h3">Product Image</Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            {form.imageUrls.map((url) => (
              <Box key={url} sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={url}
                  sx={{ borderRadius: 1, height: 80, objectFit: "cover", width: 80 }}
                />
                <IconButton
                  onClick={() => set("imageUrls", form.imageUrls.filter((u) => u !== url))}
                  size="small"
                  sx={{ background: "rgba(0,0,0,0.5)", color: "white", position: "absolute", right: -8, top: -8 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              component="label"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <AddIcon />}
              sx={{ height: 80, width: 120, border: "1px dashed", borderRadius: 1 }}
              variant="outlined"
            >
              {uploading ? "Uploading…" : "Upload Image"}
              <input accept="image/*" hidden onChange={handleFileChange} ref={fileRef} type="file" />
            </Button>
          </Stack>

          {/* Pricing */}
          <Typography variant="h3">Pricing & Deposit</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {RENTAL_UNIT_OPTIONS.map((unit) => (
                  <Chip
                    key={unit}
                    label={unit}
                    clickable
                    onClick={() => toggleUnit(unit)}
                    color={form.rentalUnits.includes(unit) ? "primary" : "default"}
                    variant={form.rentalUnits.includes(unit) ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.depositRequired}
                    onChange={(e) => set("depositRequired", e.target.checked)}
                  />
                }
                label="Deposit Required"
              />
            </Grid>
            {form.depositRequired && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Deposit Amount (INR)"
                  onChange={(e) => set("depositAmount", Number(e.target.value))}
                  type="number"
                  value={form.depositAmount}
                />
              </Grid>
            )}
            {form.depositRequired && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.depositRefundable}
                      onChange={(e) => set("depositRefundable", e.target.checked)}
                    />
                  }
                  label="Refundable"
                />
              </Grid>
            )}
          </Grid>

          {/* Tags & Colors */}
          <Typography variant="h3">Tags & Colors</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                helperText="Comma-separated"
                label="Tags"
                onChange={(e) => set("tags", e.target.value)}
                value={form.tags}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                helperText="Comma-separated (e.g. Black, Red)"
                label="Colors"
                onChange={(e) => set("colors", e.target.value)}
                value={form.colors}
              />
            </Grid>
          </Grid>

          {/* Variant (only for new products) */}
          {!editProduct && (
            <>
              <Typography variant="h3">Default Variant</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Variant Name"
                    onChange={(e) => set("variantName", e.target.value)}
                    placeholder={form.name || "Default"}
                    value={form.variantName}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="SKU"
                    onChange={(e) => set("variantSku", e.target.value)}
                    value={form.variantSku}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Stock Total"
                    onChange={(e) => set("stockTotal", Number(e.target.value))}
                    type="number"
                    value={form.stockTotal}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={isPending} onClick={handleSubmit} startIcon={<SaveIcon />} variant="contained">
          {isPending ? "Saving…" : editProduct ? "Save Changes" : "Create Product"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Category Manager tab
// ---------------------------------------------------------------------------

function CategoryManager() {
  const categories = useCategoriesQuery();
  const createCat = useCreateCategoryMutation();
  const deleteCat = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    setError("");
    try {
      await createCat.mutateAsync({ name: name.trim(), slug: slugify(name.trim()) });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    }
  };

  const catList = categories.data?.data ?? [];

  return (
    <Stack spacing={2}>
      <Typography variant="h3">Categories</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={1}>
        <TextField
          label="New Category Name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          size="small"
          value={name}
        />
        <Button
          disabled={createCat.isPending || !name.trim()}
          onClick={handleAdd}
          startIcon={<AddIcon />}
          variant="contained"
        >
          Add
        </Button>
      </Stack>
      {categories.isLoading ? (
        <LoadingState label="Loading categories" />
      ) : catList.length === 0 ? (
        <Alert severity="info">No categories yet. Add one above.</Alert>
      ) : (
        <Stack spacing={1}>
          {catList.map((cat) => (
            <Card key={cat.id} variant="outlined">
              <CardContent sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", py: "8px !important" }}>
                <Box>
                  <Typography variant="body1">{cat.name}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    slug: {cat.slug}
                  </Typography>
                </Box>
                <IconButton
                  color="error"
                  onClick={() => deleteCat.mutate(cat.id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main ProductsPage
// ---------------------------------------------------------------------------

export function ProductsPage() {
  const products = useProductsQuery({ pageSize: 200, includeInactive: true });
  const deleteProduct = useDeleteProductMutation();
  const updateProduct = useUpdateProductMutation();

  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string } & Record<string, unknown> | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const productList = products.data?.data ?? [];

  const handleToggleActive = async (productId: string, active: boolean) => {
    try {
      await updateProduct.mutateAsync({ productId, request: { active } });
      setSnackbar({ open: true, message: `Product ${active ? "activated" : "deactivated"}.`, severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to update product.", severity: "error" });
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct.mutateAsync(productId);
      setSnackbar({ open: true, message: "Product deleted.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to delete product.", severity: "error" });
    }
    setConfirmDelete(null);
  };

  return (
    <>
      <PageHeader
        description="Manage your product catalog — add, edit, and remove products with images and variants."
        title="Products"
        actions={
          <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }} startIcon={<AddIcon />} variant="contained">
            Add Product
          </Button>
        }
      />

      <Tabs onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} value={tab}>
        <Tab label="Products" />
        <Tab label="Categories" />
        <Tab label="Attributes" />
      </Tabs>

      {tab === 2 ? (
        <AttributeManager />
      ) : tab === 1 ? (
        <CategoryManager />
      ) : products.isLoading ? (
        <LoadingState label="Loading products" />
      ) : products.isError ? (
        <ErrorState message="Could not load products." />
      ) : productList.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No products yet. Click "Add Product" to get started.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {productList.map((product) => {
            const thumb = product.imageUrls?.[0];
            return (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", opacity: product.active ? 1 : 0.55 }}>
                  {thumb ? (
                    <CardMedia component="img" height="160" image={thumb} alt={product.name} sx={{ objectFit: "cover" }} />
                  ) : (
                    <Box sx={{ background: "action.hover", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography color="text.disabled" variant="caption">No image</Typography>
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }} variant="body1">{product.name}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {product.category?.name ?? "—"} · {product.brand ?? "No brand"}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.5 }}>
                      {(product.rentalUnits ?? []).map((u: string) => (
                        <Chip key={u} label={u} size="small" variant="outlined" />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="caption">
                        Stock: {product.stock?.available ?? 0} avail
                      </Typography>
                      <Switch
                        checked={product.active}
                        onChange={(e) => handleToggleActive(product.id, e.target.checked)}
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                  <Stack direction="row" spacing={1} sx={{ p: 1, pt: 0 }}>
                    <Button
                      fullWidth
                      onClick={() => { setEditTarget(product as unknown as Record<string, unknown> & { id: string }); setDialogOpen(true); }}
                      size="small"
                      startIcon={<EditIcon />}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => setConfirmDelete(product.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <ProductDialog
          editProduct={editTarget as Parameters<typeof ProductDialog>[0]["editProduct"]}
          onClose={() => { setDialogOpen(false); setEditTarget(null); }}
          open={dialogOpen}
        />
      )}

      {/* Confirm Delete Dialog */}
      <Dialog onClose={() => setConfirmDelete(null)} open={Boolean(confirmDelete)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>This will soft-delete the product (it won't appear in the catalog). This action can be undone by re-activating the product.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button color="error" onClick={() => confirmDelete && handleDelete(confirmDelete)} variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        open={snackbar.open}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
