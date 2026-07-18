import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { ROUTES } from "../constants/routes";

export function SignupPage() {
  return (
    <Stack spacing={2}>
      <div>
        <Typography component="h1" variant="h1">
          Create account
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Signup routing is ready for the Phase 3 authentication flow.
        </Typography>
      </div>
      <Button component={RouterLink} to={ROUTES.login} variant="outlined">
        Back to sign in
      </Button>
    </Stack>
  );
}
