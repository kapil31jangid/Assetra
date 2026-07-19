import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import type { AddressRecord } from "../services/api";
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useChangePasswordMutation,
} from "../services/queries";

const EMPTY_FORM = {
  name: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "IN",
  phone: "",
};

export function CustomerSettingsPage() {
  // ── Address CRUD ────────────────────────────────────────────────────────
  const addressesQuery = useAddressesQuery();
  const createAddress = useCreateAddressMutation();
  const updateAddress = useUpdateAddressMutation();
  const deleteAddress = useDeleteAddressMutation();
  const setDefault = useSetDefaultAddressMutation();

  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(EMPTY_FORM);

  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm(EMPTY_FORM);
    setAddressModalOpen(true);
  };

  const handleEditAddress = (addr: AddressRecord) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name,
      line1: addr.line1,
      city: addr.city,
      state: addr.state ?? "",
      postalCode: addr.postalCode,
      countryCode: addr.countryCode,
      phone: addr.phone ?? "",
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      await updateAddress.mutateAsync({ id: editingAddressId, payload: addressForm });
    } else {
      await createAddress.mutateAsync(addressForm);
    }
    setAddressModalOpen(false);
  };

  const handleRemoveAddress = async (id: string) => {
    await deleteAddress.mutateAsync(id);
  };

  const handleSetDefaultAddress = async (id: string) => {
    await setDefault.mutateAsync(id);
  };

  const addressMutating =
    createAddress.isPending || updateAddress.isPending || deleteAddress.isPending || setDefault.isPending;

  // ── Password Change ─────────────────────────────────────────────────────
  const changePassword = useChangePasswordMutation();
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSavePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password.",
      });
    }
  };

  const addresses = addressesQuery.data?.data ?? [];

  return (
    <Stack spacing={4}>
      {/* ADDRESS BOOK */}
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Address Book
            </Typography>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={handleOpenNewAddress}>
              Add New Address
            </Button>
          </Stack>

          {addressesQuery.isLoading ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={100} />
              <Skeleton variant="rounded" height={100} />
            </Stack>
          ) : addressesQuery.isError ? (
            <Alert severity="error">Failed to load addresses. Please refresh and try again.</Alert>
          ) : addresses.length === 0 ? (
            <Typography color="text.secondary">You have no saved addresses.</Typography>
          ) : (
            <Grid container spacing={3}>
              {addresses.map((addr) => (
                <Grid size={{ xs: 12, md: 6 }} key={addr.id}>
                  <Box
                    sx={{
                      p: 3,
                      border: "1px solid",
                      borderColor: addr.isDefault ? "primary.main" : "divider",
                      borderRadius: 1,
                      position: "relative",
                    }}
                  >
                    {addr.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{ position: "absolute", top: 16, right: 16, height: 20 }}
                      />
                    )}
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>{addr.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{addr.line1}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {addr.countryCode} {addr.phone && `• ${addr.phone}`}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => handleEditAddress(addr)} disabled={addressMutating}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => handleRemoveAddress(addr.id)} disabled={addressMutating}>
                        Delete
                      </Button>
                      {!addr.isDefault && (
                        <Button size="small" color="inherit" onClick={() => handleSetDefaultAddress(addr.id)} disabled={addressMutating}>
                          Set as Default
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* CHANGE PASSWORD */}
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 4 }}>
            Change Password
          </Typography>

          {passwordMsg && (
            <Alert severity={passwordMsg.type} sx={{ mb: 3 }} onClose={() => setPasswordMsg(null)}>
              {passwordMsg.text}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                helperText="Must contain uppercase, lowercase, and a special character."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSavePassword}
              disabled={changePassword.isPending || !passwordForm.current || !passwordForm.new}
              startIcon={changePassword.isPending ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {changePassword.isPending ? "Updating…" : "Update Password"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* NEW / EDIT ADDRESS MODAL */}
      <Dialog open={isAddressModalOpen} onClose={() => setAddressModalOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSaveAddress}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {editingAddressId ? "Edit Address" : "New Address"}
            </Typography>
            <IconButton onClick={() => setAddressModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Full Name"
                  fullWidth
                  required
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address Line"
                  fullWidth
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City"
                  fullWidth
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="State / Province"
                  fullWidth
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Zip / Postal Code"
                  fullWidth
                  required
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Country Code (e.g. IN)"
                  fullWidth
                  required
                  value={addressForm.countryCode}
                  onChange={(e) => setAddressForm({ ...addressForm, countryCode: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              type="submit"
              disabled={createAddress.isPending || updateAddress.isPending}
              startIcon={
                (createAddress.isPending || updateAddress.isPending) ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              Save Address
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
