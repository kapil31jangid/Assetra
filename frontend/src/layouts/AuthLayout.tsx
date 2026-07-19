import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Outlet, Link as RouterLink } from "react-router-dom";

import logoUrl from "../assets/OnlyLogo.png";
import { ROUTES } from "../constants/routes";

export function AuthLayout() {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, mx: "auto", width: "100%" }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, mb: 3 }}>
            <Box
              component={RouterLink}
              to={ROUTES.login}
              sx={{ display: "inline-flex", textDecoration: "none" }}
            >
              <Box
                alt="Assetra"
                component="img"
                src={logoUrl}
                sx={{ height: 44, objectFit: "contain", width: 44 }}
              />
            </Box>
            <Box>
              <Typography component="div" variant="h2">
                Assetra
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Rental Management
              </Typography>
            </Box>
          </Box>
          <Outlet />
        </CardContent>
      </Card>
    </Box>
  );
}
