import ConfirmationNumberRounded from "@mui/icons-material/ConfirmationNumberRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useTravelHistory } from "../stores/useTravelStore";

const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
  issued: { label: "En viaje", color: "success" },
  used: { label: "Completado", color: "default" },
  expired: { label: "Expirado", color: "error" },
  cancelled: { label: "Cancelado", color: "warning" },
};

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

const HistorialViajes = () => {
  const navigate = useNavigate();
  const personId = localStorage.getItem("citizenId") ?? "";

  const { data: tickets, isLoading } = useTravelHistory(personId);

  return (
    <Box className="page-enter">
      <PageHeader
        title="Historial de viajes"
        subtitle="Tus boletos y viajes realizados."
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tickets && tickets.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>N° Boleto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ruta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => {
                const config = STATUS_CONFIG[ticket.status] ?? {
                  label: ticket.status,
                  color: "default" as const,
                };
                const routeLabel = ticket.schedule
                  ? `Ruta #${ticket.schedule.routeId}`
                  : "—";
                const busLabel = ticket.schedule?.bus
                  ? `${ticket.schedule.bus.plate}`
                  : "—";

                return (
                  <TableRow
                    key={ticket.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/viajes/${ticket.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ConfirmationNumberRounded
                          sx={{ fontSize: 18, color: "text.secondary" }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {ticket.ticketNumber}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTimeRounded
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {formatDate(ticket.issuedDate)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{routeLabel}</TableCell>
                    <TableCell>{busLabel}</TableCell>
                    <TableCell>
                      <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay viajes registrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aborda un bus para comenzar a registrar tu historial de viajes.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default HistorialViajes;
