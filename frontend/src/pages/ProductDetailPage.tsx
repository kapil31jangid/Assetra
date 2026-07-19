import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Drawer from "@mui/material/Drawer";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { ROUTES } from "../constants/routes";
import { useProductQuery } from "../services/queries";
import { useCart } from "../features/cart/useCart";
import { useWishlist } from "../features/catalog/useWishlist";

// --- Types matching User's Data Model Note ---
export interface PortalAttributeValue {
  id: string;
  value: string;
  extra_price?: number;
  in_stock: boolean;
}

export interface PortalAttribute {
  attribute_id: string;
  name: string;
  display_type: "radio" | "pills" | "checkbox" | "image";
  values: PortalAttributeValue[];
}

export interface PortalProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  periodicity: string;
  qty_on_hand: number;
  attributes: PortalAttribute[];
}

// Map the domain.ts Product to PortalProduct for the UI to function based on requirements.
// In reality, this would be the actual API response type for GET /portal/products/:id.
const mapToPortalProduct = (domainProduct: any): PortalProduct => {
  // Mock mapping to fulfill the requirement structure
  const images = domainProduct.image ? [domainProduct.image] : [];
  // For demo, we mock attributes if they aren't fully resolved.
  // In a real app, the API would return them expanded as requested.
  const attributes: PortalAttribute[] = (domainProduct.attributes || []).map((attrRef: any, index: number) => {
    return {
      attribute_id: attrRef.attributeId || `attr_${index}`,
      name: attrRef.name || `Attribute ${index + 1}`,
      display_type: attrRef.displayType || "radio",
      values: (attrRef.valueIds || []).map((vId: string, vIndex: number) => ({
        id: vId,
        value: `Value ${vIndex + 1}`,
        extra_price: 0,
        in_stock: true,
      }))
    };
  });

  return {
    id: domainProduct.id,
    name: domainProduct.name,
    images: images.length ? images : ["https://placehold.co/600x400/EEE/31343C?text=No+Image"], // fallback
    price: domainProduct.salesPrice || 0,
    periodicity: domainProduct.rentalSettings?.periodicity || "day",
    qty_on_hand: domainProduct.qtyOnHand ?? 10,
    attributes: attributes,
  };
};

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useProductQuery(productId);
  const cart = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isConfigureModalOpen, setConfigureModalOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [isMiniCartOpen, setMiniCartOpen] = useState(false);

  if (isLoading) return <LoadingState label="Loading product..." />;
  if (isError || !response?.data) return <ErrorState message="Product not found" />;

  const portalProduct = mapToPortalProduct(response.data);
  const wishlisted = isWishlisted(portalProduct.id);

  const hasVariants = portalProduct.attributes && portalProduct.attributes.length > 0;
  
  // Validation
  const isValidDateRange = startsAt && endsAt && dayjs(endsAt).isAfter(dayjs(startsAt));
  const isOutOfStock = portalProduct.qty_on_hand <= 0;
  const canAddToCart = isValidDateRange && !isOutOfStock && quantity > 0 && quantity <= portalProduct.qty_on_hand;

  const handleAddToCartClick = () => {
    if (hasVariants) {
      setConfigureModalOpen(true);
    } else {
      addToCartAndShowMiniCart({});
    }
  };

  const addToCartAndShowMiniCart = (finalSelections: Record<string, string | string[]>) => {
    // Note: mapping to cart state
    cart.addItem({
      id: `cart_${crypto.randomUUID()}`,
      productId: portalProduct.id,
      productName: portalProduct.name,
      quantity,
      rentalUnit: portalProduct.periodicity as any,
      startsAt,
      endsAt,
      unitPrice: { amount: portalProduct.price, currency: "USD" },
      deposit: { amount: 0, currency: "USD" }, // Simplified
      variantId: JSON.stringify(finalSelections), // simplified serialization
      variantName: Object.values(finalSelections).join(", ") || "",
    });
    setConfigureModalOpen(false);
    setMiniCartOpen(true);
  };

  const isConfigComplete = portalProduct.attributes.every((attr) => {
    const val = selections[attr.attribute_id];
    if (attr.display_type === "checkbox") {
      return Array.isArray(val) && val.length > 0;
    }
    return Boolean(val);
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Button
        component={RouterLink}
        startIcon={<ArrowBackOutlinedIcon />}
        to={ROUTES.catalog}
        sx={{ mb: 3 }}
      >
        Back to Catalog
      </Button>

      <Grid container spacing={6}>
        {/* LEFT: IMAGE GALLERY */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              component="img"
              src={portalProduct.images[activeImage]}
              alt={portalProduct.name}
              sx={{
                width: "100%",
                aspectRatio: "4/3",
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            {portalProduct.images.length > 1 && (
              <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
                {portalProduct.images.map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    onClick={() => setActiveImage(idx)}
                    sx={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 1,
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: activeImage === idx ? "primary.main" : "divider",
                      transition: "0.2s",
                      "&:hover": { borderColor: "primary.light" },
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Grid>

        {/* RIGHT: PRODUCT INFO & PURCHASE PANEL */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {portalProduct.name}
            </Typography>
            <Tooltip title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
              <IconButton onClick={() => toggleWishlist(portalProduct.id)} color={wishlisted ? "secondary" : "default"}>
                {wishlisted ? <FavoriteOutlinedIcon /> : <FavoriteBorderOutlinedIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
              ₹{portalProduct.price} <Typography component="span" variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>/ {portalProduct.periodicity}</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (Price for the product per {portalProduct.periodicity})
            </Typography>
          </Box>

          {isOutOfStock ? (
            <Alert severity="error" sx={{ mb: 4, fontWeight: "bold" }}>
              Out of Stock
            </Alert>
          ) : (
            <Box sx={{ bgcolor: "background.paper", p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Rental Period
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Date & Time"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: dayjs().format("YYYY-MM-DDTHH:mm") } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="End Date & Time"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: startsAt || dayjs().format("YYYY-MM-DDTHH:mm") } }}
                  />
                </Grid>
              </Grid>

              {!isValidDateRange && startsAt && endsAt && (
                <Alert severity="warning" sx={{ mb: 2 }}>End date/time must be after start date/time.</Alert>
              )}

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Quantity
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 4 }}>
                <Button variant="outlined" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                <Typography variant="h6">{quantity}</Typography>
                <Button variant="outlined" onClick={() => setQuantity(Math.min(portalProduct.qty_on_hand, quantity + 1))} disabled={quantity >= portalProduct.qty_on_hand}>+</Button>
                <Typography variant="body2" color="text.secondary">
                  ({portalProduct.qty_on_hand} available)
                </Typography>
              </Stack>

              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleAddToCartClick}
                disabled={!canAddToCart}
                startIcon={<ShoppingCartOutlinedIcon />}
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                Add to Cart
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* CONFIGURE MODAL */}
      <Dialog open={isConfigureModalOpen} onClose={() => setConfigureModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Configure Variant</Typography>
          <IconButton onClick={() => setConfigureModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {portalProduct.attributes.map((attr) => (
              <Box key={attr.attribute_id}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  {attr.name}
                </Typography>
                
                {attr.display_type === "radio" && (
                  <RadioGroup
                    row
                    value={selections[attr.attribute_id] || ""}
                    onChange={(e) => setSelections({ ...selections, [attr.attribute_id]: e.target.value })}
                  >
                    {attr.values.map(val => (
                      <FormControlLabel 
                        key={val.id} 
                        value={val.id} 
                        control={<Radio />} 
                        label={`${val.value} ${val.extra_price ? `(+₹${val.extra_price})` : ''}`} 
                        disabled={!val.in_stock}
                      />
                    ))}
                  </RadioGroup>
                )}

                {attr.display_type === "pills" && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {attr.values.map(val => (
                      <Chip
                        key={val.id}
                        label={`${val.value} ${val.extra_price ? `(+₹${val.extra_price})` : ''}`}
                        color={selections[attr.attribute_id] === val.id ? "primary" : "default"}
                        variant={selections[attr.attribute_id] === val.id ? "filled" : "outlined"}
                        onClick={() => val.in_stock && setSelections({ ...selections, [attr.attribute_id]: val.id })}
                        disabled={!val.in_stock}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                )}

                {attr.display_type === "checkbox" && (
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    {attr.values.map(val => {
                      const checked = (selections[attr.attribute_id] as string[] || []).includes(val.id);
                      return (
                        <FormControlLabel
                          key={val.id}
                          control={
                            <Checkbox 
                              checked={checked}
                              onChange={(e) => {
                                const curr = (selections[attr.attribute_id] as string[]) || [];
                                setSelections({
                                  ...selections,
                                  [attr.attribute_id]: e.target.checked ? [...curr, val.id] : curr.filter(id => id !== val.id)
                                });
                              }}
                            />
                          }
                          label={`${val.value} ${val.extra_price ? `(+₹${val.extra_price})` : ''}`}
                          disabled={!val.in_stock}
                        />
                      );
                    })}
                  </Stack>
                )}

                {attr.display_type === "image" && (
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                    {attr.values.map(val => (
                      <Box
                        key={val.id}
                        onClick={() => val.in_stock && setSelections({ ...selections, [attr.attribute_id]: val.id })}
                        sx={{
                          width: 50, height: 50,
                          borderRadius: 1,
                          border: "2px solid",
                          borderColor: selections[attr.attribute_id] === val.id ? "primary.main" : "divider",
                          bgcolor: val.value, // Fallback interpreting value as a color hex/name for demo
                          cursor: val.in_stock ? "pointer" : "not-allowed",
                          opacity: val.in_stock ? 1 : 0.5,
                          "&:hover": val.in_stock ? { borderColor: "primary.main" } : {},
                        }}
                        title={`${val.value} ${val.extra_price ? `(+₹${val.extra_price})` : ''}`}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setConfigureModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            disabled={!isConfigComplete}
            onClick={() => addToCartAndShowMiniCart(selections)}
          >
            Confirm & Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* MINI CART PANEL */}
      <Drawer anchor="right" open={isMiniCartOpen} onClose={() => setMiniCartOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cart Summary</Typography>
            <IconButton onClick={() => setMiniCartOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Breadcrumbs separator=">" aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Typography color="primary" sx={{ fontWeight: 'bold' }}>Add to Cart</Typography>
            <Typography color="text.disabled">Address</Typography>
            <Typography color="text.disabled">Payment</Typography>
          </Breadcrumbs>

          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            {cart.items.length === 0 ? (
              <Typography color="text.secondary">Your cart is empty.</Typography>
            ) : (
              <Stack spacing={2}>
                {cart.items.map((item) => (
                  <Card key={item.id} variant="outlined" sx={{ display: 'flex', p: 1 }}>
                    <Box component="img" src={portalProduct.images[0]} sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.productName}</Typography>
                      {item.variantName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {item.variantName}
                        </Typography>
                      )}
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                        <Typography variant="body2">Qty: {item.quantity}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{item.unitPrice.amount * item.quantity}</Typography>
                      </Stack>
                      <Button 
                        size="small" 
                        color="error" 
                        sx={{ p: 0, minWidth: 'auto', textTransform: 'none', mt: 0.5 }}
                        onClick={() => cart.removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Button variant="outlined" onClick={() => setMiniCartOpen(false)} sx={{ mb: 2 }}>
            Continue Shopping
          </Button>
          <Button variant="contained" color="primary" onClick={() => navigate(ROUTES.cart)}>
            Proceed to Cart
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
