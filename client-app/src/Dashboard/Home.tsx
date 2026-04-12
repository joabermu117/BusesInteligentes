import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import GpsFixedRounded from "@mui/icons-material/GpsFixedRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import RouteRounded from "@mui/icons-material/RouteRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import PageHeader from "../permisos/common/components/PageHeader";
import { useRoleStore } from "../permisos/stores/useRoleStore";
import { useScopeStore } from "../permisos/stores/useScopeStore";
import { useUserStore } from "../permisos/stores/useUserStore";

const busLines = [
  { code: "R-01", name: "Centro - Terminal Norte", occupancy: 74, delay: 3 },
  { code: "R-04", name: "Universidad - Hospital", occupancy: 61, delay: 0 },
  { code: "R-07", name: "Barrio Sur - Plaza", occupancy: 88, delay: 6 },
  { code: "R-11", name: "Aeropuerto - Centro", occupancy: 55, delay: 1 },
];

const DashboardHome = () => {
  const { users } = useUserStore();
  const { roles } = useRoleStore();
  const { scopes } = useScopeStore();

  const totalBuses = 42;
  const busesInService = 37;
  const incidents = 2;

  const avgOccupancy = useMemo(() => {
    const total = busLines.reduce((sum, line) => sum + line.occupancy, 0);
    return Math.round(total / busLines.length);
  }, []);

  const kpiCards = [
    {
      label: "Buses en servicio",
      value: `${busesInService}/${totalBuses}`,
      helper: "Operativos en este turno",
      icon: <DirectionsBusRounded fontSize="small" />,
      tone: "#0b4f7d",
    },
    {
      label: "Promedio de ocupacion",
      value: `${avgOccupancy}%`,
      helper: "Capacidad usada hoy",
      icon: <GroupsRounded fontSize="small" />,
      tone: "#0f8d74",
    },
    {
      label: "Incidentes activos",
      value: String(incidents),
      helper: "Alertas en monitoreo",
      icon: <WarningAmberRounded fontSize="small" />,
      tone: "#c27b08",
    },
    {
      label: "Cobertura de rutas",
      value: "94%",
      helper: "Frecuencias cumplidas",
      icon: <RouteRounded fontSize="small" />,
      tone: "#4f46e5",
    },
  ];

  return (
    <Box className="page-enter">
      <PageHeader
        title="Dashboard de Operaciones"
        subtitle="Vista general del sistema de buses: flota, rutas y seguridad de acceso."
      />

      <Paper
        sx={{
          p: { xs: 2.25, md: 3 },
          mb: 3,
          background:
            "linear-gradient(120deg, rgba(11,79,125,0.92) 0%, rgba(15,141,116,0.86) 58%, rgba(79,70,229,0.83) 100%)",
          color: "#f7fbff",
          border: "none",
          boxShadow: "0 16px 44px rgba(10,37,64,0.22)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Centro de Control de Buses Inteligentes
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.92 }}>
              Monitorea la operacion en tiempo real y valida la configuracion de
              seguridad del sistema.
            </Typography>
          </Box>
          <Chip
            icon={<GpsFixedRounded sx={{ color: "inherit !important" }} />}
            label="Actualizado hace 2 min"
            sx={{
              alignSelf: { xs: "flex-start", md: "center" },
              color: "#f7fbff",
              borderColor: "rgba(247,251,255,0.4)",
              backgroundColor: "rgba(247,251,255,0.16)",
            }}
            variant="outlined"
          />
        </Stack>
      </Paper>

      <Box
        sx={{
          mb: 3,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {kpiCards.map((card) => (
          <Box key={card.label}>
            <Paper sx={{ p: 2.2 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    color: card.tone,
                    backgroundColor: `${card.tone}1A`,
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {card.helper}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        <Box>
          <Paper sx={{ p: 2.4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Estado por ruta
            </Typography>
            <Stack gap={1.25}>
              {busLines.map((line) => (
                <Box key={line.code}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {line.code} - {line.name}
                    </Typography>
                    <Stack direction="row" gap={1}>
                      <Chip
                        size="small"
                        label={`${line.occupancy}% ocupacion`}
                      />
                      <Chip
                        size="small"
                        label={
                          line.delay > 0
                            ? `${line.delay} min de retraso`
                            : "En horario"
                        }
                        color={line.delay > 0 ? "warning" : "success"}
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={line.occupancy}
                    sx={{ mt: 0.9, height: 8, borderRadius: 8 }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 2.4, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Estado de seguridad
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              Usuarios, roles y permisos configurados en el modulo de acceso.
            </Typography>
            <Stack gap={1.1} sx={{ mt: 1.8 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Usuarios activos</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {users.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Roles definidos</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {roles.length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Permisos registrados</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {scopes.length}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recomendaciones del turno
            </Typography>
            <Stack gap={1} sx={{ mt: 1.4 }}>
              <Typography variant="body2" color="text.secondary">
                Revisar saturacion en la ruta R-07 durante el pico de la tarde.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Validar reasignacion de dos buses de reserva en terminal norte.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmar que nuevos usuarios operadores tengan permisos de
                lectura.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardHome;
