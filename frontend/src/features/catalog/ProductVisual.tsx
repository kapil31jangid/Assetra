import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { Product } from "../../types";

interface ProductVisualProps {
  product: Product;
  compact?: boolean;
}

export function ProductVisual({ product, compact = false }: ProductVisualProps) {
  const imageUrl = product.imageUrls[0];

  if (imageUrl) {
    return (
      <Box
        alt={product.name}
        component="img"
        src={imageUrl}
        sx={{
          aspectRatio: compact ? "16 / 10" : "16 / 9",
          bgcolor: "background.default",
          display: "block",
          objectFit: "cover",
          width: "100%",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        aspectRatio: compact ? "16 / 10" : "16 / 9",
        bgcolor: "#edf3f8",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "primary.main",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        px: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: "secondary.main",
          bottom: -36,
          height: 88,
          opacity: 0.22,
          position: "absolute",
          right: -16,
          transform: "rotate(-12deg)",
          width: "54%",
        }}
      />
      <Inventory2OutlinedIcon sx={{ fontSize: compact ? 34 : 48, zIndex: 1 }} />
      <Typography
        align="center"
        sx={{ fontWeight: 700, maxWidth: 260, zIndex: 1 }}
        variant={compact ? "body2" : "h4"}
      >
        {product.category.name}
      </Typography>
    </Box>
  );
}
