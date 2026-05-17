import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useBus } from "../../buses/stores/useBusesStore";
import PageHeader from "../../permisos/common/components/PageHeader";
import {
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
} from "../models/incident";
import { useIncidentBusesByBus } from "../stores/useIncidentsStore";

const BusIncidentsDetail = () => {
  const { busId } = useParams<{ busId: string }>();
  const navigate = useNavigate();
  const { data: bus } = useBus(Number(busId));
  const { data: incidentBuses, isLoading } = useIncidentBusesByBus(
    Number(busId),
  );

  const total = incidentBuses?.length ?? 0;
  const resolved = incidentBuses?.filter(
    (ib) => ib.incident?.status === "resolved",
  ).length ?? 0;
  const resolutionRate =
    total > 0 ? Math.round((resolved / total) * 100) : 0;

  const byType = incidentBuses?.reduce(
    (acc, ib) => {
      const type = ib.incident?.type ?? "other";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <Box className="page-enter">
      <Button
        variant="outlined"
        onClick={() => navigate("/incidentes")}
        sx={{ mb: 2 }}
      >
        ← Volver a incidentes
      </Button>

      <PageHeader
        title={`Incidentes del bus ${bus?.plate ?? busId}`}
        subtitle={`${bus?.model ?? ""} — Historial completo de incidentes para análisis de mantenimiento.`}
      />

      {/* Estadísticas */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700}>
              {total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total incidentes
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700}>
              {resolved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resueltos
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" fontWeight={700}>
              {resolutionRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasa de resolución
            </Typography>
          </CardContent>
        </Card>
        {byType &&
          Object.entries(byType).map(([type, count]) => (
            <Card variant="outlined" sx={{ flex: 1 }} key={type}>
              <CardContent>
                <Typography variant="h4" fontWeight={700}>
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {INCIDENT_TYPE_LABELS[type as keyof typeof INCIDENT_TYPE_LABELS]}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </Stack>

      {/* Lista de incidentes */}
      {isLoading ? (
        <Typography>Cargando incidentes...</Typography>
      ) : !incidentBuses || incidentBuses.length === 0 ? (
        <Typography color="text.secondary">
          Este bus no tiene incidentes registrados.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {incidentBuses.map((ib) => (
            <Card key={ib.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                  mb={1}
                >
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={
                        INCIDENT_TYPE_LABELS[
                          ib.incident?.type as keyof typeof INCIDENT_TYPE_LABELS
                        ] ?? "—"
                      }
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={
                        INCIDENT_SEVERITY_LABELS[
                          ib.incident
                            ?.severity as keyof typeof INCIDENT_SEVERITY_LABELS
                        ] ?? "—"
                      }
                      color={
                        INCIDENT_SEVERITY_COLORS[
                          ib.incident
                            ?.severity as keyof typeof INCIDENT_SEVERITY_COLORS
                        ] ?? "default"
                      }
                      size="small"
                    />
                    <Chip
                      label={
                        INCIDENT_STATUS_LABELS[
                          ib.incident
                            ?.status as keyof typeof INCIDENT_STATUS_LABELS
                        ] ?? "—"
                      }
                      color={
                        INCIDENT_STATUS_COLORS[
                          ib.incident
                            ?.status as keyof typeof INCIDENT_STATUS_COLORS
                        ] ?? "warning"
                      }
                      size="small"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {ib.reportedAt
                      ? new Date(ib.reportedAt).toLocaleString("es-CO")
                      : "—"}
                  </Typography>
                </Stack>

                <Typography variant="body2" mb={1}>
                  {ib.incident?.description ?? "Sin descripción."}
                </Typography>

                {ib.incident?.supervisorComment && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontStyle="italic"
                  >
                    Comentario supervisor: {ib.incident.supervisorComment}
                  </Typography>
                )}

                {ib.photos && ib.photos.length > 0 && (
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                    {ib.photos.map((photo) => (
                      <Box
                        key={photo.id}
                        component="img"
                        src={photo.url}
                        alt={photo.description ?? "Foto incidente"}
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default BusIncidentsDetail;