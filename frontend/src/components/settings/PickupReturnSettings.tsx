import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/GridLegacy";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";

import { useSettingsMutation, useSettingsQuery } from "../../services/queries";
import type { OrganizationSettings } from "../../services/api";

const defaultSettings: OrganizationSettings = {
  companyName: "Assetra Rentals",
  timezone: "Asia/Kolkata",
  currency: "INR",
  taxRate: 18,
  depositRefundDays: 3,
  gracePeriodMinutes: 30,
  lateFeeUnit: "hourly",
  lateFeeAmount: 250,
  lateFeeMaximum: 10000,
};

export function PickupReturnSettings() {
  const settingsQuery = useSettingsQuery();
  const settingsMutation = useSettingsMutation();
  const [settings, setSettings] = useState<OrganizationSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQuery.data?.data) {
      setSettings({ ...defaultSettings, ...settingsQuery.data.data });
    }
  }, [settingsQuery.data]);

  const updateSettings = <K extends keyof OrganizationSettings>(
    key: K,
    value: OrganizationSettings[K],
  ) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    await settingsMutation.mutateAsync(settings);
    setSaved(true);
  };

  return (
    <Card>
      <CardContent>
        {saved ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully.
          </Alert>
        ) : null}

        <Stack spacing={3}>
          <Typography variant="h6">Org-wide Pickup & Return Defaults</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Late Fee Unit"
                select
                value={settings.lateFeeUnit}
                onChange={(e) => updateSettings("lateFeeUnit", e.target.value)}
              >
                <MenuItem value="hourly">Per Hour</MenuItem>
                <MenuItem value="daily">Per Day</MenuItem>
                <MenuItem value="unit">Per Unit</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Late Fee Amount"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={settings.lateFeeAmount}
                onChange={(e) => updateSettings("lateFeeAmount", Math.max(0, Number(e.target.value) || 0))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grace Period (Minutes)"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={settings.gracePeriodMinutes}
                onChange={(e) => updateSettings("gracePeriodMinutes", Math.max(0, Number(e.target.value) || 0))}
                helperText="Padding/Grace time before late fee applies"
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            These settings only apply to products that don't have their own specific late fee rules. 
            If a product has custom late fee rules set on the product itself, those take priority over this default.
          </Alert>

          <Box>
            <Button variant="contained" onClick={() => void saveSettings()} disabled={settingsMutation.isPending}>
              Save
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
