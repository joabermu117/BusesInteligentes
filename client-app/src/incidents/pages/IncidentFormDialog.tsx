import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useActiveShiftByBus } from "../../boletos/stores/useShiftStore";
import { useBuses } from "../../buses/stores/useBusesStore";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateIncidentPayload } from "../models/incident";
import {
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_TYPE_OPTIONS,
} from "../models/incident";
import {
  useCreateIncident,
  useCreateIncidentBus,
  useCreatePhoto,
} from "../stores/useIncidentsStore";

const NOTIFICATIONS_URL =
  import.meta.env.VITE_NOTIFICATIONS_URL || "http://localhost:8082";

const MAX_PHOTOS = 5;

type IncidentFormDialogProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = CreateIncidentPayload & {
  busId: number | "";
  photos: (string | null)[];
};

const emptyForm: FormState = {
  type: "mechanical",
  severity: "low",
  description: "",
  busId: "",
  photos: [null, null, null, null, null],
};

const IncidentFormDialog = ({ open, onClose }: IncidentFormDialogProps) => {
  const { mutateAsync: createIncident, isPending: isCreatingIncident } =
    useCreateIncident();
  const { mutateAsync: createIncidentBus, isPending: isCreatingLink } =
    useCreateIncidentBus();
  const { mutateAsync: createPhoto, isPending: isCreatingPhoto } =
    useCreatePhoto();
  const { data: buses } = useBuses();
  const isSubmitting = isCreatingIncident || isCreatingLink || isCreatingPhoto;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Obtener turno activo automáticamente cuando se selecciona un bus
  const selectedBus = buses?.find((b) => b.id === form.busId);
  const { data: activeShift, isLoading: isLoadingShift } = useActiveShiftByBus(
    form.busId !== "" ? Number(form.busId) : 0,
  );

  // Obtener ubicación GPS del dispositivo al abrir
  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setLocation(null);
      setLocationError(null);
      setNotifyError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Tu dispositivo no soporta geolocalización.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Si falla el GPS del dispositivo, intentar usar el GPS del bus
        setLocationError(
          "No se pudo obtener la ubicación del dispositivo. Se usará la última ubicación conocida del bus.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [open]);

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: field === "busId" ? Number(e.target.value) : e.target.value,
      }));
    };

  const handlePhotoChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => {
        const photos = [...prev.photos];
        photos[index] = reader.result as string;
        return { ...prev, photos };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => {
      const photos = [...prev.photos];
      photos[index] = null;
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
      return { ...prev, photos };
    });
  };

  const sendSupervisorNotification = async (supervisorEmail: string) => {
    try {
      await fetch(
        `${NOTIFICATIONS_URL}/api/public/notifications/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: supervisorEmail,
            subject: `⚠️ Incidente ${form.severity === "critical" ? "CRÍTICO" : "ALTO"} reportado — Bus ${selectedBus?.plate}`,
            title: "Alerta de Incidente",
            user_name: "Supervisor",
            message: `Se ha reportado un incidente de gravedad <strong>${form.severity === "critical" ? "CRÍTICA" : "ALTA"}</strong> en el bus <strong>${selectedBus?.plate} (${selectedBus?.model})</strong>.<br/><br/>
              <strong>Tipo:</strong> ${form.type}<br/>
              <strong>Descripción:</strong> ${form.description || "Sin descripción"}<br/>
              <strong>Conductor:</strong> ${activeShift?.driverUserId ?? "No identificado"}<br/>
              <strong>Timestamp:</strong> ${new Date().toLocaleString("es-CO")}`,
            footer:
              "Por favor revise el panel de incidentes para más detalles.",
          }),
        },
      );
    } catch {
      setNotifyError(
        "El incidente fue registrado pero no se pudo notificar al supervisor.",
      );
    }
  };

  const handleSubmit = async () => {
    setNotifyError(null);

    // Determinar ubicación final
    const finalLat =
      location?.lat ?? activeShift?.bus?.gps?.latitude ?? undefined;
    const finalLng =
      location?.lng ?? activeShift?.bus?.gps?.longitude ?? undefined;

    // 1. Crear el incidente
    const incident = await createIncident({
      type: form.type,
      severity: form.severity,
      description: form.description,
    });

    // 2. Vincular con el bus incluyendo turno, conductor y ubicación
    const incidentBus = await createIncidentBus({
      busId: Number(form.busId),
      incidentId: incident.id,
      shiftId: activeShift?.id,
      driverId: activeShift?.driver?.person_id
        ? Number(activeShift.driver.person_id)
        : undefined,
      latitude: finalLat ? Number(finalLat) : undefined,
      longitude: finalLng ? Number(finalLng) : undefined,
    });

    // 3. Subir fotos
    const photosToUpload = form.photos.filter((p) => p !== null) as string[];
    try {
      for (const photoUrl of photosToUpload) {
        await createPhoto({
          url: photoUrl,
          incidentBusId: incidentBus.id,
        });
      }
    } catch {
      setNotifyError(
        "El incidente fue registrado pero hubo un error al subir las fotos.",
      );
    }

    // 4. Notificar al supervisor si gravedad es alta o crítica
    const supervisorEmail = selectedBus?.company?.email;
    if (
      (form.severity === "high" || form.severity === "critical") &&
      supervisorEmail
    ) {
      await sendSupervisorNotification(supervisorEmail);
    }

    onClose();
  };

  const isFormValid = form.busId !== "" && form.type && form.severity;

  return (
    <FormDialog
      open={open}
      title="Reportar incidente"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Reportar incidente"
      submitting={isSubmitting}
      canSubmit={!!isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        {notifyError && <Alert severity="warning">{notifyError}</Alert>}

        <TextField
          label="Bus"
          value={form.busId}
          onChange={handleChange("busId")}
          select
          required
          fullWidth
        >
          {buses?.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.plate} — {b.model}
            </MenuItem>
          ))}
        </TextField>

        {/* Turno y conductor — obtenidos automáticamente */}
        {form.busId !== "" && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            {isLoadingShift ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Buscando turno activo...
                </Typography>
              </Box>
            ) : activeShift ? (
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Turno activo detectado automáticamente
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    label={`Turno #${activeShift.id}`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`Conductor: ${activeShift.driverUserId ?? "N/A"}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Stack>
            ) : (
              <Typography variant="caption" color="warning.main">
                No hay turno activo para este bus. El incidente se registrará
                sin turno asociado.
              </Typography>
            )}
          </Box>
        )}

        {/* Ubicación GPS */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          {location ? (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Ubicación GPS capturada automáticamente
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label={`Lat: ${location.lat.toFixed(6)}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`Lng: ${location.lng.toFixed(6)}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
            </Stack>
          ) : (
            <Typography variant="caption" color="warning.main">
              {locationError ?? "Obteniendo ubicación GPS..."}
            </Typography>
          )}
        </Box>

        <TextField
          label="Tipo de incidente"
          value={form.type}
          onChange={handleChange("type")}
          select
          required
          fullWidth
        >
          {INCIDENT_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Nivel de gravedad"
          value={form.severity}
          onChange={handleChange("severity")}
          select
          required
          fullWidth
        >
          {INCIDENT_SEVERITY_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {(form.severity === "high" || form.severity === "critical") && (
          <Alert severity="warning">
            Gravedad {form.severity === "critical" ? "crítica" : "alta"} — se
            notificará automáticamente al supervisor de la empresa por email.
          </Alert>
        )}

        <TextField
          label="Descripción del incidente"
          value={form.description}
          onChange={handleChange("description")}
          multiline
          rows={3}
          fullWidth
          placeholder="Describe brevemente lo ocurrido..."
          inputProps={{ maxLength: 500 }}
        />

        {/* Fotos — hasta 5 en base64 */}
        <Box>
          <Typography variant="subtitle2" mb={1}>
            Fotografías como evidencia (máx. {MAX_PHOTOS})
          </Typography>
          <Stack spacing={1.5}>
            {form.photos.map((photo, index) => (
              <Box key={index}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    sx={{ minWidth: 130 }}
                  >
                    {photo ? `Foto ${index + 1} ✓` : `Subir foto ${index + 1}`}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(index, e)}
                    />
                  </Button>
                  {photo && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      Quitar
                    </Button>
                  )}
                </Box>
                {photo && (
                  <Box
                    component="img"
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    sx={{
                      mt: 0.5,
                      width: "100%",
                      maxHeight: 150,
                      objectFit: "contain",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </FormDialog>
  );
};

export default IncidentFormDialog;