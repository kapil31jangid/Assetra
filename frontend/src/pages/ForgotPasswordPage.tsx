import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { z } from "zod";

import { ROUTES } from "../constants/routes";
import { useForgotPasswordMutation } from "../services/queries";

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPasswordMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => forgotPassword.mutate(values))}
      spacing={2.5}
    >
      <Box>
        <Typography component="h1" variant="h1">
          Reset password
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Enter your email and Assetra will send password reset instructions.
        </Typography>
      </Box>

      {forgotPassword.isSuccess ? (
        <Alert severity="success">{forgotPassword.data.data.message}</Alert>
      ) : null}
      {forgotPassword.isError ? (
        <Alert severity="error">
          {forgotPassword.error instanceof Error
            ? forgotPassword.error.message
            : "Unable to send reset instructions. Try again."}
        </Alert>
      ) : null}

      <TextField
        autoComplete="email"
        autoFocus
        error={Boolean(errors.email)}
        fullWidth
        helperText={errors.email?.message}
        label="Email"
        type="email"
        {...register("email")}
      />

      <Button
        disabled={forgotPassword.isPending}
        type="submit"
        variant="contained"
      >
        {forgotPassword.isPending ? (
          <CircularProgress color="inherit" size={20} />
        ) : null}
        Send reset link
      </Button>

      <Link component={RouterLink} to={ROUTES.login} variant="body2">
        Back to sign in
      </Link>
    </Stack>
  );
}
