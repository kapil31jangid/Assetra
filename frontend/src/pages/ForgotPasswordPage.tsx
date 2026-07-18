import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { ROUTES } from "../constants/routes";

export function ForgotPasswordPage() {
  return (
    <Stack spacing={2}>
      <div>
        <Typography component="h1" variant="h1">
          Reset password
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Password recovery routing is ready for Phase 3.
        </Typography>
      </div>
      <Button component={RouterLink} to={ROUTES.login} variant="outlined">
        Back to sign in
      </Button>
    </Stack>
  );
}
