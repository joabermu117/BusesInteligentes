import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import AttachMoneyRounded from "@mui/icons-material/AttachMoneyRounded";
import RouteRounded from "@mui/icons-material/RouteRounded";
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
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../permisos/common/components/PageHeader";
import { formatCurrency, formatDuration } from "../../shared/utils/format";
import type { SelectedStopData } from "../components/MapaSeleccionRuta";
import MapaSeleccionRuta from "../components/MapaSeleccionRuta";
import { useRouteRoadGeometry } from "../hooks/useRouteRoadGeometry";
import { useParaderosByRuta, useRuta } from "../stores/useRutasStore";

const RutaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const routeId = Number(id);

  const { data: ruta, isLoading: isLoadingRuta } = useRuta(routeId);
  const { data: paraderos, isLoading: isLoadingParaderos } =
    useParaderosByRuta(routeId);

  const {
    geometry,
    isLoading: geomLoading,
    failed: geomFailed,
    fetchRoute,
  } = useRouteRoadGeometry();

  const selectedStops = useMemo((): SelectedStopData[] => {
    if (!paraderos) return [];
    return [...paraderos]
      .sort((a, b) => a.order_index - b.order_index)
      .map((p) => ({
        stop_id: p.stop_id,
        name: p.stop.name,
        address: p.stop.address,
        latitude: p.stop.latitude,
        longitude: p.stop.longitude,
      }));
  }, [paraderos]);

  useEffect(() => {
    if (selectedStops.length >= 2) {
      fetchRoute(
        selectedStops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
      );
    }
  }, [selectedStops, fetchRoute]);

  // Fallback con línea recta cuando OSRM falla
  const fallbackGeometry = useMemo(() => {
    if (!geomFailed || selectedStops.length < 2) return null;
    return {
      coordinates: selectedStops.map(
        (s) => [s.latitude, s.longitude] as [number, number],
      ),
      distanceKm: ruta?.distance ?? 0,
      durationMin: ruta?.estimated_duration ?? 0,
    };
  }, [geomFailed, selectedStops, ruta]);

  const activeGeometry = geometry ?? fallbackGeometry;

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

              {ruta.description && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Descripción
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ruta.description}
                    </Typography>
                  </Box>
                </>
              )}

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
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: "primary.main" }}
                  >
                    {formatCurrency(ruta.tarifa)}
                  </Typography>
                </Box>
              </Stack>

              {/* Geometría OSRM o fallback */}
              {activeGeometry && (
                <>
                  <Divider />
                  <Stack direction="row" alignItems="center" gap={1}>
                    <RouteRounded color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="overline" color="text.secondary">
                        {geomFailed
                          ? "Ruta estimada (línea recta)"
                          : "Ruta real por calles"}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        mt={0.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          label={`${activeGeometry.distanceKm} km`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`~${activeGeometry.durationMin} min`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {geomFailed && (
                          <Chip
                            label="Reintentar"
                            size="small"
                            color="warning"
                            variant="outlined"
                            onClick={() =>
                              fetchRoute(
                                selectedStops.map((s) => ({
                                  lat: s.latitude,
                                  lng: s.longitude,
                                })),
                              )
                            }
                            sx={{ cursor: "pointer" }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </>
              )}

              <Divider />

              {/* Lista de paraderos en orden */}
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Paraderos ({selectedStops.length})
                </Typography>
                <Stack spacing={0.75} mt={1}>
                  {selectedStops.map((stop, index) => (
                    <Stack
                      key={stop.stop_id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Chip
                        label={index + 1}
                        size="small"
                        color={
                          index === 0
                            ? "success"
                            : index === selectedStops.length - 1
                              ? "error"
                              : "default"
                        }
                        sx={{ minWidth: 32 }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {stop.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stop.address}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Chip
                  label={ruta.is_active ? "Ruta activa" : "Ruta inactiva"}
                  color={ruta.is_active ? "success" : "default"}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Panel derecho — mapa */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{ p: 0, overflow: "hidden", height: "100%", minHeight: 500 }}
          >
            {isLoadingParaderos ? (
              <Box sx={{ display: "grid", placeItems: "center", height: 500 }}>
                <CircularProgress />
              </Box>
            ) : (
              <MapaSeleccionRuta
                allStops={[]}
                selectedStops={selectedStops}
                geometry={activeGeometry}
                isGeometryLoading={geomLoading}
                onToggleStop={() => {}}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RutaDetalle;
