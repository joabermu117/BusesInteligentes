import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import ConfirmationNumberRounded from "@mui/icons-material/ConfirmationNumberRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import DomainRounded from "@mui/icons-material/DomainRounded";
import EmailRounded from "@mui/icons-material/EmailRounded";
import ExitToAppRounded from "@mui/icons-material/ExitToAppRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import GppGoodRounded from "@mui/icons-material/GppGoodRounded";
import GpsFixedRounded from "@mui/icons-material/GpsFixedRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MapRounded from "@mui/icons-material/MapRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import NearMeRounded from "@mui/icons-material/NearMeRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import TimeToLeaveRounded from "@mui/icons-material/TimeToLeaveRounded";
import UmbrellaRounded from "@mui/icons-material/UmbrellaRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import WorkHistoryRounded from "@mui/icons-material/WorkHistoryRounded";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
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
import {
  AUTH_TOKEN_STORAGE_KEY,
  getAuthRoles,
  getAuthUserId,
  getUserEmailFromToken,
  getUserNameFromToken,
} from "../../../config/httpClient";
import { useRoleStore } from "../../stores/useRoleStore";
import { useUnreadCount } from "../../../mensajes/stores/useMessagesStore";
import { useFirebaseMessaging } from "../../../mensajes/hooks/useFirebaseMessaging";
import GlobalNotificationListener from "../components/GlobalProximityListener";
import { AssignmentRounded, EventAvailableRounded, FeedbackRounded, ManageSearchRounded } from "@mui/icons-material";

type NavigationItem = {
  path: string;
  label: string;
  description: string;
  icon: ReactNode;
  matchPath?: string; // custom path to check for active state
};

type NavigationGroup = {
  label: string;
  icon: ReactNode;
  items: NavigationItem[];
};

const DRAWER_WIDTH = 292;

const citizenItems: NavigationItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "Estado general de rutas, flota y seguridad.",
    icon: <DashboardRounded />,
  },
  {
    path: "/buses/tracking",
    label: "Seguimiento",
    description: "Ubicación de buses en tiempo real.",
    icon: <GpsFixedRounded />,
  },
  {
    path: "/buses/proximity",
    label: "Bus próximo",
    description: "Notificaciones cuando tu bus se acerque.",
    icon: <NotificationsActiveRounded />,
  },
  {
    path: "/buses/weather",
    label: "Clima",
    description: "Alertas meteorológicas para tus viajes.",
    icon: <UmbrellaRounded />,
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
    path: "/horarios",
    label: "Horarios",
    description: "Consulta de programaciones y horarios de buses.",
    icon: <ScheduleRounded />,
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
    path: "/tarjetas",
    label: "Mis tarjetas",
    description: "Métodos de pago vinculados.",
    icon: <ConfirmationNumberRounded />,
  },
  {
    path: "/recargar",
    label: "Recargar tarjeta",
    description: "Recarga tu tarjeta con ePayco.",
    icon: <ConfirmationNumberRounded />,
  },
  {
    path: "/grupos",
    label: "Grupos",
    description: "Únete a grupos públicos de la comunidad.",
    icon: <GroupsRounded />,
  },
  {
    path: "/mensajes/bandeja",
    label: "Mensajes",
    description: "Bandeja de entrada y mensajes recibidos.",
    icon: <EmailRounded />,
    matchPath: "/mensajes",
  },
  {
    path: "/mensajes/enviados",
    label: "Enviados",
    description: "Mensajes que has enviado.",
    icon: <SendRounded />,
  },
  {
    path: "/pqrs",
    label: "PQRS",
    description: "Peticiones, quejas, reclamos y sugerencias.",
    icon: <FeedbackRounded />,
  },
  {
    path: "/pqrs/consultar",
    label: "Consultar PQRS",
    description: "Consulta el estado de tu PQRS con el número de radicado.",
    icon: <ManageSearchRounded />,
  },
  {
    path: "/citas",
    label: "Agendar Cita",
    description: "Reserva una cita de atención personalizada.",
    icon: <EventAvailableRounded />,
  },
];

const driverItems: NavigationItem[] = [
  {
    path: "/turnos",
    label: "Mis turnos",
    description: "Turnos asignados como conductor.",
    icon: <WorkHistoryRounded />,
  },
];

