import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { z } from "zod";

import { ROUTES } from "../constants/routes";
import { useSessionQuery, useSignupMutation } from "../services/queries";
import type { Role } from "../types";
import { getRoleHomeRoute } from "../utils/auth";

const signupSchema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.email("Enter a valid email address."),
    role: z.enum(["customer", "vendor"]),
    companyName: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (values) =>
      values.role !== "vendor" || Boolean(values.companyName?.trim()),
    {
      message: "Company name is required for vendor accounts.",
      path: ["companyName"],
    },
  );

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const session = useSessionQuery();
  const signup = useSignupMutation();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: "",
      email: "",
      role: "customer",
      companyName: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signupSchema),
  });
  const selectedRole = watch("role");

  if (session.data?.data.user) {
    return (
      <Navigate replace to={getRoleHomeRoute(session.data.data.user.role)} />
    );
  }

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit((values) =>
        signup.mutate({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role as Role,
          companyName: values.companyName,
        }),
      )}
      spacing={2.25}
    >
      <Box>
        <Typography component="h1" variant="h1">
          Create account
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Start as a customer or create a vendor workspace for rental
          operations.
        </Typography>
      </Box>

      {signup.isError ? (
        <Alert severity="error">
          {signup.error instanceof Error
            ? signup.error.message
            : "Unable to create the account. Try again."}
        </Alert>
      ) : null}

      <TextField
        autoComplete="name"
        autoFocus
        error={Boolean(errors.name)}
        fullWidth
        helperText={errors.name?.message}
        label="Full name"
        {...register("name")}
      />
      <TextField
        autoComplete="email"
        error={Boolean(errors.email)}
        fullWidth
        helperText={errors.email?.message}
        label="Email"
        type="email"
        {...register("email")}
      />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <TextField
            error={Boolean(errors.role)}
            fullWidth
            helperText={errors.role?.message}
            label="Account type"
            select
            {...field}
          >
            <MenuItem value="customer">Customer portal</MenuItem>
            <MenuItem value="vendor">Vendor operations</MenuItem>
          </TextField>
        )}
      />
      {selectedRole === "vendor" ? (
        <TextField
          autoComplete="organization"
          error={Boolean(errors.companyName)}
          fullWidth
          helperText={errors.companyName?.message}
          label="Company name"
          {...register("companyName")}
        />
      ) : null}
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.password)}
        fullWidth
        helperText={errors.password?.message}
        label="Password"
        type="password"
        {...register("password")}
      />
      <TextField
        autoComplete="new-password"
        error={Boolean(errors.confirmPassword)}
        fullWidth
        helperText={errors.confirmPassword?.message}
        label="Confirm password"
        type="password"
        {...register("confirmPassword")}
      />

      <Button disabled={signup.isPending} type="submit" variant="contained">
        {signup.isPending ? (
          <CircularProgress color="inherit" size={20} />
        ) : null}
        Create account
      </Button>

      <Link component={RouterLink} to={ROUTES.login} variant="body2">
        Back to sign in
      </Link>
    </Stack>
  );
}
