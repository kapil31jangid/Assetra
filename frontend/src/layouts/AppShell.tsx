import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../services/queries";

const drawerWidth = 248;

const navItems = [
  {
    label: "Dashboard",
    to: ROUTES.dashboard,
    icon: <AssessmentOutlinedIcon />,
  },
  {
    label: "Rental Orders",
    to: ROUTES.orders,
    icon: <ReceiptLongOutlinedIcon />,
  },
  { label: "Catalog", to: ROUTES.catalog, icon: <Inventory2OutlinedIcon /> },
];

export function AppShell() {
  const location = useLocation();
  const session = useSessionQuery();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        color="primary"
        elevation={0}
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <StorefrontOutlinedIcon />
          <Box sx={{ flexGrow: 1 }}>
            <Typography component="div" variant="h6">
              Assetra
            </Typography>
            <Typography
              sx={{ color: "primary.contrastText", opacity: 0.72 }}
              variant="caption"
            >
              Rental Operations
            </Typography>
          </Box>
          <Typography
            sx={{ display: { xs: "none", sm: "block" } }}
            variant="body2"
          >
            {session.data?.data.user.name ?? "Mock user"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        open
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            bgcolor: "background.paper",
            borderRightColor: "divider",
            width: drawerWidth,
          },
        }}
        variant="permanent"
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", py: 1.5 }}>
          <List dense>
            {navItems.map((item) => (
              <ListItemButton
                component={RouterLink}
                key={item.to}
                selected={location.pathname === item.to}
                sx={{ borderRadius: 1, mx: 1 }}
                to={item.to}
              >
                <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Divider />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
