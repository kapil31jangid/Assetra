import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        alignItems: { xs: "flex-start", sm: "center" },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography component="h1" variant="h1">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions}
    </Box>
  );
}
