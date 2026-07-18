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
import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";
import { z } from "zod";

import { ROUTES } from "../constants/routes";
import { useLoginMutation, useSessionQuery } from "../services/queries";
import { getRoleHomeRoute } from "../utils/auth";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { label: "Admin", email: "admin@assetra.local" },
  { label: "Vendor", email: "vendor@assetra.local" },
  { label: "Customer", email: "nisha@example.com" },
];

export function LoginPage() {
  const location = useLocation();
  const session = useSessionQuery();
  const login = useLoginMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "admin@assetra.local",
      password: "password",
    },
    resolver: zodResolver(loginSchema),
  });

  const from = (location.state as { from?: { pathname?: string } } | null)
    ?.from?.pathname;

  if (session.data?.data?.user) {
    return (
      <Navigate
        replace
        to={from ?? getRoleHomeRoute(session.data.data.user.role)}
      />
    );
  }

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => login.mutate(values))}
      spacing={2.5}
    >
      <Box>
        <Typography component="h1" variant="h1">
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Use a demo account to enter the customer portal or operations
          workspace.
        </Typography>
      </Box>

      {login.isError ? (
        <Alert severity="error">
          Invalid User ID or Password.
        </Alert>
      ) : null}

      <TextField
        autoComplete="email"
        autoFocus
        error={Boolean(errors.email)}
        fullWidth
        helperText={errors.email?.message}
        label="Login ID"
        type="email"
        {...register("email")}
      />
      <TextField
        autoComplete="current-password"
        error={Boolean(errors.password)}
        fullWidth
        helperText={errors.password?.message}
        label="Password"
        type="password"
        {...register("password")}
      />

      <Button disabled={login.isPending} type="submit" variant="contained">
        {login.isPending ? <CircularProgress color="inherit" size={20} /> : null}
        Log In
      </Button>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {demoAccounts.map((account) => (
          <Button
            key={account.email}
            onClick={() => {
              setValue("email", account.email, { shouldValidate: true });
              setValue("password", "password", { shouldValidate: true });
            }}
            size="small"
            variant="outlined"
          >
            {account.label}
          </Button>
        ))}
      </Stack>

      <Stack
        direction="column"
        spacing={2}
        sx={{
          alignItems: "center",
          mt: 2
        }}
      >
        <Link component={RouterLink} to={ROUTES.forgotPassword} variant="body2">
          Forgot Password?
        </Link>
        <Link component={RouterLink} to={ROUTES.signup} variant="body2">
          Do not have an account? Register Here
        </Link>
      </Stack>
    </Stack>
  );
}
