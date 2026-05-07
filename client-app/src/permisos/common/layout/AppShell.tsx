import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import GppGoodRounded from "@mui/icons-material/GppGoodRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import NearMeRounded from "@mui/icons-material/NearMeRounded";
import ShieldRounded from "@mui/icons-material/ShieldRounded";
import ConfirmationNumberRounded from "@mui/icons-material/ConfirmationNumberRounded";
import ExitToAppRounded from "@mui/icons-material/ExitToAppRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import WorkHistoryRounded from "@mui/icons-material/WorkHistoryRounded";
import {
  AppBar,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "../../../config/httpClient";

type NavigationItem = {
  path: string;
  label: string;
  description: string;
  icon: ReactNode;
  matchPath?: string; // custom path to check for active state
};

const DRAWER_WIDTH = 292;

const navigationItems: NavigationItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "Estado general de rutas, flota y seguridad.",
    icon: <DashboardRounded />,
  },
  {
    path: "/rutas",
    label: "Rutas",
    description: "Consulta de rutas disponibles y tarifas.",
    icon: <MapRounded />,
  },
  {
    path: "/paraderos",
    label: "Paraderos",
    description: "Paraderos cercanos a tu ubicación.",
    icon: <NearMeRounded />,
  },
  {
    path: "/abordar",
    label: "Abordar",
    description: "Abordaje y generación de boleto.",
    icon: <ConfirmationNumberRounded />,
  },
  {
    path: "/descender",
    label: "Descender",
    description: "Finalizar viaje y descender.",
    icon: <ExitToAppRounded />,
  },
  {
    path: "/viajes/historial",
    label: "Historial",
    description: "Historial de viajes realizados.",
    icon: <HistoryRounded />,
    matchPath: "/viajes",
  },
  {
    path: "/turnos",
    label: "Mis turnos",
    description: "Turnos asignados como conductor.",
    icon: <WorkHistoryRounded />,
  },
];

const securityItems: NavigationItem[] = [
  {
    path: "/users/list",
    label: "Usuarios",
    description: "Gestion de cuentas y permisos efectivos.",
    icon: <GroupRounded />,
  },
  {
    path: "/roles/list",
    label: "Roles",
    description: "Definicion de perfiles de acceso.",
    icon: <AdminPanelSettingsRounded />,
  },
  {
    path: "/scopes/list",
    label: "Permisos",
    description: "Catalogo de permisos del sistema.",
    icon: <GppGoodRounded />,
  },
];

const isItemActive = (item: NavigationItem, currentPath: string): boolean => {
  const matchPath = item.matchPath ?? item.path;

  if (item.path === "/users/list" && currentPath.startsWith("/users/profile")) {
    return true;
  }

  // Special case: /viajes/historial should NOT match /viajes/5 (detalle viaje)
  // But /viajes/historial should match /viajes/historial, and /viajes/5 should match historial too (children routes)
  if (matchPath === "/viajes" && item.path === "/viajes/historial") {
    // historialItem: active for /viajes/historial, /viajes/5 (detalle), etc.
    return currentPath.startsWith("/viajes");
  }

  return currentPath.startsWith(matchPath);
};

const NavListItem = ({
  item,
  isSelected,
  onClick,
}: {
  item: NavigationItem;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <ListItemButton
    selected={isSelected}
    onClick={onClick}
    sx={{
      borderRadius: 2,
      py: 1.15,
      pl: 1.75,
      pr: 1.5,
      mb: 0.75,
      alignItems: "flex-start",
      "&.Mui-selected": {
        backgroundColor: "rgba(207,59,35,0.12)",
        "&:hover": {
          backgroundColor: "rgba(207,59,35,0.18)",
        },
      },
    }}
  >
    <ListItemIcon
      sx={{
        minWidth: 36,
        color: isSelected ? "primary.main" : "text.secondary",
      }}
    >
      {item.icon}
    </ListItemIcon>
    <ListItemText
      primary={item.label}
      secondary={item.description}
      primaryTypographyProps={{
        fontWeight: 700,
        color: isSelected ? "primary.main" : "text.primary",
      }}
      secondaryTypographyProps={{
        variant: "caption",
        sx: { display: "block", mt: 0.25 },
      }}
    />
  </ListItemButton>
);

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(true);

  const activeItem = useMemo(
    () =>
      navigationItems.find((item) => isItemActive(item, location.pathname)) ??
      navigationItems[0],
    [location.pathname],
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const navContent = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h5" sx={{ color: "text.primary" }}>
          Buses Inteligentes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Centro de control de flota, rutas y seguridad.
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1.5, py: 1.5 }}>
        {navigationItems.map((item) => (
          <NavListItem
            key={item.path}
            item={item}
            isSelected={isItemActive(item, location.pathname)}
            onClick={() => handleNavigate(item.path)}
          />
        ))}

        <ListItemButton
          onClick={() => setIsSecurityOpen((prev) => !prev)}
          sx={{ borderRadius: 2, py: 1, px: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
            <ShieldRounded />
          </ListItemIcon>
          <ListItemText
            primary="Seguridad"
            primaryTypographyProps={{
              fontWeight: 800,
              letterSpacing: "0.02em",
            }}
          />
          {isSecurityOpen ? <ExpandLessRounded /> : <ExpandMoreRounded />}
        </ListItemButton>

        <Collapse in={isSecurityOpen} timeout="auto" unmountOnExit>
          <List sx={{ pt: 1, gap: 0.75, display: "grid" }}>
            {securityItems.map((item) => (
              <NavListItem
                key={item.path}
                item={item}
                isSelected={isItemActive(item, location.pathname)}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
          </List>
        </Collapse>
      </List>
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        elevation={0}
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255,255,255,0.8)",
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton
            edge="start"
            onClick={() => setIsMobileNavOpen(true)}
            sx={{ mr: 1.5, display: { md: "none" } }}
            aria-label="Abrir navegación"
          >
            <MenuRounded />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {activeItem.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeItem.description}
            </Typography>
          </Box>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<LogoutRounded />}
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
            },
          }}
        >
          {navContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {navContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}
      >
        <Toolbar sx={{ minHeight: 72 }} />
        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AppShell;
