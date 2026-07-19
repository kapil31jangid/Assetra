import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/GridLegacy";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useProfileMutation, useUpdateUserMutation, useUploadImageMutation, useChangePasswordMutation } from "../../services/queries";
import type { UserProfile } from "../../services/api";

const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  companyName: z.string().min(2, "Company Name is required."),
  gstId: z.string().optional(),
  address: z.string().optional(),
  role: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(12, "Password must be at most 12 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Must contain at least one lowercase letter.")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileForm({
  user,
  isOwnProfile = true,
}: {
  user: UserProfile;
  isOwnProfile?: boolean;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const profileMutation = useProfileMutation();
  const updateUserMutation = useUpdateUserMutation();
  const uploadMutation = useUploadImageMutation();
  const passwordMutation = useChangePasswordMutation();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      companyName: user.companyName || "",
      gstId: user.gstId || "",
      address: user.address || "",
      role: user.role,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (values: ProfileFormValues) => {
    if (isOwnProfile) {
      profileMutation.mutate(values, {
        onSuccess: () => setSaved(true),
      });
    } else {
      updateUserMutation.mutate(
        { id: user.id, user: values },
        { onSuccess: () => setSaved(true) },
      );
    }
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    passwordMutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => { setSaved(true); resetPassword(); } },
    );
  };

  return (
    <Card>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Web Information" />
          <Tab label="Security" />
        </Tabs>
      </Box>

      <CardContent>
        {saved ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            Successfully saved.
          </Alert>
        ) : null}

        {activeTab === 0 && (
          <Stack
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            spacing={3}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  <TextField
                    label="Name"
                    fullWidth
                    {...register("name")}
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                  <TextField
                    label="Email"
                    fullWidth
                    {...register("email")}
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                  <TextField
                    label="Phone"
                    fullWidth
                    {...register("phone")}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                  />
                  <TextField
                    label="Company Name"
                    fullWidth
                    {...register("companyName")}
                    error={Boolean(errors.companyName)}
                    helperText={errors.companyName?.message}
                  />
                  <TextField
                    label="GST ID"
                    fullWidth
                    {...register("gstId")}
                    error={Boolean(errors.gstId)}
                    helperText={errors.gstId?.message}
                  />
                  <TextField
                    label="Address"
                    fullWidth
                    multiline
                    rows={3}
                    {...register("address")}
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                  />
                  <TextField
                    label="Role"
                    fullWidth
                    value={isOwnProfile ? user.role : undefined}
                    disabled={isOwnProfile}
                    select={!isOwnProfile}
                    {...(!isOwnProfile ? register("role") : {})}
                    error={Boolean(errors.role)}
                    helperText={errors.role?.message}
                  >
                    {!isOwnProfile && [
                      <MenuItem key="admin" value="admin">Admin</MenuItem>,
                      <MenuItem key="vendor" value="vendor">Vendor</MenuItem>,
                      <MenuItem key="customer" value="customer">Customer</MenuItem>
                    ]}
                  </TextField>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={3} alignItems="center">
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Company Logo
                    </Typography>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 120, height: 120, mb: 1 }}
                      src={user.companyLogoUrl || ""}
                    />
                    <Button variant="outlined" size="small" component="label">
                      Upload
                      <input type="file" hidden accept="image/*" />
                    </Button>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      User Avatar
                    </Typography>
                    <Avatar
                      sx={{ width: 120, height: 120, mb: 1 }}
                      src={user.avatarUrl || ""}
                    />
                    <Button variant="outlined" size="small" component="label">
                      Upload
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file || !isOwnProfile) return;
                          try {
                            const uploaded = await uploadMutation.mutateAsync(file);
                            profileMutation.mutate({ avatarUrl: uploaded.data.url });
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
            <Box>
              <Button type="submit" variant="contained">
                Save
              </Button>
            </Box>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack
            component="form"
            noValidate
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            spacing={3}
            sx={{ maxWidth: 400 }}
          >
            <Typography variant="h6">Change Password</Typography>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              {...registerPassword("currentPassword")}
              error={Boolean(passwordErrors.currentPassword)}
              helperText={passwordErrors.currentPassword?.message}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              {...registerPassword("newPassword")}
              error={Boolean(passwordErrors.newPassword)}
              helperText={passwordErrors.newPassword?.message}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              {...registerPassword("confirmPassword")}
              error={Boolean(passwordErrors.confirmPassword)}
              helperText={passwordErrors.confirmPassword?.message}
            />
            <Box>
              <Button type="submit" variant="contained">
                Change Password
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
