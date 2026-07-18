import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { useSettingsMutation, useSettingsQuery } from "../services/queries";

interface WorkspaceSettings {
  companyName: string;
  timezone: string;
  currency: string;
  taxRate: number;
  depositRefundDays: number;
  gracePeriodMinutes: number;
  lateFeeUnit: string;
  lateFeeAmount: number;
  lateFeeMaximum: number | null;
}

const defaultSettings: WorkspaceSettings = {
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

export function SettingsPage() {
  const settingsQuery = useSettingsQuery();
  const settingsMutation = useSettingsMutation();
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQuery.data?.data) setSettings({ ...defaultSettings, ...settingsQuery.data.data });
  }, [settingsQuery.data]);

  const updateSettings = <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K],
  ) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    await settingsMutation.mutateAsync(settings);
    setSaved(true);
  };

  return (
    <>
      <PageHeader
        description="Configure organization, tax, deposit, and late-fee defaults."
        title="Settings"
      />

      {saved ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Workspace settings saved to the database.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Company and store
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Company name"
                      onChange={(event) =>
                        updateSettings("companyName", event.target.value)
                      }
                      value={settings.companyName}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Timezone"
                      onChange={(event) =>
                        updateSettings("timezone", event.target.value)
                      }
                      select
                      value={settings.timezone}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Currency"
                      onChange={(event) =>
                        updateSettings("currency", event.target.value)
                      }
                      select
                      value={settings.currency}
                    >
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography sx={{ mb: 2 }} variant="h3">
                  Rental defaults
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Tax rate %"
                      onChange={(event) =>
                        updateSettings("taxRate", Number(event.target.value))
                      }
                      type="number"
                      value={settings.taxRate}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Deposit refund days"
                      onChange={(event) =>
                        updateSettings(
                          "depositRefundDays",
                          Number(event.target.value),
                        )
                      }
                      type="number"
                      value={settings.depositRefundDays}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Grace period minutes" onChange={(event) => updateSettings("gracePeriodMinutes", Number(event.target.value))} type="number" value={settings.gracePeriodMinutes} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Late fee per unit" onChange={(event) => updateSettings("lateFeeAmount", Number(event.target.value))} type="number" value={settings.lateFeeAmount} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography sx={{ mb: 2 }} variant="h3">
                Automation
              </Typography>
              <Stack spacing={2}>
                <Typography color="text.secondary" variant="body2">Late fees are assessed by the backend after the configured grace period and capped at the configured maximum.</Typography>
                <Button
                  disabled={settingsMutation.isPending}
                  onClick={() => void saveSettings()}
                  startIcon={<SaveOutlinedIcon />}
                  variant="contained"
                >
                  Save settings
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
