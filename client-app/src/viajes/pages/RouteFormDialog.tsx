import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateRoutePayload, Ruta } from "../models/ruta";
import { useStops } from "../stores/useStopsStore";
import {
  useAddStopToRoute,
  useCreateRoute,
  useRemoveStopFromRoute,
  useUpdateRoute,
} from "../stores/useAdminRoutesStore";

type SelectedStop = {
  stop_id: number;
  name: string;
  address: string;
};

type RouteFormDialogProps = {
  open: boolean;
  route: Ruta | null;
  onClose: () => void;
};

const emptyForm: CreateRoutePayload = {
  name: "",
  description: "",
  origin: "",
  destination: "",
  distance: 0,
  estimated_duration: 0,
  tarifa: 0,
  is_active: true,
};

const RouteFormDialog = ({ open, route, onClose }: RouteFormDialogProps) => {
  const isEditing = !!route;
  const { mutateAsync: createRoute, isPending: isCreating } = useCreateRoute();
  const { mutateAsync: updateRoute, isPending: isUpdating } = useUpdateRoute();
  const { mutateAsync: addStop } = useAddStopToRoute();
  const { mutateAsync: removeStop } = useRemoveStopFromRoute();
  const { data: availableStops } = useStops();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateRoutePayload>(emptyForm);
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [stopToAdd, setStopToAdd] = useState<number | "">("");
  const [stopError, setStopError] = useState<string | null>(null);

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
          })),
      );
    } else {
      setForm(emptyForm);
      setSelectedStops([]);
    }
    setStopToAdd("");
    setStopError(null);
  }, [route, open]);

  const handleChange =
    (field: keyof CreateRoutePayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "distance" ||
        field === "estimated_duration" ||
        field === "tarifa"
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleAddStop = () => {
    if (!stopToAdd) return;
    if (selectedStops.some((s) => s.stop_id === stopToAdd)) {
      setStopError("Este paradero ya fue agregado.");
      return;
    }
    const stop = availableStops?.find((s) => s.id === stopToAdd);
    if (!stop) return;
    setSelectedStops((prev) => [
      ...prev,
      { stop_id: stop.id, name: stop.name, address: stop.address },
    ]);
    setStopToAdd("");
    setStopError(null);
  };

  const handleRemoveStop = (stopId: number) => {
    setSelectedStops((prev) => prev.filter((s) => s.stop_id !== stopId));
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
    } else {
      const created = await createRoute(form);
      routeId = created.id;
    }

    // Agregar paraderos en orden secuencial
    for (let i = 0; i < selectedStops.length; i++) {
      await addStop({
        routeId,
        payload: {
          stop_id: selectedStops[i].stop_id,
          order_index: i + 1,
        },
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

  const filteredStops = availableStops?.filter(
    (s) => !selectedStops.some((sel) => sel.stop_id === s.id),
  );

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar ruta" : "Crear nueva ruta"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Crear ruta"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="md"
    >
      <Stack spacing={2.5}>
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
          rows={2}
          inputProps={{ maxLength: 500 }}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Origen"
            value={form.origin}
            onChange={handleChange("origin")}
            required
            fullWidth
            placeholder="Ej: Terminal Norte"
          />
          <TextField
            label="Destino"
            value={form.destination}
            onChange={handleChange("destination")}
            required
            fullWidth
            placeholder="Ej: Terminal Sur"
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Distancia (km)"
            type="number"
            value={form.distance || ""}
            onChange={handleChange("distance")}
            required
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />
          <TextField
            label="Duración estimada (min)"
            type="number"
            value={form.estimated_duration || ""}
            onChange={handleChange("estimated_duration")}
            required
            fullWidth
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Tarifa ($)"
            type="number"
            value={form.tarifa || ""}
            onChange={handleChange("tarifa")}
            required
            fullWidth
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

        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>
            Paraderos en orden secuencial
            <Chip
              label={`${selectedStops.length} seleccionados`}
              size="small"
              sx={{ ml: 1 }}
              color={selectedStops.length >= 3 ? "success" : "warning"}
            />
          </Typography>
          <Typography variant="caption" color="text.secondary" mb={2} display="block">
            Agrega al menos 3 paraderos. El orden en que los agregues define la secuencia de la ruta.
          </Typography>

          {stopError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {stopError}
            </Alert>
          )}

          <Stack direction="row" spacing={1} mb={2}>
            <TextField
              label="Agregar paradero"
              value={stopToAdd}
              onChange={(e) => setStopToAdd(Number(e.target.value))}
              select
              fullWidth
              size="small"
            >
              {filteredStops?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} — {s.address}
                </MenuItem>
              ))}
            </TextField>
            <Tooltip title="Agregar paradero">
              <span>
                <IconButton
                  onClick={handleAddStop}
                  disabled={!stopToAdd}
                  color="primary"
                >
                  <AddRounded />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {selectedStops.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              No hay paraderos seleccionados aún.
            </Typography>
          ) : (
            <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              {selectedStops.map((stop, index) => (
                <ListItem
                  key={stop.stop_id}
                  divider={index < selectedStops.length - 1}
                  secondaryAction={
                    <Tooltip title="Quitar paradero">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveStop(stop.stop_id)}
                      >
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Box sx={{ mr: 1, color: "text.secondary" }}>
                    <DragIndicatorRounded fontSize="small" />
                  </Box>
                  <Chip
                    label={index + 1}
                    size="small"
                    color="primary"
                    sx={{ mr: 1.5, minWidth: 32 }}
                  />
                  <ListItemText
                    primary={stop.name}
                    secondary={stop.address}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Stack>
    </FormDialog>
  );
};

export default RouteFormDialog;