import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { PageHeader } from "../components/PageHeader";

interface WorkspaceSettings {
  companyName: string;
  storeName: string;
  timezone: string;
  currency: string;
  taxRate: number;
  depositRefundDays: number;
  autoLateFees: boolean;
  emailNotifications: boolean;
}

const settingsStorageKey = "assetra.mock.settings";

const defaultSettings: WorkspaceSettings = {
  companyName: "Assetra Rentals",
  storeName: "Bengaluru Main Store",
  timezone: "Asia/Kolkata",
  currency: "INR",
  taxRate: 18,
  depositRefundDays: 3,
  autoLateFees: true,
  emailNotifications: true,
};

const readSettings = () => {
  const raw = window.localStorage.getItem(settingsStorageKey);
  if (!raw) return defaultSettings;

  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<WorkspaceSettings>) };
  } catch {
    window.localStorage.removeItem(settingsStorageKey);
    return defaultSettings;
  }
};

export function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => readSettings());
  const [saved, setSaved] = useState(false);

  const updateSettings = <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K],
  ) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <>
      <PageHeader
        description="Configure mock account, company, store, and operational defaults."
        title="Settings"
      />

      {saved ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Workspace settings saved locally.
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
                      label="Store name"
                      onChange={(event) =>
                        updateSettings("storeName", event.target.value)
                      }
                      value={settings.storeName}
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
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2">Auto late fees</Typography>
                  <Switch
                    checked={settings.autoLateFees}
                    onChange={(event) =>
                      updateSettings("autoLateFees", event.target.checked)
                    }
                  />
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2">Email notifications</Typography>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(event) =>
                      updateSettings("emailNotifications", event.target.checked)
                    }
                  />
                </Stack>
                <Button
                  onClick={saveSettings}
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
