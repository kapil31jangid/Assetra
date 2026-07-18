import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

interface Address {
  id: string;
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default: boolean;
}

export function CustomerSettingsPage() {
  // Mock data
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "addr_1",
      name: "Nisha Rao",
      address_line: "123 Tech Park Road, Floor 4",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560001",
      country: "India",
      phone: "+91 9876543210",
      is_default: true,
    }
  ]);
  const [cards, setCards] = useState([
    { id: "card_1", brand: "Visa", masked: "**** **** **** 4242", expiry: "12/28" }
  ]);
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  // Address Modal state
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: "", address_line: "", city: "", state: "", zip: "", country: "", phone: "",
  });

  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({ name: "", address_line: "", city: "", state: "", zip: "", country: "", phone: "" });
    setAddressModalOpen(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name, address_line: addr.address_line, city: addr.city, state: addr.state,
      zip: addr.zip, country: addr.country, phone: addr.phone,
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      setAddresses(addresses.map(a => a.id === editingAddressId ? { ...a, ...addressForm } : a));
    } else {
      setAddresses([...addresses, { id: `addr_${Date.now()}`, ...addressForm, is_default: addresses.length === 0 }]);
    }
    setAddressModalOpen(false);
  };

  const handleRemoveAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const handleSavePassword = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert("Passwords do not match");
      return;
    }
    // API Call
    alert("Password updated successfully");
    setPasswordForm({ current: "", new: "", confirm: "" });
  };

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

          {addresses.length === 0 ? (
            <Typography color="text.secondary">You have no saved addresses.</Typography>
          ) : (
            <Grid container spacing={3}>
              {addresses.map(addr => (
                <Grid size={{ xs: 12, md: 6 }} key={addr.id}>
                  <Box sx={{ p: 3, border: "1px solid", borderColor: addr.is_default ? "primary.main" : "divider", borderRadius: 1, position: "relative" }}>
                    {addr.is_default && (
                      <Chip label="Default" size="small" color="primary" sx={{ position: "absolute", top: 16, right: 16, height: 20 }} />
                    )}
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>{addr.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{addr.address_line}</Typography>
                    <Typography variant="body2" color="text.secondary">{addr.city}, {addr.state} {addr.zip}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{addr.country} • {addr.phone}</Typography>
                    
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => handleEditAddress(addr)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleRemoveAddress(addr.id)}>Delete</Button>
                      {!addr.is_default && (
                        <Button size="small" color="inherit" onClick={() => handleSetDefaultAddress(addr.id)}>Set as Default</Button>
                      )}
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* PAYMENT METHODS */}
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 4 }}>
            Payment Methods
          </Typography>

          {cards.length === 0 ? (
            <Typography color="text.secondary">You have no saved cards.</Typography>
          ) : (
            <Grid container spacing={3}>
              {cards.map(card => (
                <Grid size={{ xs: 12, md: 6 }} key={card.id}>
                  <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>{card.brand}</Typography>
                        <Typography variant="body2" color="text.secondary">Card ending in {card.masked.slice(-4)}</Typography>
                        <Typography variant="body2" color="text.secondary">Expires {card.expiry}</Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => handleRemoveCard(card.id)} title="Remove Card">
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
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

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField 
                label="Current Password" 
                type="password" 
                fullWidth 
                value={passwordForm.current}
                onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField 
                label="New Password" 
                type="password" 
                fullWidth 
                value={passwordForm.new}
                onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                helperText="Must contain uppercase, lowercase, number, and special character."
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField 
                label="Confirm New Password" 
                type="password" 
                fullWidth 
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSavePassword}>
              Update Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* NEW/EDIT ADDRESS MODAL */}
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
                <TextField label="Full Name" fullWidth required value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Address Line" fullWidth required value={addressForm.address_line} onChange={e => setAddressForm({...addressForm, address_line: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="City" fullWidth required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="State / Province" fullWidth value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Zip / Postal Code" fullWidth required value={addressForm.zip} onChange={e => setAddressForm({...addressForm, zip: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Country" fullWidth required value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Phone Number" fullWidth required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button variant="contained" type="submit">Save Address</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
