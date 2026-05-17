import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
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
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import { getAuthUserId } from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useShiftsByDriver } from "../stores/useShiftStore";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: "success" | "warning" | "info" | "error" | "default" }
> = {
  scheduled: { label: "Programado", color: "info" },
  in_progress: { label: "En curso", color: "success" },
  finished: { label: "Finalizado", color: "default" },
  cancelled: { label: "Cancelado", color: "error" },
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

const MisTurnos = () => {
  const navigate = useNavigate();
  const storedDriverUserId = localStorage.getItem("driverUserId");
  const jwtUserId = getAuthUserId();
  const driverUserId = storedDriverUserId ?? jwtUserId ?? "";

  useEffect(() => {
    if (!driverUserId) {
      navigate("/login", { replace: true });
      return;
    }

    if (!storedDriverUserId && jwtUserId) {
      localStorage.setItem("driverUserId", jwtUserId);
    }
  }, [driverUserId, jwtUserId, navigate, storedDriverUserId]);

  const { data: shifts, isLoading } = useShiftsByDriver(driverUserId);

  return (
    <Box className="page-enter">
      <PageHeader
        title="Mis turnos"
        subtitle="Turnos programados y estado actual."
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : shifts && shifts.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fecha / Hora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bus asignado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Condición</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => {
                const config = STATUS_CONFIG[shift.status] ?? {
                  label: shift.status,
                  color: "default" as const,
                };

                return (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CalendarMonthRounded
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {formatDate(shift.startTime)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {shift.bus?.plate ?? "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {shift.bus?.model ?? ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {shift.busCondition ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {shift.status === "scheduled" ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrowRounded />}
                          onClick={() =>
                            navigate(`/turnos/${shift.id}/iniciar`)
                          }
                        >
                          Iniciar turno
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {shift.status === "in_progress"
                            ? "En curso"
                            : "—"}
                        </Typography>
                      )}
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
            No tienes turnos asignados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta con la empresa de transporte para la asignación de turnos.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MisTurnos;
