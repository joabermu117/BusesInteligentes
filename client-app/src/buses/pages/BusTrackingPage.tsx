import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import StopRounded from "@mui/icons-material/StopRounded";
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
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import httpClient from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { BusLocationData, ProximityNotification } from "../../shared/hooks/useSocketTracking";
import useSocketTracking from "../../shared/hooks/useSocketTracking";
import { useRutas } from "../../viajes/stores/useRutasStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Bus icon factory ──────────────────────────────────────────
const createBusIcon = (status: string, isSelected: boolean) => {
  const colors: Record<string, string> = {
    normal: "#2e7d32",
    delayed: "#ed6c02",
    incident: "#d32f2f",
  };
  const bg = colors[status] || "#1976d2";
  const size = isSelected ? 40 : 32;
  return L.divIcon({
    className: "custom-bus-marker",
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

// ── Stop icon (numbered) ─────────────────────────────────────
const createStopIcon = (index: number) =>
  L.divIcon({
    className: "custom-stop-marker",
    html: `<div style="
      background:#1565c0;color:white;width:26px;height:26px;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.25);
    ">${index}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const ORIGIN_ICON = L.divIcon({
  className: "custom-origin-marker",
  html: `<div style="
    background:#2e7d32;color:white;width:32px;height:32px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
  ">O</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const DESTINATION_ICON = L.divIcon({
  className: "custom-destination-marker",
  html: `<div style="
    background:#d32f2f;color:white;width:32px;height:32px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
  ">D</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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

// ── Bus Marker Component (memoized) ──────────────────────────
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
            {bus.routeName ?? "Sin ruta asignada"}
          </Typography>
          <Divider sx={{ my: 0.5 }} />
          <Stack spacing={0.3}>
            <Typography variant="caption">
              📍 {new Date(bus.lastUpdate).toLocaleTimeString()}
            </Typography>
            {bus.currentStopName && (
              <Typography variant="caption">
                🏁 Cerca de: {bus.currentStopName}
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
            label={
              bus.status === "normal"
                ? "Normal"
                : bus.status === "delayed"
                  ? "Retrasado"
                  : "Incidente"
            }
            color={
              bus.status === "normal"
                ? "success"
                : bus.status === "delayed"
                  ? "warning"
                  : "error"
            }
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
  const { data: rutas } = useRutas();
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>();
  const [selectedBus, setSelectedBus] = useState<BusLocationData | null>(null);
  const [stopsByRoute, setStopsByRoute] = useState<
    Array<{
      stop_id: number;
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    }>
  >([]);
  const [selectedRutaInfo, setSelectedRutaInfo] = useState<{
    name: string;
    origin: string;
    destination: string;
  } | null>(null);

  // ── Simulator ─────────────────────────────────────────────
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorMsg, setSimulatorMsg] = useState<string | null>(null);

  // ── Proximity notifications ──────────────────────────────
  const [proximityAlert, setProximityAlert] = useState<ProximityNotification | null>(null);

  const handleProximity = useCallback((notification: ProximityNotification) => {
    setProximityAlert(notification);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const toggleSimulator = useCallback(async () => {
    setSimulatorLoading(true);
    try {
      if (simulatorRunning) {
        await httpClient.post(`${API_URL}/api/simulator/stop`);
        setSimulatorRunning(false);
        setSimulatorMsg("🛑 Simulador detenido");
      } else {
        const { data } = await httpClient.post(
          `${API_URL}/api/simulator/start`,
        );
        setSimulatorRunning(true);
        setSimulatorMsg(`🚍 ${data.message}`);
      }
    } catch {
      setSimulatorMsg("Error al controlar el simulador");
    } finally {
      setSimulatorLoading(false);
    }
  }, [simulatorRunning]);

  useEffect(() => {
    httpClient
      .get(`${API_URL}/api/simulator/status`)
      .then(({ data }) => {
        setSimulatorRunning(data.running);
      })
      .catch(() => {});
  }, []);

  const handleBusLocationUpdate = useCallback((data: BusLocationData) => {
    setSelectedBus((prev) => (prev?.busId === data.busId ? data : prev));
  }, []);

  const { connected, activeBuses, lastAlert, clearAlert } = useSocketTracking({
    routeId: selectedRouteId,
    subscribeAll: !selectedRouteId,
    onBusLocationUpdate: handleBusLocationUpdate,
    onProximityNotification: handleProximity,
  });

  // Load route info and stops when a route is selected
  useEffect(() => {
    if (!selectedRouteId) {
      setStopsByRoute([]);
      setSelectedRutaInfo(null);
      return;
    }
    httpClient
      .get(`${API_URL}/api/routes/${selectedRouteId}`)
      .then((res) => {
        const route = res.data;
        setSelectedRutaInfo({
          name: route.name || `Ruta #${route.id}`,
          origin: route.origin || "",
          destination: route.destination || "",
        });
        const stops = (route.routeStops || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((rs: any) => ({
            stop_id: rs.stop_id,
            name: rs.stop?.name || `Paradero #${rs.stop_id}`,
            address: rs.stop?.address || "",
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

  // Polyline coordinates for the route
  const polylineCoords = useMemo(() => {
    return stopsByRoute
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [s.latitude, s.longitude] as [number, number]);
  }, [stopsByRoute]);

  // Map points for fitBounds
  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [...polylineCoords];
    filteredBuses.forEach((b) => pts.push([b.latitude, b.longitude]));
    return pts;
  }, [polylineCoords, filteredBuses]);

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
        subtitle="Selecciona una ruta para ver la ubicación de los buses y sus paraderos en el mapa"
      />

      {lastAlert && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor:
              lastAlert.severity === "high" || lastAlert.severity === "critical"
                ? "error.light"
                : "warning.light",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            ⚠️ {lastAlert.message}
          </Typography>
          <Chip
            label="Cerrar"
            size="small"
            onClick={clearAlert}
            sx={{ cursor: "pointer" }}
          />
        </Paper>
      )}

      {proximityAlert && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Chip
              label="Cerrar"
              size="small"
              onClick={() => setProximityAlert(null)}
              sx={{ cursor: "pointer" }}
            />
          }
        >
          <Typography variant="body1" fontWeight={700}>
            🚌 ¡Tu bus está cerca!
          </Typography>
          <Typography variant="body2">
            {proximityAlert.routeName} · Bus {proximityAlert.plate} · Llegada
            estimada: ~{proximityAlert.estimatedMinutes} min al paradero{' '}
            {proximityAlert.stopName}
          </Typography>
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Filtrar por ruta</InputLabel>
          <Select
            value={selectedRouteId ?? ""}
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
              borderRadius: "50%",
              bgcolor: connected ? "#2e7d32" : "#d32f2f",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {connected ? "Conectado en vivo" : "Desconectado"}
          </Typography>
        </Stack>

        <Button
          variant={simulatorRunning ? "outlined" : "contained"}
          size="small"
          color={simulatorRunning ? "error" : "primary"}
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
          {simulatorRunning ? "Detener simulación" : "Simular buses"}
        </Button>

        <Chip
          label={`${filteredBuses.length} buses activos`}
          color="primary"
          size="small"
        />
        {selectedRutaInfo && stopsByRoute.length > 0 && (
          <Chip
            label={`${stopsByRoute.length} paraderos`}
            variant="outlined"
            size="small"
          />
        )}
      </Stack>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Map */}
        <Paper sx={{ flex: 1, overflow: "hidden", minHeight: 500 }}>
          <MapContainer
            center={[-12.0464, -77.0428]}
            zoom={12}
            style={{ height: 500, width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}

            {/* Route polyline connecting stops */}
            {polylineCoords.length >= 2 && (
              <Polyline
                positions={polylineCoords}
                color="#1565c0"
                weight={3}
                opacity={0.6}
                dashArray="10 6"
              />
            )}

            {/* Route stops */}
            {stopsByRoute.map((stop, idx) => {
              if (!stop.latitude || !stop.longitude) return null;
              let icon = createStopIcon(idx + 1);
              if (idx === 0) icon = ORIGIN_ICON;
              else if (idx === stopsByRoute.length - 1) icon = DESTINATION_ICON;

              return (
                <Marker
                  key={stop.stop_id}
                  position={[stop.latitude, stop.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {idx === 0
                          ? "🟢 Salida: "
                          : idx === stopsByRoute.length - 1
                            ? "🔴 Destino: "
                            : ""}
                        {stop.name}
                      </Typography>
                      {stop.address && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {stop.address}
                        </Typography>
                      )}
                      {etas[stop.stop_id] !== undefined && (
                        <Typography
                          variant="caption"
                          color="primary"
                          display="block"
                          sx={{ mt: 0.5 }}
                        >
                          🕐 Bus estimado en ~{etas[stop.stop_id]} min
                        </Typography>
                      )}
                    </Box>
                  </Popup>
                </Marker>
              );
            })}

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

        {/* Right panel */}
        <Box
          sx={{
            width: { xs: "100%", md: 320 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Route info */}
          {selectedRutaInfo && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                {selectedRutaInfo.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {selectedRutaInfo.origin} → {selectedRutaInfo.destination}
              </Typography>
              {stopsByRoute.length > 0 && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ mb: 1, display: "block" }}
                  >
                    Paraderos de la ruta ({stopsByRoute.length})
                  </Typography>
                  <Stack spacing={0.5}>
                    {stopsByRoute.map((stop, idx) => (
                      <Box
                        key={stop.stop_id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 0.3,
                          px: 1,
                          borderRadius: 1,
                          bgcolor:
                            etas[stop.stop_id] !== undefined
                              ? "action.hover"
                              : "transparent",
                        }}
                      >
                        <Chip
                          label={idx + 1}
                          size="small"
                          color={
                            idx === 0
                              ? "success"
                              : idx === stopsByRoute.length - 1
                                ? "error"
                                : "default"
                          }
                          sx={{ minWidth: 28, fontSize: 11 }}
                        />
                        <Typography variant="caption" sx={{ flex: 1 }}>
                          {stop.name}
                        </Typography>
                        {etas[stop.stop_id] !== undefined && (
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="primary"
                          >
                            {etas[stop.stop_id]} min
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Paper>
          )}

          {/* Active buses list */}
          <Paper sx={{ p: 2, flex: 1, maxHeight: 400, overflow: "auto" }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Buses activos {selectedRouteId ? "en esta ruta" : ""}
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
                      cursor: "pointer",
                      bgcolor:
                        selectedBus?.busId === bus.busId
                          ? "action.selected"
                          : "transparent",
                      borderLeft: 4,
                      borderLeftColor:
                        bus.status === "normal"
                          ? "success.main"
                          : bus.status === "delayed"
                            ? "warning.main"
                            : "error.main",
                    }}
                    onClick={() => setSelectedBus(bus)}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      🚌 {bus.plate}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {bus.routeName ?? "Sin ruta"}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          bus.status === "normal"
                            ? "Normal"
                            : bus.status === "delayed"
                              ? "Retraso"
                              : "Incidente"
                        }
                        size="small"
                        color={
                          bus.status === "normal"
                            ? "success"
                            : bus.status === "delayed"
                              ? "warning"
                              : "error"
                        }
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
      </Box>

      {/* Selected bus detail */}
      {selectedBus && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            🚌 Detalle del bus {selectedBus.plate}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={4}>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Ruta:</strong> {selectedBus.routeName ?? "Sin asignar"}
              </Typography>
              <Typography variant="body2">
                <strong>Última ubicación:</strong>{" "}
                {new Date(selectedBus.lastUpdate).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Paradero cercano:</strong>{" "}
                {selectedBus.currentStopName ?? "—"}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Pasajeros:</strong> {selectedBus.passengers ?? "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Velocidad:</strong> {selectedBus.speed ?? "—"} km/h
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong>{" "}
                <Chip
                  label={
                    selectedBus.status === "normal"
                      ? "Normal"
                      : selectedBus.status === "delayed"
                        ? "Retrasado"
                        : "Incidente"
                  }
                  size="small"
                  color={
                    selectedBus.status === "normal"
                      ? "success"
                      : selectedBus.status === "delayed"
                        ? "warning"
                        : "error"
                  }
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
                      display: "flex",
                      justifyContent: "space-between",
                      p: 0.5,
                      bgcolor:
                        etas[stop.stop_id] <= 2
                          ? "success.light"
                          : "transparent",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{stop.name}</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        etas[stop.stop_id] <= 2
                          ? "success.dark"
                          : "text.primary"
                      }
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSimulatorMsg(null)}
          severity={simulatorMsg?.includes("Error") ? "error" : "info"}
          variant="filled"
        >
          {simulatorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BusTrackingPage;
