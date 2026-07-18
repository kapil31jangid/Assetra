import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";

import { useProfileMutation, useProfileQuery, useSessionQuery } from "../services/queries";

interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function ProfilePage() {
  const session = useSessionQuery();
  const profileQuery = useProfileQuery();
  const profileMutation = useProfileMutation();

  const [profile, setProfile] = useState<CustomerProfile>({
    firstName: "",
    lastName: "",
    email: session.data?.data.user.email ?? "",
    phone: "",
  });
  
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.data) {
      const data = profileQuery.data.data;
      const parts = (data.name || "").split(" ");
      setProfile((current) => ({ 
        ...current, 
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: data.email || session.data?.data.user.email || "",
        phone: data.phone || current.phone 
      }));
    }
  }, [profileQuery.data, session.data]);

  const updateProfile = (key: keyof CustomerProfile, value: string) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const isValid = profile.firstName.trim().length > 0 && profile.lastName.trim().length > 0;

  const saveProfile = async () => {
    setTouched(true);
    if (!isValid) return;

    await profileMutation.mutateAsync({ 
      name: `${profile.firstName} ${profile.lastName}`.trim(), 
      phone: profile.phone 
    });
    setSaved(true);
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 4 }}>
          My Profile
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 4 }}>
            Profile successfully updated.
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} sx={{ mb: 4, alignItems: "center" }}>
          <Box sx={{ position: "relative" }}>
            <Avatar 
              sx={{ width: 100, height: 100, bgcolor: "primary.main", fontSize: 36 }}
            >
              {profile.firstName[0]}{profile.lastName[0]}
            </Avatar>
            <IconButton 
              size="small" 
              color="primary"
              sx={{ position: "absolute", bottom: 0, right: 0, bgcolor: "background.paper", boxShadow: 1, '&:hover': { bgcolor: "background.default" } }}
            >
              <CameraAltOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Profile Photo</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a new avatar. Recommended size: 256x256px.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="First Name"
              value={profile.firstName}
              onChange={(e) => updateProfile("firstName", e.target.value)}
              error={touched && profile.firstName.trim().length === 0}
              helperText={touched && profile.firstName.trim().length === 0 ? "First name is required" : ""}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Last Name"
              value={profile.lastName}
              onChange={(e) => updateProfile("lastName", e.target.value)}
              error={touched && profile.lastName.trim().length === 0}
              helperText={touched && profile.lastName.trim().length === 0 ? "Last name is required" : ""}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              disabled
              label="Email Address"
              value={profile.email}
              helperText="Email cannot be changed directly."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profile.phone}
              onChange={(e) => updateProfile("phone", e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="large"
            disabled={profileMutation.isPending}
            onClick={() => void saveProfile()}
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
          >
            Save Changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
