import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateStopPayload, Stop } from "../models/stop";
import { useCreateStop, useUpdateStop } from "../stores/useStopsStore";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";

const PIN_ICON = L.divIcon({
  className: "custom-marker-pin",
  html: `<div style="background:#cf3b23;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

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

const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
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
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState("");

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
      setMapCenter([stop.latitude, stop.longitude]);
    } else {
      setForm(emptyForm);
      setMarkerPos(null);

      // Try getting user location for default center
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setMapCenter([lat, lng]);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 5000 },
        );
      }
    }
    setSearchQuery("");
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

  const handleMapSelect = useCallback((lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setMapCenter([lat, lng]);
    setForm((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(7)),
      longitude: parseFloat(lng.toFixed(7)),
    }));

    // Reverse geocode using Nominatim
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.display_name) {
          setForm((prev) => ({
            ...prev,
            address: data.display_name.split(",").slice(0, 3).join(","),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        setMarkerPos([latNum, lngNum]);
        setMapCenter([latNum, lngNum]);
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(latNum.toFixed(7)),
          longitude: parseFloat(lngNum.toFixed(7)),
          address: display_name.split(",").slice(0, 3).join(","),
        }));
      }
    } catch {
      // Search failed silently
    }
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
          inputProps={{ maxLength: 500 }}
          placeholder="Se autocompleta al hacer clic en el mapa"
          multiline
          rows={2}
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
            helperText="Haz clic en el mapa o usa la búsqueda"
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

        {/* Search bar */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            label="Buscar ubicación"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchLocation();
            }}
            size="small"
            fullWidth
            placeholder="Ej: Plaza Mayor, Bogotá"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleSearchLocation}
            sx={{ flexShrink: 0, height: 40 }}
          >
            Buscar
          </Button>
        </Stack>

        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Haz clic en el mapa para marcar la ubicación del paradero. También puedes arrastrar el marcador.
          </Typography>
          <Box
            sx={{
              height: 350,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onSelect={handleMapSelect} />
              <MapCenterUpdater center={mapCenter} />
              {markerPos && (
                <Marker
                  position={markerPos}
                  icon={PIN_ICON}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      handleMapSelect(pos.lat, pos.lng);
                    },
                  }}
                />
              )}
            </MapContainer>
          </Box>
        </Box>
      </Stack>
    </FormDialog>
  );
};

export default StopFormDialog;
