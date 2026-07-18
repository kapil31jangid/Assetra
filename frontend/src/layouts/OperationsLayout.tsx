import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
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

const drawerWidth = 264;

const operationsNavItems = [
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
  {
    label: "Quotations",
    to: ROUTES.quotations,
    icon: <DescriptionOutlinedIcon />,
  },
  {
    label: "Invoices",
    to: ROUTES.operationsInvoices,
    icon: <DescriptionOutlinedIcon />,
  },
  {
    label: "Products",
    to: ROUTES.products,
    icon: <Inventory2OutlinedIcon />,
  },
  { label: "Pricing", to: ROUTES.pricing, icon: <PriceChangeOutlinedIcon /> },
  {
    label: "Schedule",
    to: ROUTES.schedule,
    icon: <CalendarMonthOutlinedIcon />,
  },
  { label: "Reports", to: ROUTES.reports, icon: <TuneOutlinedIcon /> },
  { label: "Settings", to: ROUTES.settings, icon: <SettingsOutlinedIcon /> },
];

export function OperationsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSessionQuery();
  const logout = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const user = session.data?.data.user;

  const closeDrawer = () => setMobileOpen(false);
  const openUserMenu = (event: MouseEvent<HTMLElement>) =>
    setUserMenuAnchor(event.currentTarget);
  const closeUserMenu = () => setUserMenuAnchor(null);
  const handleLogout = () => {
    closeUserMenu();
    logout.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.login, { replace: true }),
    });
  };

  const drawer = (
    <Box sx={{ height: "100%" }}>
      <Toolbar />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography color="text.secondary" variant="caption">
          Operations
        </Typography>
      </Box>
      <List dense sx={{ px: 1 }}>
        {operationsNavItems.map((item) => (
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
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        color="primary"
        elevation={0}
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            aria-label="Open navigation"
            color="inherit"
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
          <Box sx={{ minWidth: 142 }}>
            <Typography component="div" variant="h6">
              Assetra
            </Typography>
            <Typography
              sx={{ color: "primary.contrastText", opacity: 0.72 }}
              variant="caption"
            >
              Operations Workspace
            </Typography>
          </Box>
          <TextField
            placeholder="Search orders, products, customers"
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
              bgcolor: "background.paper",
              borderRadius: 1,
              display: { xs: "none", lg: "block" },
              maxWidth: 420,
              ml: 2,
              width: "32vw",
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge color="secondary" variant="dot">
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Chip
            label={user?.role ?? "mock"}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.14)",
              color: "primary.contrastText",
              display: { xs: "none", sm: "inline-flex" },
              textTransform: "capitalize",
            }}
          />
          <Tooltip title="User menu">
            <IconButton color="inherit" onClick={openUserMenu}>
              <Avatar sx={{ height: 32, width: 32 }}>
                {user?.name.charAt(0) ?? "A"}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userMenuAnchor}
            onClose={closeUserMenu}
            open={Boolean(userMenuAnchor)}
          >
            <MenuItem disabled>{user?.email ?? "admin@assetra.local"}</MenuItem>
            <MenuItem onClick={closeUserMenu}>Profile</MenuItem>
            <MenuItem disabled={logout.isPending} onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}
      >
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={closeDrawer}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
          variant="temporary"
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              bgcolor: "background.paper",
              borderRightColor: "divider",
              width: drawerWidth,
            },
          }}
          variant="permanent"
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
