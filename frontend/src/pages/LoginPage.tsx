import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { ROUTES } from "../constants/routes";

export function LoginPage() {
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, mx: "auto", width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <StorefrontOutlinedIcon color="primary" fontSize="large" />
            <div>
              <Typography component="h1" variant="h1">
                Assetra
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                Authentication routes are wired. The mock session currently
                signs in as an admin.
              </Typography>
            </div>
            <Button
              component={RouterLink}
              to={ROUTES.dashboard}
              variant="contained"
            >
              Continue to dashboard
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
