import {
  Box,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateStopPayload, Stop } from "../models/stop";
import { useCreateStop, useUpdateStop } from "../stores/useStopsStore";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const PIN_ICON = L.divIcon({
  className: "custom-marker-pin",
  html: `<div style="background:#cf3b23;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Componente interno que captura clics en el mapa
const MapClickHandler = ({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

type StopFormDialogProps = {
  open: boolean;
  stop: Stop | null;
  onClose: () => void;
};

const DEFAULT_CENTER: [number, number] = [4.7110, -74.0721]; // Bogotá

const emptyForm: CreateStopPayload = {
  name: "",
  latitude: 0,
  longitude: 0,
  address: "",
  is_active: true,
};

const StopFormDialog = ({ open, stop, onClose }: StopFormDialogProps) => {
  const isEditing = !!stop;
  const { mutateAsync: createStop, isPending: isCreating } = useCreateStop();
  const { mutateAsync: updateStop, isPending: isUpdating } = useUpdateStop();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateStopPayload>(emptyForm);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (stop) {
      setForm({
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        address: stop.address,
        is_active: stop.is_active,
      });
      setMarkerPos([stop.latitude, stop.longitude]);
    } else {
      setForm(emptyForm);
      setMarkerPos(null);
    }
  }, [stop, open]);

  const handleChange =
    (field: keyof CreateStopPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "latitude" || field === "longitude"
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleMapSelect = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setForm((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(7)),
      longitude: parseFloat(lng.toFixed(7)),
    }));
  };

  const handleSubmit = async () => {
    if (isEditing && stop) {
      await updateStop({ id: stop.id, payload: form });
    } else {
      await createStop(form);
    }
    onClose();
  };

  const isFormValid =
    form.name.trim().length >= 3 &&
    form.address.trim().length >= 3 &&
    form.latitude !== 0 &&
    form.longitude !== 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar paradero" : "Registrar nuevo paradero"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Registrar paradero"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="md"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Nombre del paradero"
          value={form.name}
          onChange={handleChange("name")}
          required
          fullWidth
          inputProps={{ maxLength: 255 }}
          placeholder="Ej: Paradero Centro Comercial"
        />

        <TextField
          label="Dirección"
          value={form.address}
          onChange={handleChange("address")}
          required
          fullWidth
          inputProps={{ maxLength: 255 }}
          placeholder="Ej: Calle 10 # 5-20"
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Latitud"
            type="number"
            value={form.latitude || ""}
            onChange={handleChange("latitude")}
            required
            fullWidth
            inputProps={{ step: 0.0000001 }}
            helperText="Puedes hacer clic en el mapa"
          />
          <TextField
            label="Longitud"
            type="number"
            value={form.longitude || ""}
            onChange={handleChange("longitude")}
            required
            fullWidth
            inputProps={{ step: 0.0000001 }}
          />
        </Stack>

        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Haz clic en el mapa para marcar la ubicación del paradero
          </Typography>
          <Box sx={{ height: 300, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            <MapContainer
              center={markerPos ?? DEFAULT_CENTER}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={handleMapSelect} />
              {markerPos && (
                <Marker position={markerPos} icon={PIN_ICON} />
              )}
            </MapContainer>
          </Box>
        </Box>
      </Stack>
    </FormDialog>
  );
};

export default StopFormDialog;