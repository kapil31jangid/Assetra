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
import InputAdornment from "@mui/material/InputAdornment";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Divider from "@mui/material/Divider";

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
<Typography
  component="h1"
  variant="h3"
  sx={{
    mb: 1,
    fontWeight: 700,
  }}
>
  Welcome Back 👋
</Typography>

<Typography
  color="text.secondary"
  variant="body1"
>
  Sign in to manage your rental assets securely.
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
  autoComplete="username"
  autoFocus
  fullWidth
  size="medium"
  margin="normal"
  error={Boolean(errors.email)}
  helperText={errors.email?.message}
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  {...register("email")}
  slotProps={{
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <EmailOutlinedIcon />
      </InputAdornment>
    ),
  },
}}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      height: "56px",
      transition: "0.3s",
      "&:hover": {
        boxShadow: "0 0 8px rgba(25,118,210,0.15)",
      },
      "&.Mui-focused": {
        boxShadow: "0 0 10px rgba(25,118,210,0.25)",
      },
    },
  }}
/>
      <TextField
  autoComplete="current-password"
  error={Boolean(errors.password)}
  fullWidth
  helperText={errors.password?.message}
  label="Password"
  type="password"
  placeholder="Enter your password"
  size="medium"
  margin="normal"
  {...register("password")}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      height: "56px",
      transition: "0.3s",
      "&:hover": {
        boxShadow: "0 0 8px rgba(25,118,210,0.15)",
      },
      "&.Mui-focused": {
        boxShadow: "0 0 10px rgba(25,118,210,0.25)",
      },
    },
  }}
/>

    <Button
  variant="contained"
  fullWidth
  size="large"
  disableElevation
  disabled={login.isPending}
  type="submit"
  sx={{
    mt: 2,
    height: 56,
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "16px",
    textTransform: "none",
    backgroundColor: "#2563EB",
    "&:hover": {
      backgroundColor: "#1D4ED8",
    },
  }}
>
  {login.isPending ? (
    <CircularProgress
      color="inherit"
      size={20}
      sx={{ mr: 1 }}
    />
  ) : null}
  Sign In
</Button>

      <Divider sx={{ my: 2 }}>
  Demo Accounts
</Divider>
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
<Divider sx={{ my: 2 }} />

<Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  sx={{
    justifyContent: "space-between",
    alignItems: "center",
    mt: 1,
  }}
>
  <Link
    component={RouterLink}
    to={ROUTES.signup}
    underline="hover"
    variant="body2"
    sx={{
      fontWeight: 600,
      color: "primary.main",
      transition: "0.2s",
      "&:hover": {
        color: "primary.dark",
      },
    }}
  >
    New here? Create an Account
  </Link>

  <Link
    component={RouterLink}
    to={ROUTES.forgotPassword}
    underline="hover"
    variant="body2"
    sx={{
      fontWeight: 600,
      color: "primary.main",
      transition: "0.2s",
      "&:hover": {
        color: "primary.dark",
      },
    }}
  >
    Forgot Password?
  </Link>
</Stack>
    </Stack>
  );
}
