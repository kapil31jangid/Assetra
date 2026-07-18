import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { ROUTES } from "../constants/routes";

export function NotFoundPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography component="h1" variant="h1">
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }} variant="body2">
        This route is not part of the Assetra frontend yet.
      </Typography>
      <Button component={RouterLink} to={ROUTES.dashboard} variant="contained">
        Go to dashboard
      </Button>
    </Box>
  );
}