const adminItems: NavigationItem[] = [
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
  {
    path: "/buses",
    label: "Buses",
    description: "Gestion de flota de buses.",
    icon: <DirectionsBusRounded />,
  },
  {
    path: "/rutas/admin",
    label: "Rutas",
    description: "CRUD de rutas y paraderos.",
    icon: <MapRounded />,
  },
  {
    path: "/paraderos/admin",
    label: "Paraderos",
    description: "Registrar y gestionar paraderos.",
    icon: <NearMeRounded />,
  },
  {
    path: "/programaciones",
    label: "Programaciones",
    description: "Asignar buses a rutas y horarios.",
    icon: <ScheduleRounded />,
  },
  {
    path: "/turnos/admin",
    label: "Turnos",
    description: "Asignar turnos a conductores.",
    icon: <WorkHistoryRounded />,
  },
  {
    path: "/incidentes",
    label: "Incidentes",
    description: "Registro de incidentes y novedades.",
    icon: <WarningAmberRounded />,
  },
  {
    path: "/empresas",
    label: "Empresas",
    description: "Operadoras de transporte.",
    icon: <DomainRounded />,
  },
  {
    path: "/payment-methods",
    label: "Métodos de pago",
    description: "Catalogo de métodos de pago.",
    icon: <AdminPanelSettingsRounded />,
  },
  {
    path: "/reportes/ingresos",
    label: "Reporte ingresos",
    description: "Ingresos por método de pago.",
    icon: <BarChartRounded />,
  },
  {
    path: "/reportes/edades",
    label: "Reporte edades",
    description: "Distribución por rango etario.",
    icon: <BarChartRounded />,
  },
  {
    path: "/reportes/incidentes",
    label: "Reporte incidentes",
    description: "Tendencia de incidentes por tipo.",
    icon: <BarChartRounded />,
  },
  {
    path: "/grupos/admin",
    label: "Grupos",
    description: "Crea y administra grupos del sistema.",
    icon: <GroupsRounded />,
  },
  {
    path: "/reportes/tiempo-real",
    label: "Tiempo real",
    description: "Monitoreo en vivo de flota, mapa e incidentes.",
    icon: <GpsFixedRounded />,
  },
  {
    path: "/mensajes/alertas",
    label: "Alertas masivas",
    description: "Envía notificaciones a todos los ciudadanos.",
    icon: <NotificationsActiveRounded />,
  },
  {
    path: "/pqrs/admin",
    label: "Gestión PQRS",
    description: "Administra y responde las PQRS del sistema.",
    icon: <AssignmentRounded />,
  },
];

const navigationGroups: NavigationGroup[] = [
  {
    label: "Ciudadano",
    icon: <PersonRounded />,
    items: citizenItems,
  },
  {
    label: "Conductor",
    icon: <TimeToLeaveRounded />,
    items: driverItems,
  },
  {
    label: "Administración",
    icon: <SettingsRounded />,
    items: adminItems,
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

const NavGroup = ({
  group,
  isOpen,
  onToggle,
  currentPath,
  onNavigate,
}: {
  group: NavigationGroup;
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}) => (
  <>
    <ListItemButton onClick={onToggle} sx={{ borderRadius: 2, py: 1, px: 1.5 }}>
      <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
        {group.icon}
      </ListItemIcon>
      <ListItemText
        primary={group.label}
        primaryTypographyProps={{
          fontWeight: 800,
          letterSpacing: "0.02em",
        }}
      />
      {isOpen ? <ExpandLessRounded /> : <ExpandMoreRounded />}
    </ListItemButton>

    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <List sx={{ pt: 1, gap: 0.75, display: "grid" }}>
        {group.items.map((item) => (
          <NavListItem
            key={item.path}
            item={item}
            isSelected={isItemActive(item, currentPath)}
            onClick={() => onNavigate(item.path)}
          />
        ))}
      </List>
    </Collapse>
  </>
);

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Ciudadano: true,
    Conductor: true,
    Administración: true,
  });

  const { roles } = useRoleStore();

  // Inicializar Firebase Cloud Messaging para notificaciones push
  useFirebaseMessaging();

  const userName = getUserNameFromToken();
  const userEmail = getUserEmailFromToken();
  const userRoleIds = getAuthRoles();
  const userId = getAuthUserId();
  const { data: unreadCounts } = useUnreadCount(userId ?? "");

  const firstRoleName = useMemo(() => {
    if (userRoleIds.length === 0) return null;
    const roleId = userRoleIds[0];
    const role = roles.find((r) => r.id === roleId);
    return role?.name ?? roleId;
  }, [roles, userRoleIds]);

  const moreRolesCount = useMemo(() => {
    return Math.max(0, userRoleIds.length - 1);
  }, [userRoleIds]);

  const activeItem = useMemo(() => {
    const allItems = navigationGroups.flatMap((g) => g.items);
    return (
      allItems.find((item) => isItemActive(item, location.pathname)) ??
      allItems[0]
    );
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem("driverUserId");
    localStorage.removeItem("citizenId");
    navigate("/login", { replace: true });
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
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
        {navigationGroups.map((group) => (
          <NavGroup
            key={group.label}
            group={group}
            isOpen={openGroups[group.label]}
            onToggle={() => toggleGroup(group.label)}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        ))}
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

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* User info: avatar, name, email */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {userName?.charAt(0)?.toUpperCase() ?? "U"}
              </Avatar>
              <Box sx={{ lineHeight: 1.2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {userName ?? userEmail ?? "Usuario"}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {firstRoleName && (
                    <Chip
                      label={firstRoleName}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  )}
                  {moreRolesCount > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      +{moreRolesCount} más
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Messages button */}
            <IconButton
              color="inherit"
              onClick={() => navigate("/mensajes/bandeja")}
              title="Bandeja de entrada"
            >
              <Badge badgeContent={unreadCounts?.total} color="error" max={99}>
                <EmailRounded />
              </Badge>
            </IconButton>

            {/* Profile button */}
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              startIcon={<PersonRounded />}
              onClick={() => {
                if (userId) navigate(`/users/profile/${userId}`);
              }}
            >
              Ver perfil
            </Button>

            <Divider orientation="vertical" flexItem />

            <Button
              color="inherit"
              variant="outlined"
              startIcon={<LogoutRounded />}
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </Stack>
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

      {/* Global proximity notification listener — works across all pages */}
      <GlobalNotificationListener />
    </Box>
  );
};

export default AppShell;
