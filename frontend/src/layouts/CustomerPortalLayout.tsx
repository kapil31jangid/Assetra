import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logoUrl from "../assets/OnlyLogo.png";
import { ROUTES } from "../constants/routes";
import { useCart } from "../features/cart/useCart";
import { useLogoutMutation } from "../services/queries";

const portalNavItems = [
  { label: "Products", to: ROUTES.catalog },
  { label: "Terms & Condition", to: "/terms" },
  { label: "About us / Contact Us", to: "/contact" },
];

export function CustomerPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogoutMutation();
  const cart = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const closeDrawer = () => setMobileOpen(false);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.login, { replace: true }),
    });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigate(`${ROUTES.catalog}?search=${searchQuery}`);
    }
  };

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
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar color="inherit" elevation={0} position="sticky" sx={{ borderBottom: 1, borderColor: "divider" }}>
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
            component={RouterLink}
            to={ROUTES.catalog}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              alt="Assetra"
              component="img"
              src={logoUrl}
              sx={{ height: 34, objectFit: "contain", width: 34, mr: 1 }}
            />
            <Typography sx={{ fontWeight: 700, minWidth: 90 }} variant="h6">
              Assetra
            </Typography>
          </Box>
          
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, ml: 2 }}>
            {portalNavItems.map((item) => (
              <Button
                color={location.pathname === item.to ? "primary" : "inherit"}
                component={RouterLink}
                key={item.to}
                to={item.to}
                sx={{ textTransform: "none", fontWeight: location.pathname === item.to ? "bold" : "normal" }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <TextField
            placeholder="Search products..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
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
              width: "24vw",
              mr: 2,
            }}
          />
          
          <Tooltip title="Wishlist">
            <IconButton component={RouterLink} to={ROUTES.wishlist}>
              <FavoriteBorderOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cart">
            <IconButton component={RouterLink} to={ROUTES.cart}>
              <Badge badgeContent={cart.itemCount} color="secondary">
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <IconButton onClick={handleProfileMenuOpen}>
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem component={RouterLink} to={ROUTES.profile} onClick={handleProfileMenuClose}>
              My Account / My Profile
            </MenuItem>
            <MenuItem component={RouterLink} to={ROUTES.customerOrders} onClick={handleProfileMenuClose}>
              My Orders
            </MenuItem>
            <MenuItem component={RouterLink} to={ROUTES.settings} onClick={handleProfileMenuClose}>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} disabled={logout.isPending}>
              Logout
            </MenuItem>
          </Menu>
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
