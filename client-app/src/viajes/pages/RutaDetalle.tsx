import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import AttachMoneyRounded from "@mui/icons-material/AttachMoneyRounded";
import StraightenRounded from "@mui/icons-material/StraightenRounded";
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
import { useParams } from "react-router-dom";
import PageHeader from "../../permisos/common/components/PageHeader";
import MapaRuta from "../components/MapaRuta";
import { useParaderosByRuta, useRuta } from "../stores/useRutasStore";

const RutaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const routeId = Number(id);

  const { data: ruta, isLoading: isLoadingRuta } = useRuta(routeId);
  const { data: paraderos, isLoading: isLoadingParaderos } =
    useParaderosByRuta(routeId);

  if (isLoadingRuta) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ruta) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Ruta no encontrada
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(value);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <Box className="page-enter">
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => window.history.back()}
        sx={{ mb: 2 }}
      >
        Volver a rutas
      </Button>

      <PageHeader
        title={ruta.name}
        subtitle={`${ruta.origin} → ${ruta.destination}`}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Stack gap={2.5}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Origen
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ruta.origin}
                </Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Destino
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {ruta.destination}
                </Typography>
              </Box>

              <Divider />

              <Stack direction="row" alignItems="center" gap={1}>
                <StraightenRounded color="action" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Distancia
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {ruta.distance} km
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <AccessTimeRounded color="action" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Duración estimada
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDuration(ruta.estimated_duration)}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" gap={1}>
                <AttachMoneyRounded color="action" />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Tarifa
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                    {formatCurrency(ruta.tarifa)}
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Chip
                  label={ruta.is_active ? "Ruta activa" : "Ruta inactiva"}
                  color={ruta.is_active ? "success" : "default"}
                />
              </Box>
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
              <MapaRuta paraderos={paraderos ?? []} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RutaDetalle;
