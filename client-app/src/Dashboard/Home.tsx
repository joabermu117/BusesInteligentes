import DirectionsBusRounded from '@mui/icons-material/DirectionsBusRounded';
import GpsFixedRounded from '@mui/icons-material/GpsFixedRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import RouteRounded from '@mui/icons-material/RouteRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Badge,
  Button,
  Snackbar,
} from '@mui/material';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../permisos/common/components/PageHeader';
import { useRoleStore } from '../permisos/stores/useRoleStore';
import { useScopeStore } from '../permisos/stores/useScopeStore';
import { useUserStore } from '../permisos/stores/useUserStore';
import useSocketTracking from '../shared/hooks/useSocketTracking';
import type { BusLocationData, BusAlert } from '../shared/hooks/useSocketTracking';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import httpClient from '../config/httpClient';

// ── Bus icon ─────────────────────────────────────────────────
const createBusIcon = (status: string) => {
  const colors: Record<string, string> = {
    normal: '#2e7d32',
    delayed: '#ed6c02',
    incident: '#d32f2f',
  };
  const bg = colors[status] || '#1976d2';
  return L.divIcon({
    className: 'custom-bus-marker-dash',
    html: `<div style="background:${bg};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.46 1.64 1.14 2.06-.09.28-.14.58-.14.89 0 1.1.9 2 2 2s2-.9 2-2c0-.31-.05-.61-.14-.89h6.28c-.09.28-.14.58-.14.89 0 1.1.9 2 2 2s2-.9 2-2c0-.31-.05-.61-.14-.89C19.54 17.64 20 16.88 20 16V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm8-8V4.06c2.11.12 5.34.47 6 1.94H12zm-2 0H6c0-1.47 3.89-1.82 6-1.94V8zM6 14v-4h4v4H6zm8 0v-4h4v4h-4z"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// ── Map auto-fit ─────────────────────────────────────────────
const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
};

// ── Main Dashboard Page ──────────────────────────────────────
const DashboardHome = () => {
  const navigate = useNavigate();
  const { users } = useUserStore();
  const { roles } = useRoleStore();
  const { scopes } = useScopeStore();

  // Real-time socket tracking for supervisor dashboard
  const { connected, activeBuses, lastAlert, clearAlert } = useSocketTracking({
    subscribeAll: true,
  });

  const [alerts, setAlerts] = useState<BusAlert[]>([]);

  // ── Simulator state ─────────────────────────────────────────
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorMessage, setSimulatorMessage] = useState<string | null>(null);

  const toggleSimulator = useCallback(async () => {
    setSimulatorLoading(true);
    try {
      if (simulatorRunning) {
        await httpClient.post(`${API_URL}/api/simulator/stop`);
        setSimulatorRunning(false);
        setSimulatorMessage('🛑 Simulador detenido');
      } else {
        const { data } = await httpClient.post(`${API_URL}/api/simulator/start`);
        setSimulatorRunning(true);
        setSimulatorMessage(`🚍 ${data.message}`);
      }
    } catch {
      setSimulatorMessage('Error al controlar el simulador');
    } finally {
      setSimulatorLoading(false);
    }
  }, [simulatorRunning, API_URL]);

  // Check simulator status on mount
  useEffect(() => {
    httpClient.get(`${API_URL}/api/simulator/status`).then(({ data }) => {
      setSimulatorRunning(data.running);
    }).catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    if (lastAlert) {
      setAlerts((prev) => [lastAlert, ...prev].slice(0, 20));
    }
  }, [lastAlert]);

  // ── KPIs from real data ────────────────────────────────────
  const totalActiveBuses = activeBuses.length;
  const busesWithIncidents = activeBuses.filter((b) => b.status === 'incident').length;
  const busesDelayed = activeBuses.filter((b) => b.status === 'delayed').length;
  const totalPassengers = activeBuses.reduce(
    (sum, b) => sum + (b.passengers ?? 0),
    0,
  );
  const avgOccupancy = totalActiveBuses > 0
    ? Math.round((totalPassengers / (totalActiveBuses * 40)) * 100)
    : 0;
  const activeIncidents = busesWithIncidents + busesDelayed;

  const kpiCards = [
    {
      label: 'Buses activos',
      value: String(totalActiveBuses),
      helper: 'En operación actualmente',
      icon: <DirectionsBusRounded fontSize="small" />,
      tone: '#0b4f7d',
    },
    {
      label: 'Pasajeros en tránsito',
      value: String(totalPassengers),
      helper: 'Total en este momento',
      icon: <GroupsRounded fontSize="small" />,
      tone: '#0f8d74',
    },
    {
      label: 'Alertas activas',
      value: String(activeIncidents),
      helper: 'Incidentes y retrasos',
      icon: <WarningAmberRounded fontSize="small" />,
      tone: '#c27b08',
    },
    {
      label: 'Cobertura de rutas',
      value: `${avgOccupancy}%`,
      helper: 'Ocupación promedio',
      icon: <RouteRounded fontSize="small" />,
      tone: '#4f46e5',
    },
  ];

  const mapPoints = useMemo(
    () => activeBuses.map((b) => [b.latitude, b.longitude] as [number, number]),
    [activeBuses],
  );

  return (
    <Box className="page-enter">
      <PageHeader
        title="Panel de Control en Tiempo Real"
        subtitle="Monitorea la flota de buses, incidentes activos y estado de la operación en vivo."
      />

      {/* Connection status + time */}
      <Paper
        sx={{
          p: { xs: 2.25, md: 3 },
          mb: 3,
          background:
            'linear-gradient(120deg, rgba(11,79,125,0.92) 0%, rgba(15,141,116,0.86) 58%, rgba(79,70,229,0.83) 100%)',
          color: '#f7fbff',
          border: 'none',
          boxShadow: '0 16px 44px rgba(10,37,64,0.22)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Centro de Control de Buses Inteligentes
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.92 }}>
              Monitorea la operación en tiempo real con datos actualizados vía WebSocket.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: connected ? '#69f0ae' : '#ff5252',
              }}
            />
            <Chip
              icon={<GpsFixedRounded sx={{ color: 'inherit !important' }} />}
              label={connected ? 'Conectado en vivo' : 'Desconectado'}
              sx={{
                color: '#f7fbff',
                borderColor: 'rgba(247,251,255,0.4)',
                backgroundColor: 'rgba(247,251,255,0.16)',
              }}
              variant="outlined"
            />
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={
                simulatorLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : simulatorRunning ? (
                  <StopRounded />
                ) : (
                  <PlayArrowRounded />
                )
              }
              onClick={toggleSimulator}
              disabled={simulatorLoading}
              sx={{
                color: '#f7fbff',
                borderColor: simulatorRunning
                  ? 'rgba(255,82,82,0.6)'
                  : 'rgba(247,251,255,0.4)',
                backgroundColor: simulatorRunning
                  ? 'rgba(255,82,82,0.15)'
                  : 'rgba(247,251,255,0.08)',
                '&:hover': {
                  backgroundColor: simulatorRunning
                    ? 'rgba(255,82,82,0.25)'
                    : 'rgba(247,251,255,0.16)',
                },
              }}
            >
              {simulatorRunning ? 'Detener simulación' : 'Simular buses'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert
          severity={alerts[0].severity === 'high' || alerts[0].severity === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 2 }}
          action={
            <Chip label="Cerrar" size="small" onClick={clearAlert} sx={{ cursor: 'pointer' }} />
          }
        >
          {alerts[0].message}
        </Alert>
      )}

      {/* KPI Cards */}
      <Box
        sx={{
          mb: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
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
                    display: 'grid',
                    placeItems: 'center',
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

      {/* Map + Tables */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
        }}
      >
        {/* Live Map */}
        <Paper sx={{ p: 0, overflow: 'hidden', minHeight: 420 }}>
          <MapContainer
            center={[-12.0464, -77.0428]}
            zoom={12}
            style={{ height: 420, width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}
            {activeBuses.map((bus) => (
              <Marker
                key={bus.busId}
                position={[bus.latitude, bus.longitude]}
                icon={createBusIcon(bus.status)}
                eventHandlers={{
                  click: () => navigate(`/buses/${bus.busId}`),
                }}
              >
                <Popup>
                  <Box sx={{ minWidth: 180 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      🚌 {bus.plate}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {bus.routeName ?? 'Sin ruta'}
                    </Typography>
                    <Chip
                      label={
                        bus.status === 'normal'
                          ? 'Normal'
                          : bus.status === 'delayed'
                            ? 'Retraso'
                            : 'Incidente'
                      }
                      size="small"
                      color={
                        bus.status === 'normal'
                          ? 'success'
                          : bus.status === 'delayed'
                            ? 'warning'
                            : 'error'
                      }
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Paper>

        {/* Active Buses Table */}
        <Paper sx={{ p: 2, maxHeight: 420, overflow: 'auto' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            Flota activa en tiempo real
          </Typography>
          {activeBuses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay buses activos en este momento.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Bus</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pasajeros</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ruta</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeBuses.map((bus) => (
                    <TableRow key={bus.busId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {bus.plate}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            bus.status === 'normal'
                              ? 'Normal'
                              : bus.status === 'delayed'
                                ? 'Retraso'
                                : 'Incidente'
                          }
                          size="small"
                          color={
                            bus.status === 'normal'
                              ? 'success'
                              : bus.status === 'delayed'
                                ? 'warning'
                                : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{bus.passengers ?? '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {bus.routeName ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/buses/${bus.busId}`)}
                          >
                            <DirectionsBusRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Alerts & Status Section */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        }}
      >
        {/* Bus detail cards */}
        <Paper sx={{ p: 2.4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Estado de buses activos
          </Typography>
          <Stack gap={1.25}>
            {activeBuses.slice(0, 10).map((bus) => (
              <Box key={bus.busId}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    🚌 {bus.plate}
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Chip
                      size="small"
                      label={`${bus.passengers ?? 0} pasajeros`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={
                        bus.status === 'normal'
                          ? 'Normal'
                          : bus.status === 'delayed'
                            ? 'Retrasado'
                            : 'Incidente'
                      }
                      color={
                        bus.status === 'normal'
                          ? 'success'
                          : bus.status === 'delayed'
                            ? 'warning'
                            : 'error'
                      }
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {bus.routeName ?? 'Sin ruta'} · {bus.currentStopName ?? '—'} · Última
                  actualización:{' '}
                  {bus.lastUpdate
                    ? new Date(bus.lastUpdate).toLocaleTimeString()
                    : '—'}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((bus.passengers ?? 0) / 40) * 100, 100)}
                  color={
                    (bus.passengers ?? 0) >= 38
                      ? 'error'
                      : (bus.passengers ?? 0) >= 30
                        ? 'warning'
                        : 'primary'
                  }
                  sx={{ mt: 0.9, height: 6, borderRadius: 6 }}
                />
              </Box>
            ))}
            {activeBuses.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No hay buses activos en este momento.
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* Alerts panel */}
        <Box>
          <Paper sx={{ p: 2.4, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Alertas recientes
            </Typography>
            {alerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No hay alertas activas. Todo en orden.
              </Typography>
            ) : (
              <Stack gap={1} sx={{ mt: 1.4 }}>
                {alerts.slice(0, 5).map((alert, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderLeft: 4,
                      borderLeftColor:
                        alert.severity === 'critical' || alert.severity === 'high'
                          ? 'error.main'
                          : 'warning.main',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      🚌 {alert.plate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.message}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper sx={{ p: 2.4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Resumen del sistema
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
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Buses con ocupación máxima</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {activeBuses.filter((b) => (b.passengers ?? 0) >= 38).length}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Buses con incidentes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {busesWithIncidents}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>
      <Snackbar
        open={!!simulatorMessage}
        autoHideDuration={4000}
        onClose={() => setSimulatorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSimulatorMessage(null)}
          severity={simulatorMessage?.includes('Error') ? 'error' : 'info'}
          variant="filled"
        >
          {simulatorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardHome;
