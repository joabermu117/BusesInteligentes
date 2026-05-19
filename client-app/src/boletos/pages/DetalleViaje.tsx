import { useMemo, type ReactNode } from "react";
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
import { useTravelDetail } from "../stores/useTravelStore";
import { useParaderosByRuta } from "../../viajes/stores/useRutasStore";
import MapaRutaDetalle from "../../viajes/components/MapaRutaDetalle";
import { findHistoryByAction } from "../../shared/utils/boarding";
import { formatDate } from "../../shared/utils/format";

const DetalleViaje = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = Number(id);

  const { data: ticket, isLoading: isLoadingTicket } = useTravelDetail(ticketId);
  const routeId = ticket?.schedule?.routeId;
  const { data: paraderos, isLoading: isLoadingParaderos } = useParaderosByRuta(routeId ?? 0);

  const boardedHistory = findHistoryByAction(ticket?.history, "boarded");
  const validatedHistory = findHistoryByAction(ticket?.history, "validated");

  const boardedNodeId = boardedHistory?.nodeId ? Number(boardedHistory.nodeId) : null;
  const validatedNodeId = validatedHistory?.nodeId ? Number(validatedHistory.nodeId) : null;

  const tiempoTotal = useMemo(() => {
    if (boardedHistory?.timestamp && validatedHistory?.timestamp) {
      const diffMs =
        new Date(validatedHistory.timestamp).getTime() -
        new Date(boardedHistory.timestamp).getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 60) return `${minutes} min`;
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
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
        <Typography variant="h6" color="text.secondary">Viaje no encontrado</Typography>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate("/viajes/historial")} sx={{ mb: 2 }}>
        Volver al historial
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>Detalle del viaje</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Boleto: {ticket.ticketNumber}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Stack gap={2.5}>
              <StatusChip status={ticket.status} />
              <Divider />

              <InfoRow icon={<DirectionsBusRounded color="action" />} label="Bus">
                <Typography variant="body1" fontWeight={600}>{ticket.schedule?.bus?.plate ?? "—"}</Typography>
                {ticket.schedule?.bus?.model && (
                  <Typography variant="caption" color="text.secondary">{ticket.schedule.bus.model}</Typography>
                )}
              </InfoRow>

              <InfoRow icon={<PersonRounded color="action" />} label="Conductor">
                <Typography variant="body1" fontWeight={600}>
                  {ticket.driver?.name
                    ? ticket.driver.name
                    : ticket.driver?.driverUserId
                      ? `ID: ${ticket.driver.driverUserId.slice(0, 8)}...`
                      : "—"}
                </Typography>
                {ticket.driver?.licenseNumber && (
                  <Typography variant="caption" color="text.secondary">
                    Licencia: {ticket.driver.licenseNumber}
                  </Typography>
                )}
              </InfoRow>

              <Divider />

              {boardedHistory && (
                <InfoRow icon={<AccessTimeRounded color="success" />} label="Abordaje">
                  <Typography variant="body2" fontWeight={600}>{formatDate(boardedHistory.timestamp)}</Typography>
                  {boardedHistory.details && (
                    <Typography variant="caption" color="text.secondary">{boardedHistory.details}</Typography>
                  )}
                </InfoRow>
              )}

              {validatedHistory && (
                <InfoRow icon={<AccessTimeRounded color="error" />} label="Descenso">
                  <Typography variant="body2" fontWeight={600}>{formatDate(validatedHistory.timestamp)}</Typography>
                  {validatedHistory.details && (
                    <Typography variant="caption" color="text.secondary">{validatedHistory.details}</Typography>
                  )}
                </InfoRow>
              )}

              {tiempoTotal && (
                <InfoRow icon={<ScheduleRounded color="action" />} label="Tiempo total de viaje">
                  <Typography variant="h6" fontWeight={800} color="primary.main">{tiempoTotal}</Typography>
                </InfoRow>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 0, overflow: "hidden" }}>
            {isLoadingParaderos ? (
              <Box sx={{ display: "grid", placeItems: "center", height: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <MapaRutaDetalle
                paraderos={paraderos ?? []}
                boardedNodeId={boardedNodeId}
                validatedNodeId={validatedNodeId}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const StatusChip = ({ status }: { status: string }) => {
  const label = status === "used" ? "Completado" : status === "issued" ? "En viaje" : status;
  const color = status === "used" ? "default" : status === "issued" ? "success" : "error" as "default" | "success" | "error";
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">Estado</Typography>
      <Chip label={label} color={color} size="small" sx={{ mt: 0.5 }} />
    </Box>
  );
};

const InfoRow = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <Stack direction="row" alignItems="center" gap={1}>
    {icon}
    <Box>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      {children}
    </Box>
  </Stack>
);

export default DetalleViaje;
