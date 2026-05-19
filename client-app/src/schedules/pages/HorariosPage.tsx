import SearchRounded from "@mui/icons-material/SearchRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useAdminRoutes } from "../../viajes/stores/useAdminRoutesStore";
import {
  SCHEDULE_RECURRENCE_LABELS,
  SCHEDULE_STATUS_COLORS,
  SCHEDULE_STATUS_LABELS,
} from "../models/schedule";
import { useSchedules } from "../stores/useSchedulesStore";

const HorariosPage = () => {
  const { data: schedules, isLoading } = useSchedules();
  const { data: routes } = useAdminRoutes();
  const [filterRouteId, setFilterRouteId] = useState<number | "">("");

  const filtered = schedules?.filter((s) => {
    if (filterRouteId !== "" && s.routeId !== filterRouteId) return false;
    // Solo mostrar programadas o en curso
    if (s.status === "cancelled" || s.status === "completed") return false;
    return true;
  });

  return (
    <Box className="page-enter">
      <PageHeader
        title="Horarios de transporte"
        subtitle="Consulta las programaciones de buses disponibles por ruta."
      />

      <TextField
        label="Filtrar por ruta"
        value={filterRouteId}
        onChange={(e) =>
          setFilterRouteId(e.target.value === "" ? "" : Number(e.target.value))
        }
        select
        size="small"
        sx={{ mb: 3, minWidth: 280 }}
        slotProps={{
          input: {
            startAdornment: (
              <SearchRounded sx={{ mr: 1, color: "text.secondary" }} />
            ),
          },
        }}
      >
        <MenuItem value="">Todas las rutas</MenuItem>
        {routes?.map((r) => (
          <MenuItem key={r.id} value={r.id}>
            {r.name} — {r.origin} → {r.destination}
          </MenuItem>
        ))}
      </TextField>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !filtered || filtered.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={6}>
          No hay programaciones disponibles.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filtered.map((schedule) => (
            <Card key={schedule.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ sm: "center" }}
                  spacing={1}
                >
                  {/* Info de ruta */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {schedule.route
                        ? schedule.route.name
                        : `Ruta #${schedule.routeId}`}
                    </Typography>
                    {schedule.route && (
                      <Typography variant="body2" color="text.secondary">
                        {schedule.route.origin} → {schedule.route.destination}
                      </Typography>
                    )}
                  </Box>

                  {/* Estado */}
                  <Chip
                    label={SCHEDULE_STATUS_LABELS[schedule.status]}
                    color={SCHEDULE_STATUS_COLORS[schedule.status]}
                    size="small"
                  />
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  mt={1.5}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {/* Hora de salida */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AccessTimeRounded
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                    <Typography variant="body2">
                      <strong>Salida:</strong>{" "}
                      {new Date(schedule.departureTime).toLocaleString("es-CO")}
                    </Typography>
                  </Stack>

                  {/* Bus */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <DirectionsBusRounded
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                    <Typography variant="body2">
                      <strong>Bus:</strong>{" "}
                      {schedule.bus?.plate ?? "—"} — {schedule.bus?.model ?? ""}
                    </Typography>
                  </Stack>

                  {/* Empresa */}
                  {schedule.bus?.company && (
                    <Typography variant="body2">
                      <strong>Empresa:</strong> {schedule.bus.company.nombre}
                    </Typography>
                  )}

                  {/* Tolerancia */}
                  {schedule.toleranceMinutes != null && (
                    <Typography variant="body2" color="text.secondary">
                      Tolerancia: ± {schedule.toleranceMinutes} min
                    </Typography>
                  )}

                  {/* Recurrencia */}
                  {schedule.recurrence !== "none" && (
                    <Chip
                      label={SCHEDULE_RECURRENCE_LABELS[schedule.recurrence]}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default HorariosPage;