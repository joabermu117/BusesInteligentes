import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { useTravelDetail } from "../stores/useTravelStore";
import { useParaderosByRuta } from "../../viajes/stores/useRutasStore";

const BOARDING_ICON = L.divIcon({
  className: "custom-marker-boarding",
  html: `<div style="
    background: #2e7d32;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">A</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ALIGHTING_ICON = L.divIcon({
  className: "custom-marker-alighting",
  html: `<div style="
    background: #d32f2f;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">D</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const STOP_ICON = L.divIcon({
  className: "custom-marker-stop",
  html: `<div style="
    background: #cf3b23;
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">P</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DetalleViaje = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const { data: ticket, isLoading: isLoadingTicket } = useTravelDetail(ticketId);
  const routeId = ticket?.schedule?.routeId;
  const { data: paraderos, isLoading: isLoadingParaderos } = useParaderosByRuta(routeId ?? 0);

  const boardedHistory = ticket?.history?.find((h) => h.action === "boarded");
  const validatedHistory = ticket?.history?.find((h) => h.action === "validated");

  const boardedNodeId = boardedHistory?.nodeId ? Number(boardedHistory.nodeId) : null;
  const validatedNodeId = validatedHistory?.nodeId ? Number(validatedHistory.nodeId) : null;

  const sortedParaderos = useMemo(
    () => (paraderos ?? []).sort((a, b) => a.order_index - b.order_index),
    [paraderos]
  );

  const center = useMemo(() => {
    if (sortedParaderos.length === 0) return [-12.0464, -77.0428] as [number, number];
    const latAvg =
      sortedParaderos.reduce((sum, p) => sum + p.stop.latitude, 0) /
      sortedParaderos.length;
    const lngAvg =
      sortedParaderos.reduce((sum, p) => sum + p.stop.longitude, 0) /
      sortedParaderos.length;
    return [latAvg, lngAvg] as [number, number];
  }, [sortedParaderos]);

  const polylinePositions: [number, number][] = sortedParaderos.map(
    (p) => [p.stop.latitude, p.stop.longitude] as [number, number]
  );

  const tiempoTotal = useMemo(() => {
    if (boardedHistory?.timestamp && validatedHistory?.timestamp) {
      const diffMs =
        new Date(validatedHistory.timestamp).getTime() -
        new Date(boardedHistory.timestamp).getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 60) return `${minutes} min`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
    }
    return null;
  }, [boardedHistory, validatedHistory]);

  if (isLoadingTicket) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Viaje no encontrado
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/viajes/historial")}
        sx={{ mb: 2 }}
      >
        Volver al historial
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Detalle del viaje
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Boleto: {ticket.ticketNumber}
      </Typography>

      <Grid container spacing={3}>
        {/* Info panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Stack gap={2.5}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  label={ticket.status === "used" ? "Completado" : ticket.status === "issued" ? "En viaje" : ticket.status}
                  color={ticket.status === "used" ? "default" : ticket.status === "issued" ? "success" : "error"}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Divider />

              <Stack direction="row" alignItems="center" gap={1}>
                <DirectionsBusRounded color="action" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Bus
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {ticket.schedule?.bus?.plate ?? "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ticket.schedule?.bus?.model ?? ""}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <PersonRounded color="action" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Conductor
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {ticket.driver?.driverUserId
                      ? `Conductor #${ticket.driver.driverUserId}`
                      : ticket.schedule?.bus?.plate
                        ? "Asignado"
                        : "—"}
                  </Typography>
                  {ticket.driver?.licenseNumber && (
                    <Typography variant="caption" color="text.secondary">
                      Licencia: {ticket.driver.licenseNumber}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Divider />

              {boardedHistory && (
                <Stack direction="row" alignItems="center" gap={1}>
                  <AccessTimeRounded color="success" />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Abordaje
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(boardedHistory.timestamp)}
                    </Typography>
                    {boardedHistory.details && (
                      <Typography variant="caption" color="text.secondary">
                        {boardedHistory.details}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}

              {validatedHistory && (
                <Stack direction="row" alignItems="center" gap={1}>
                  <AccessTimeRounded color="error" />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Descenso
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(validatedHistory.timestamp)}
                    </Typography>
                    {validatedHistory.details && (
                      <Typography variant="caption" color="text.secondary">
                        {validatedHistory.details}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}

              {tiempoTotal && (
                <Stack direction="row" alignItems="center" gap={1}>
                  <ScheduleRounded color="action" />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Tiempo total de viaje
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      {tiempoTotal}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Map */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 0, overflow: "hidden" }}>
            {isLoadingParaderos ? (
              <Box sx={{ display: "grid", placeItems: "center", height: 400 }}>
                <CircularProgress />
              </Box>
            ) : sortedParaderos.length === 0 ? (
              <Box
                sx={{
                  height: 400,
                  display: "grid",
                  placeItems: "center",
                  color: "#888",
                }}
              >
                No hay paraderos registrados para esta ruta.
              </Box>
            ) : (
              <MapContainer
                center={center}
                zoom={14}
                style={{ height: 400, width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline
                  positions={polylinePositions}
                  color="#cf3b23"
                  weight={3}
                  opacity={0.8}
                />
                {sortedParaderos.map((paradero) => {
                  const isBoarding = paradero.stop_id === boardedNodeId;
                  const isAlighting = paradero.stop_id === validatedNodeId;
                  let icon = STOP_ICON;
                  if (isBoarding) icon = BOARDING_ICON;
                  if (isAlighting) icon = ALIGHTING_ICON;

                  return (
                    <Marker
                      key={`${paradero.stop_id}-${paradero.order_index}`}
                      position={[
                        paradero.stop.latitude,
                        paradero.stop.longitude,
                      ]}
                      icon={icon}
                    >
                      <Popup>
                        <strong>{paradero.stop.name}</strong>
                        <br />
                        {paradero.stop.address}
                        {isBoarding && (
                          <>
                            <br />
                            <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                              ★ Abordaje
                            </span>
                          </>
                        )}
                        {isAlighting && (
                          <>
                            <br />
                            <span style={{ color: "#d32f2f", fontWeight: 700 }}>
                              ★ Descenso
                            </span>
                          </>
                        )}
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DetalleViaje;
