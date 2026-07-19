import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent } from "react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logoUrl from "../assets/OnlyLogo.png";
import { ROUTES } from "../constants/routes";
import { useLogoutMutation, useSessionQuery } from "../services/queries";

const navItems = [
  { label: "Dashboard", path: ROUTES.dashboard },
  { label: "Orders", path: ROUTES.orders },
  { label: "Schedule", path: ROUTES.schedule },
  { label: "Products", path: ROUTES.products },
  { label: "Reports", path: ROUTES.reports },
  { label: "Settings", path: ROUTES.settings },
];

export function OperationsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSessionQuery();
  const logout = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

  const user = session.data?.data?.user;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const openUserMenu = (event: MouseEvent<HTMLElement>) =>
    setUserMenuAnchor(event.currentTarget);
  const closeUserMenu = () => setUserMenuAnchor(null);
  
  const handleLogout = () => {
    closeUserMenu();
    logout.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.login, { replace: true }),
    });
  };

  const handleSearch = (query: string) => {
    // Stub for onSearch(query) callback
    console.log("Search fired with:", query);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Box sx={{ my: 2, display: "flex", justifyContent: "center" }}>
        <img alt="Assetra Logo" src={logoUrl} style={{ height: 40 }} />
      </Box>
      <List>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.label}
              component={RouterLink}
              to={item.path}
              selected={isActive}
              sx={{
                textAlign: "center",
                color: isActive ? "primary.main" : "inherit",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar component="nav" color="inherit" elevation={1} position="sticky">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Mobile Hamburger Menu */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Box
              component={RouterLink}
              to={ROUTES.orders}
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                mr: 4,
              }}
            >
              <img alt="Assetra" src={logoUrl} style={{ height: 40, marginRight: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Assetra
              </Typography>
            </Box>

            {/* Desktop Nav Items */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.label}
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      color: isActive ? "primary.main" : "text.secondary",
                      fontWeight: isActive ? 700 : 500,
                      borderBottom: isActive ? "2px solid" : "2px solid transparent",
                      borderColor: isActive ? "primary.main" : "transparent",
                      borderRadius: 0,
                      px: 2,
                      py: 2.5,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: "primary.main",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Search Bar */}
            <TextField
              placeholder="Search..."
              size="small"
              onChange={(e) => handleSearch(e.target.value)}
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
                bgcolor: "background.paper",
                borderRadius: 1,
                display: { xs: "none", md: "block" },
                width: 250,
              }}
            />
            
            {/* Profile Dropdown */}
            <IconButton onClick={openUserMenu} sx={{ p: 0 }}>
              <Avatar alt={user?.name ?? "User"} src="/placeholder-avatar.jpg">
                {user?.name?.charAt(0) ?? "U"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={closeUserMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled sx={{ opacity: "1 !important" }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {user?.name ?? "Admin"}
                </Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeUserMenu();
                  navigate(ROUTES.settings);
                }}
              >
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </nav>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: "background.default" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
