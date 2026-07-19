import React from "react";
import { Outlet, useLocation, Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { ROUTES } from "../constants/routes";

const NAV_ITEMS = [
  { label: "My Profile", path: ROUTES.profile, icon: <PersonOutlineOutlinedIcon /> },
  { label: "My Orders", path: ROUTES.customerOrders, icon: <ReceiptLongOutlinedIcon /> },
  { label: "Settings", path: ROUTES.customerSettings, icon: <SettingsOutlinedIcon /> },
];

export function AccountLayout() {
  const location = useLocation();

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
        My Account
      </Typography>

      <Grid container spacing={4}>
        {/* SIDEBAR NAVIGATION */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <List disablePadding>
              {NAV_ITEMS.map((item, index) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <React.Fragment key={item.path}>
                    <ListItem disablePadding>
                      <ListItemButton 
                        component={RouterLink} 
                        to={item.path}
                        selected={isActive}
                        sx={{
                          py: 2,
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            "&:hover": { bgcolor: "primary.dark" },
                            "& .MuiListItemIcon-root": { color: "inherit" }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography sx={{ fontWeight: isActive ? "bold" : "normal" }}>{item.label}</Typography>} 
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < NAV_ITEMS.length - 1 && <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* MAIN CONTENT AREA */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Outlet />
        </Grid>
      </Grid>
    </Box>
  );
}
