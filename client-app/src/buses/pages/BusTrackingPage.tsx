import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import PageHeader from '../../permisos/common/components/PageHeader';
import { useRutas } from '../../viajes/stores/useRutasStore';
import useSocketTracking from '../../shared/hooks/useSocketTracking';
import type { BusLocationData } from '../../shared/hooks/useSocketTracking';
import httpClient from '../../config/httpClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Bus icon factory ──────────────────────────────────────────
const createBusIcon = (status: string, isSelected: boolean) => {
  const colors: Record<string, string> = {
    normal: '#2e7d32',
    delayed: '#ed6c02',
    incident: '#d32f2f',
  };
  const bg = colors[status] || '#1976d2';
  const size = isSelected ? 40 : 32;
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `<div style="
      background:${bg};color:white;width:${size}px;height:${size}px;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:${isSelected ? 16 : 12}px;font-weight:700;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="white">
        <path d="M4 16c0 .88.46 1.64 1.14 2.06-.09.28-.14.58-.14.89 0 1.1.9 2 2 2s2-.9 2-2c0-.31-.05-.61-.14-.89h6.28c-.09.28-.14.58-.14.89 0 1.1.9 2 2 2s2-.9 2-2c0-.31-.05-.61-.14-.89C19.54 17.64 20 16.88 20 16V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm8-8V4.06c2.11.12 5.34.47 6 1.94H12zm-2 0H6c0-1.47 3.89-1.82 6-1.94V8zM6 14v-4h4v4H6zm8 0v-4h4v4h-4z"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const STOP_ICON = L.divIcon({
  className: 'custom-stop-marker',
  html: `<div style="background:#0288d1;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);">P</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ── Auto-fit map bounds ──────────────────────────────────────
const FitBounds = memo(({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
});

// ── Bus Marker Component (memoized for performance) ──────────
const BusMarker = memo(
  ({
    bus,
    isSelected,
    onClick,
  }: {
    bus: BusLocationData;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <Marker
      position={[bus.latitude, bus.longitude]}
      icon={createBusIcon(bus.status, isSelected)}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <Box sx={{ minWidth: 200, p: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            🚌 {bus.plate}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {bus.routeName ?? 'Sin ruta asignada'}
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          <Stack spacing={0.3}>
            <Typography variant="caption">
              📍 Última actualización:{' '}
              {new Date(bus.lastUpdate).toLocaleTimeString()}
            </Typography>
            {bus.currentStopName && (
              <Typography variant="caption">
                🏁 Paradero cercano: {bus.currentStopName}
              </Typography>
            )}
            {bus.passengers !== undefined && (
              <Typography variant="caption">
                👥 Pasajeros: {bus.passengers}
              </Typography>
            )}
            {bus.speed !== undefined && (
              <Typography variant="caption">
                ⚡ Velocidad: {bus.speed} km/h
              </Typography>
            )}
          </Stack>
          <Chip
            label={bus.status === 'normal' ? 'Normal' : bus.status === 'delayed' ? 'Retrasado' : 'Incidente'}
            color={bus.status === 'normal' ? 'success' : bus.status === 'delayed' ? 'warning' : 'error'}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Popup>
    </Marker>
  ),
);

// ── Main Component ───────────────────────────────────────────
const BusTrackingPage = () => {
  const { data: rutas, isLoading: loadingRutas } = useRutas();
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>();
  const [selectedBus, setSelectedBus] = useState<BusLocationData | null>(null);
  const [stopsByRoute, setStopsByRoute] = useState<Array<{ stop_id: number; name: string; latitude: number; longitude: number }>>([]);

  // ── Simulator ─────────────────────────────────────────────
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorMsg, setSimulatorMsg] = useState<string | null>(null);

  const toggleSimulator = useCallback(async () => {
    setSimulatorLoading(true);
    try {
      if (simulatorRunning) {
        await httpClient.post(`${API_URL}/api/simulator/stop`);
        setSimulatorRunning(false);
        setSimulatorMsg('🛑 Simulador detenido');
      } else {
        const { data } = await httpClient.post(`${API_URL}/api/simulator/start`);
        setSimulatorRunning(true);
        setSimulatorMsg(`🚍 ${data.message}`);
      }
    } catch {
      setSimulatorMsg('Error al controlar el simulador');
    } finally {
      setSimulatorLoading(false);
    }
  }, [simulatorRunning]);

  useEffect(() => {
    httpClient.get(`${API_URL}/api/simulator/status`).then(({ data }) => {
      setSimulatorRunning(data.running);
    }).catch(() => {});
  }, []);

  const handleBusLocationUpdate = useCallback((data: BusLocationData) => {
    setSelectedBus((prev) => (prev?.busId === data.busId ? data : prev));
  }, []);

  const { connected, activeBuses, lastAlert, clearAlert } = useSocketTracking({
    routeId: selectedRouteId,
    subscribeAll: !selectedRouteId,
    onBusLocationUpdate: handleBusLocationUpdate,
  });

  // Load stops when a route is selected
  useEffect(() => {
    if (!selectedRouteId) {
      setStopsByRoute([]);
      return;
    }
    httpClient
      .get(`${API_URL}/api/routes/${selectedRouteId}`)
      .then((res) => {
        const route = res.data;
        const stops = (route.routeStops || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((rs: any) => ({
            stop_id: rs.stop_id,
            name: rs.stop?.name || `Paradero #${rs.stop_id}`,
            latitude: Number(rs.stop?.latitude),
            longitude: Number(rs.stop?.longitude),
          }));
        setStopsByRoute(stops);
      })
      .catch(() => {});
  }, [selectedRouteId]);

  // Filter buses by selected route
  const filteredBuses = useMemo(() => {
    if (selectedRouteId) {
      return activeBuses.filter((b) => b.routeId === selectedRouteId);
    }
    return activeBuses;
  }, [activeBuses, selectedRouteId]);

  // Map points for fitBounds
  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [];
    filteredBuses.forEach((b) => pts.push([b.latitude, b.longitude]));
    stopsByRoute.forEach((s) => pts.push([s.latitude, s.longitude]));
    return pts;
  }, [filteredBuses, stopsByRoute]);

  // ETA calculation
  const [etas, setEtas] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!selectedBus || !selectedRouteId) return;
    const fetchETAs = async () => {
      try {
        const { data } = await httpClient.get(
          `${API_URL}/api/tracking/eta/${selectedBus.busId}/route/${selectedRouteId}`,
        );
        const etaMap: Record<number, number> = {};
        (data as Array<{ stopId: number; estimatedMinutes: number }>).forEach(
          (e: any) => {
            etaMap[e.stopId] = e.estimatedMinutes;
          },
        );
        setEtas(etaMap);
      } catch {
        // Ignore errors
      }
    };
    fetchETAs();
    const interval = setInterval(fetchETAs, 30000);
    return () => clearInterval(interval);
  }, [selectedBus?.busId, selectedRouteId]);

  return (
    <Box className="page-enter">
      <PageHeader
        title="Seguimiento de buses en tiempo real"
        subtitle="Selecciona una ruta para ver la ubicación de los buses en el mapa"
      />

      {lastAlert && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: lastAlert.severity === 'high' || lastAlert.severity === 'critical' ? 'error.light' : 'warning.light',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            ⚠️ {lastAlert.message}
          </Typography>
          <Chip label="Cerrar" size="small" onClick={clearAlert} sx={{ cursor: 'pointer' }} />
        </Paper>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Filtrar por ruta</InputLabel>
          <Select
            value={selectedRouteId ?? ''}
            label="Filtrar por ruta"
            onChange={(e) => {
              const val = e.target.value;
              setSelectedRouteId(val ? Number(val) : undefined);
              setSelectedBus(null);
            }}
          >
            <MenuItem value="">Todas las rutas</MenuItem>
            {rutas?.map((ruta) => (
              <MenuItem key={ruta.id} value={ruta.id}>
                {ruta.name} ({ruta.origin} → {ruta.destination})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: connected ? '#2e7d32' : '#d32f2f',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {connected ? 'Conectado en vivo' : 'Desconectado'}
          </Typography>
        </Stack>

        <Button
          variant={simulatorRunning ? 'outlined' : 'contained'}
          size="small"
          color={simulatorRunning ? 'error' : 'primary'}
          startIcon={
            simulatorLoading ? (
              <CircularProgress size={16} />
            ) : simulatorRunning ? (
              <StopRounded />
            ) : (
              <PlayArrowRounded />
            )
          }
          onClick={toggleSimulator}
          disabled={simulatorLoading}
        >
          {simulatorRunning ? 'Detener simulación' : 'Simular buses'}
        </Button>

        <Chip label={`${filteredBuses.length} buses activos`} color="primary" size="small" />
      </Stack>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Map */}
        <Paper sx={{ flex: 1, overflow: 'hidden', minHeight: 500 }}>
          <MapContainer
            center={[-12.0464, -77.0428]}
            zoom={12}
            style={{ height: 500, width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}

            {/* Route stops */}
            {stopsByRoute.map((stop) => (
              <Marker
                key={stop.stop_id}
                position={[stop.latitude, stop.longitude]}
                icon={STOP_ICON}
              >
                <Popup>
                  <Typography variant="body2" fontWeight={600}>
                    {stop.name}
                  </Typography>
                  {etas[stop.stop_id] !== undefined && (
                    <Typography variant="caption" color="primary">
                      🕐 Llegada estimada: ~{etas[stop.stop_id]} min
                    </Typography>
                  )}
                </Popup>
              </Marker>
            ))}

            {/* Active buses */}
            {filteredBuses.map((bus) => (
              <BusMarker
                key={bus.busId}
                bus={bus}
                isSelected={selectedBus?.busId === bus.busId}
                onClick={() => setSelectedBus(bus)}
              />
            ))}
          </MapContainer>
        </Paper>

        {/* Bus list panel */}
        <Paper sx={{ width: { xs: '100%', md: 320 }, p: 2, maxHeight: 500, overflow: 'auto' }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Buses activos
          </Typography>
          {filteredBuses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay buses activos en este momento.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {filteredBuses.map((bus) => (
                <Paper
                  key={bus.busId}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: selectedBus?.busId === bus.busId ? 'action.selected' : 'transparent',
                    borderLeft: 4,
                    borderLeftColor:
                      bus.status === 'normal'
                        ? 'success.main'
                        : bus.status === 'delayed'
                          ? 'warning.main'
                          : 'error.main',
                  }}
                  onClick={() => setSelectedBus(bus)}
                >
                  <Typography variant="body2" fontWeight={700}>
                    🚌 {bus.plate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {bus.routeName ?? 'Sin ruta'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={bus.status === 'normal' ? 'Normal' : bus.status === 'delayed' ? 'Retraso' : 'Incidente'}
                      size="small"
                      color={bus.status === 'normal' ? 'success' : bus.status === 'delayed' ? 'warning' : 'error'}
                      variant="outlined"
                    />
                    {bus.currentStopName && (
                      <Typography variant="caption" color="text.secondary">
                        {bus.currentStopName}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* Selected bus detail */}
      {selectedBus && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            🚌 Detalle del bus {selectedBus.plate}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Ruta:</strong> {selectedBus.routeName ?? 'Sin asignar'}
              </Typography>
              <Typography variant="body2">
                <strong>Última ubicación:</strong>{' '}
                {new Date(selectedBus.lastUpdate).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Paradero cercano:</strong>{' '}
                {selectedBus.currentStopName ?? '—'}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Pasajeros:</strong> {selectedBus.passengers ?? '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Velocidad:</strong> {selectedBus.speed ?? '—'} km/h
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong>{' '}
                <Chip
                  label={selectedBus.status === 'normal' ? 'Normal' : selectedBus.status === 'delayed' ? 'Retrasado' : 'Incidente'}
                  size="small"
                  color={selectedBus.status === 'normal' ? 'success' : selectedBus.status === 'delayed' ? 'warning' : 'error'}
                />
              </Typography>
            </Stack>
          </Stack>

          {/* ETA to stops */}
          {Object.keys(etas).length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Tiempos estimados de llegada a paraderos
              </Typography>
              <Stack spacing={0.5}>
                {stopsByRoute.map((stop) => (
                  <Box
                    key={stop.stop_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 0.5,
                      bgcolor: etas[stop.stop_id] <= 2 ? 'success.light' : 'transparent',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{stop.name}</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={etas[stop.stop_id] <= 2 ? 'success.dark' : 'text.primary'}
                    >
                      {etas[stop.stop_id]} min
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      )}

      <Snackbar
        open={!!simulatorMsg}
        autoHideDuration={4000}
        onClose={() => setSimulatorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSimulatorMsg(null)}
          severity={simulatorMsg?.includes('Error') ? 'error' : 'info'}
          variant="filled"
        >
          {simulatorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BusTrackingPage;
