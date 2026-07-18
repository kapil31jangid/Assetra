import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { useProfileMutation, useProfileQuery, useSessionQuery } from "../services/queries";

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  defaultAddress: string;
  preferredFulfillment: string;
}

export function ProfilePage() {
  const session = useSessionQuery();
  const profileQuery = useProfileQuery();
  const profileMutation = useProfileMutation();
  const fallbackProfile: CustomerProfile = {
    name: session.data?.data.user.name ?? "Nisha Rao",
    email: session.data?.data.user.email ?? "nisha@example.com",
    phone: "+91 98765 43210",
    defaultAddress: "12 MG Road, Bengaluru, Karnataka 560001",
    preferredFulfillment: "Store pickup",
  };
  const [profile, setProfile] = useState<CustomerProfile>(fallbackProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.data) {
      setProfile((current) => ({ ...current, ...profileQuery.data.data, phone: profileQuery.data.data.phone ?? current.phone }));
    }
    setProfile((current) => ({
      ...fallbackProfile,
      ...current,
    }));
  }, [fallbackProfile.email, fallbackProfile.name, profileQuery.data]);

  const updateProfile = (key: keyof CustomerProfile, value: string) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async () => {
    await profileMutation.mutateAsync({ name: profile.name, phone: profile.phone });
    setSaved(true);
  };

  return (
    <>
      <PageHeader
        description="Manage customer details and support preferences."
        title="Profile"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Account details
              </Typography>
              {saved ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profile saved to the database.
                </Alert>
              ) : null}
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    onChange={(event) => updateProfile("name", event.target.value)}
                    value={profile.name}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    onChange={(event) => updateProfile("email", event.target.value)}
                    type="email"
                    value={profile.email}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    onChange={(event) => updateProfile("phone", event.target.value)}
                    value={profile.phone}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Preferred fulfillment"
                    onChange={(event) =>
                      updateProfile("preferredFulfillment", event.target.value)
                    }
                    value={profile.preferredFulfillment}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Default address"
                    minRows={3}
                    multiline
                    onChange={(event) =>
                      updateProfile("defaultAddress", event.target.value)
                    }
                    value={profile.defaultAddress}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button
                  disabled={profileMutation.isPending}
                  onClick={() => void saveProfile()}
                  startIcon={<SaveOutlinedIcon />}
                  variant="contained"
                >
                  Save profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Support
              </Typography>
              <Stack spacing={1.5}>
                <Chip
                  color="success"
                  icon={<SupportAgentOutlinedIcon />}
                  label="Support available"
                  variant="outlined"
                />
                <Typography color="text.secondary" variant="body2">
                  Active rental questions are routed to the operations team.
                  Pickup, return, deposit, and invoice questions are visible
                  from this account area.
                </Typography>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  support@assetra.local
                </Typography>
                <Typography sx={{ fontWeight: 700 }} variant="body2">
                  +91 80 4000 1200
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
