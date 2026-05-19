import RouteRounded from "@mui/icons-material/RouteRounded";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateRoutePayload, Ruta } from "../models/ruta";
import type { Stop } from "../models/stop";
import { useStops } from "../stores/useStopsStore";
import {
  useAddStopToRoute,
  useCreateRoute,
  useRemoveStopFromRoute,
  useUpdateRoute,
} from "../stores/useAdminRoutesStore";
import ListaParaderosRuta from "../components/ListaParaderosRuta";
import MapaSeleccionRuta from "../components/MapaSeleccionRuta";
import { useRouteRoadGeometry } from "../hooks/useRouteRoadGeometry";

const EMPTY_FORM: CreateRoutePayload = {
  name: "",
  description: "",
  origin: "",
  destination: "",
  distance: 0,
  estimated_duration: 0,
  tarifa: 0,
  is_active: true,
};

type SelectedStopData = {
  stop_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type RouteFormDialogProps = {
  open: boolean;
  route: Ruta | null;
  onClose: () => void;
};

const StopInfoRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
    {label}: <Box component="span" sx={{ fontWeight: 400 }}>{value}</Box>
  </Typography>
);

const RouteFormDialog = ({ open, route, onClose }: RouteFormDialogProps) => {
  const isEditing = !!route;
  const { mutateAsync: createRoute, isPending: isCreating } = useCreateRoute();
  const { mutateAsync: updateRoute, isPending: isUpdating } = useUpdateRoute();
  const { mutateAsync: addStop } = useAddStopToRoute();
  const { mutateAsync: removeStop } = useRemoveStopFromRoute();
  const { data: allStops } = useStops();
  const { geometry, isLoading: geomLoading, fetchRoute } = useRouteRoadGeometry();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateRoutePayload>(EMPTY_FORM);
  const [selectedStops, setSelectedStops] = useState<SelectedStopData[]>([]);
  const [stopError, setStopError] = useState<string | null>(null);

  // ── Inicializar ────────────────────────────────────────────────
  useEffect(() => {
    if (route) {
      setForm({
        name: route.name,
        description: route.description ?? "",
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        estimated_duration: route.estimated_duration,
        tarifa: route.tarifa,
        is_active: route.is_active,
      });
      setSelectedStops(
        (route.routeStops ?? [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((rs) => ({
            stop_id: rs.stop_id,
            name: rs.stop?.name ?? "",
            address: rs.stop?.address ?? "",
            latitude: rs.stop?.latitude ?? 0,
            longitude: rs.stop?.longitude ?? 0,
          })),
      );
    } else {
      setForm(EMPTY_FORM);
      setSelectedStops([]);
    }
    setStopError(null);
  }, [route, open]);

  // ── Consultar OSRM cuando cambien los stops seleccionados ──────
  useEffect(() => {
    if (selectedStops.length >= 3) {
      fetchRoute(
        selectedStops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
      );
    }
  }, [selectedStops, fetchRoute]);

  // ── Autocompletar campos con datos de OSRM ─────────────────────
  useEffect(() => {
    if (!geometry) return;

    setForm((prev) => {
      const first = selectedStops[0];
      const last = selectedStops[selectedStops.length - 1];
      return {
        ...prev,
        origin: prev.origin || (first?.name ?? ""),
        destination: prev.destination || (last?.name ?? ""),
        distance: prev.distance || geometry.distanceKm,
        estimated_duration: prev.estimated_duration || geometry.durationMin,
      };
    });
  }, [geometry, selectedStops]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleChange =
    (field: keyof CreateRoutePayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        ["distance", "estimated_duration", "tarifa"].includes(field)
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleToggleStop = useCallback((stop: Stop) => {
    setSelectedStops((prev) => {
      const exists = prev.find((s) => s.stop_id === stop.id);
      if (exists) return prev.filter((s) => s.stop_id !== stop.id);
      return [
        ...prev,
        {
          stop_id: stop.id!,
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
        },
      ];
    });
    setStopError(null);
  }, []);

  const handleRemoveStop = (stopId: number) =>
    setSelectedStops((prev) => prev.filter((s) => s.stop_id !== stopId));

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedStops((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedStops.length - 1) return;
    setSelectedStops((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedStops.length < 3) {
      setStopError("La ruta debe tener al menos 3 paraderos.");
      return;
    }

    let routeId: number;

    if (isEditing && route) {
      const updated = await updateRoute({ id: route.id, payload: form });
      routeId = updated.id;
      for (const rs of route.routeStops ?? []) {
        try {
          await removeStop({ routeId, stopId: rs.stop_id });
        } catch {
          /* ignorar */
        }
      }
    } else {
      const created = await createRoute(form);
      routeId = created.id;
    }

    for (let i = 0; i < selectedStops.length; i++) {
      await addStop({
        routeId,
        payload: { stop_id: selectedStops[i].stop_id, order_index: i + 1 },
      });
    }

    onClose();
  };

  const isFormValid =
    form.name.trim().length >= 3 &&
    form.origin.trim().length >= 3 &&
    form.destination.trim().length >= 3 &&
    form.distance > 0 &&
    form.estimated_duration > 0;

  const allStopsList = useMemo(() => allStops ?? [], [allStops]);

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar ruta" : "Crear nueva ruta"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Crear ruta"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="lg"
    >
      <Stack spacing={2.5}>
        {/* ── Fila superior: info de la ruta ── */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Nombre de la ruta"
            value={form.name}
            onChange={handleChange("name")}
            required
            fullWidth
            inputProps={{ maxLength: 255 }}
            placeholder="Ej: Ruta Norte-Sur"
          />
          <TextField
            label="Descripción"
            value={form.description}
            onChange={handleChange("description")}
            fullWidth
            multiline
            rows={1}
            inputProps={{ maxLength: 500 }}
          />
        </Stack>

        {/* ── Fila: origen, destino, distancia, duración, tarifa ── */}
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Origen"
            value={form.origin}
            onChange={handleChange("origin")}
            required
            size="small"
            sx={{ flex: 2 }}
          />
          <TextField
            label="Destino"
            value={form.destination}
            onChange={handleChange("destination")}
            required
            size="small"
            sx={{ flex: 2 }}
          />
          <TextField
            label="Distancia (km)"
            type="number"
            value={form.distance || ""}
            onChange={handleChange("distance")}
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ min: 0, step: 0.1 }}
          />
          <TextField
            label="Duración (min)"
            type="number"
            value={form.estimated_duration || ""}
            onChange={handleChange("estimated_duration")}
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Tarifa ($)"
            type="number"
            value={form.tarifa || ""}
            onChange={handleChange("tarifa")}
            size="small"
            sx={{ flex: 1 }}
            inputProps={{ min: 0, step: 100 }}
          />
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
            />
          }
          label="Ruta activa"
        />

        <Divider />

        {/* ── Sección de paraderos con mapa ── */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Paraderos de la ruta
              <Chip
                label={`${selectedStops.length} seleccionados`}
                size="small"
                sx={{ ml: 1 }}
                color={selectedStops.length >= 3 ? "success" : "warning"}
              />
            </Typography>

            {/* Info de ruta calculada */}
            {selectedStops.length >= 3 && (
              <Stack direction="row" spacing={1} alignItems="center">
                {geomLoading ? (
                  <CircularProgress size={16} />
                ) : geometry ? (
                  <>
                    <Chip
                      icon={<RouteRounded sx={{ fontSize: 14 }} />}
                      label={`${geometry.distanceKm} km`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={`~${geometry.durationMin} min`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </>
                ) : null}
              </Stack>
            )}
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            mb={1.5}
            display="block"
          >
            Haz clic en los marcadores del mapa para agregar o quitar paraderos.
            La ruta se calcula automáticamente por las calles usando OSRM.
          </Typography>

          {stopError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {stopError}
            </Alert>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="stretch"
          >
            {/* Mapa */}
            <Box sx={{ flex: 1.3, minHeight: 420 }}>
              <MapaSeleccionRuta
                allStops={allStopsList}
                selectedStops={selectedStops}
                geometry={geometry}
                isGeometryLoading={geomLoading}
                onToggleStop={handleToggleStop}
              />
            </Box>

            {/* Lista lateral */}
            <ListaParaderosRuta
              selectedStops={selectedStops}
              availableStops={allStopsList}
              onToggleStop={handleToggleStop}
              onRemoveStop={handleRemoveStop}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </Stack>

          {/* Indicador de ruta real contra línea recta */}
          {geometry && selectedStops.length >= 3 && (
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <StopInfoRow
                  label="Distancia por calles"
                  value={`${geometry.distanceKm} km`}
                  color="primary.main"
                />
                <StopInfoRow
                  label="Tiempo estimado"
                  value={`~${geometry.durationMin} min`}
                  color="primary.main"
                />
                <StopInfoRow
                  label="Paraderos"
                  value={`${selectedStops.length}`}
                />
              </Stack>
            </Box>
          )}
        </Box>
      </Stack>
    </FormDialog>
  );
};

export default RouteFormDialog;
