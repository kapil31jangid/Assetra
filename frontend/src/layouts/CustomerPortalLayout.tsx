import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MenuIcon from "@mui/icons-material/Menu";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import logoUrl from "../assets/OnlyLogo.png";
import { ROUTES } from "../constants/routes";

const portalNavItems = [
  { label: "Catalog", to: ROUTES.catalog, icon: <Inventory2OutlinedIcon /> },
  {
    label: "My Orders",
    to: ROUTES.customerOrders,
    icon: <ReceiptLongOutlinedIcon />,
  },
  {
    label: "Invoices",
    to: ROUTES.customerInvoices,
    icon: <ReceiptLongOutlinedIcon />,
  },
  {
    label: "Wishlist",
    to: ROUTES.wishlist,
    icon: <FavoriteBorderOutlinedIcon />,
  },
  {
    label: "Profile",
    to: ROUTES.profile,
    icon: <AccountCircleOutlinedIcon />,
  },
];

export function CustomerPortalLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeDrawer = () => setMobileOpen(false);

  const navList = (
    <List dense sx={{ minWidth: 260, px: 1, py: 2 }}>
      {portalNavItems.map((item) => (
        <ListItemButton
          component={RouterLink}
          key={item.to}
          onClick={closeDrawer}
          selected={location.pathname === item.to}
          sx={{ borderRadius: 1, mb: 0.25 }}
          to={item.to}
        >
          <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar color="inherit" elevation={0} position="sticky">
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            aria-label="Open portal navigation"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            alt="Assetra"
            component="img"
            src={logoUrl}
            sx={{ height: 34, objectFit: "contain", width: 34 }}
          />
          <Typography sx={{ fontWeight: 700, minWidth: 90 }} variant="h6">
            Assetra
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {portalNavItems.slice(0, 4).map((item) => (
              <Button
                color={location.pathname === item.to ? "primary" : "inherit"}
                component={RouterLink}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <TextField
            placeholder="Search products"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              display: { xs: "none", lg: "block" },
              maxWidth: 320,
              ml: "auto",
              width: "24vw",
            }}
          />
          <Box sx={{ flexGrow: { xs: 1, lg: 0 } }} />
          <Tooltip title="Cart">
            <IconButton component={RouterLink} to={ROUTES.cart}>
              <Badge badgeContent={0} color="secondary">
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <IconButton component={RouterLink} to={ROUTES.profile}>
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={closeDrawer}
        open={mobileOpen}
        sx={{ display: { xs: "block", md: "none" } }}
        variant="temporary"
      >
        {navList}
      </Drawer>

      <Box
        component="main"
        sx={{ maxWidth: 1180, mx: "auto", p: { xs: 2, md: 3 } }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
