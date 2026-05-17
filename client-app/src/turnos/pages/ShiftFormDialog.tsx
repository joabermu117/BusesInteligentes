import PersonRounded from "@mui/icons-material/PersonRounded";
import { Alert, Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useBuses } from "../../buses/stores/useBusesStore";
import { useDrivers } from "../../drivers/stores/useDriversStore";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { Shift } from "../../boletos/models/boletos";
import type {
  CreateShiftPayload,
  UpdateShiftPayload,
} from "../services/adminShiftsService";
import {
  useCreateShift,
  useUpdateShift,
} from "../stores/useAdminShiftsStore";

const SHIFT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Programado" },
  { value: "in_progress", label: "En curso" },
  { value: "finished", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

type ShiftFormDialogProps = {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
};

const emptyForm: CreateShiftPayload = {
  driverUserId: "",
  busId: 0,
  startTime: "",
};

const ShiftFormDialog = ({ open, shift, onClose }: ShiftFormDialogProps) => {
  const isEditing = !!shift;
  const { mutateAsync: createShift, isPending: isCreating } = useCreateShift();
  const { mutateAsync: updateShift, isPending: isUpdating } = useUpdateShift();
  const { data: buses } = useBuses();
  const { data: drivers } = useDrivers();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateShiftPayload>(emptyForm);
  const [status, setStatus] = useState("scheduled");
  const [manualId, setManualId] = useState(false);

  useEffect(() => {
    if (shift) {
      setForm({
        driverUserId: shift.driverUserId ?? "",
        busId: shift.bus?.id ?? 0,
        startTime: shift.startTime
          ? new Date(shift.startTime).toISOString().slice(0, 16)
          : "",
        endTime: shift.endTime
          ? new Date(shift.endTime).toISOString().slice(0, 16)
          : undefined,
        observations: shift.observations ?? undefined,
      });
      setStatus(shift.status);
      setManualId(false);
    } else {
      setForm(emptyForm);
      setStatus("scheduled");
      setManualId(false);
    }
  }, [shift, open]);

  const handleChange =
    (field: keyof CreateShiftPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "busId" ? Number(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async () => {
    if (isEditing && shift) {
      const payload: UpdateShiftPayload = {
        ...form,
        status,
      };
      await updateShift({ id: shift.id!, payload });
    } else {
      await createShift(form);
    }
    onClose();
  };

  const isFormValid = form.driverUserId.length > 0 && form.busId > 0 && form.startTime.length > 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar turno" : "Asignar nuevo turno"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Asignar turno"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        {/* Selector de conductor */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Conductor
          </Typography>

          {drivers && drivers.length > 0 ? (
            <TextField
              value={form.driverUserId}
              onChange={handleChange("driverUserId")}
              select
              required
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            >
              {drivers
                .filter((d) => d.isActive !== false)
                .map((d) => (
                  <MenuItem key={d.person_id} value={d.person_id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonRounded sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {d.person_id.slice(0, 8)}...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.licenseNumber ? `Lic. ${d.licenseNumber}` : "Sin licencia"}
                          {d.status ? ` · ${d.status}` : ""}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
            </TextField>
          ) : (
            <Alert severity="info" sx={{ mb: 1 }}>
              No hay conductores registrados. Puedes escribir el ID manualmente.
            </Alert>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label={manualId ? "ID del conductor" : "O escribir ID manualmente"}
              value={manualId ? form.driverUserId : ""}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, driverUserId: e.target.value }));
                setManualId(true);
              }}
              size="small"
              fullWidth
              placeholder="Ej: 60f7c5b2e4b0a12d..."
              disabled={!manualId && (drivers?.length ?? 0) > 0}
            />
            {!manualId && (drivers?.length ?? 0) > 0 && (
              <Chip
                label="ID manual"
                size="small"
                variant="outlined"
                onClick={() => {
                  setManualId(true);
                  setForm((prev) => ({ ...prev, driverUserId: "" }));
                }}
                sx={{ flexShrink: 0, cursor: "pointer" }}
              />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            El ID del conductor es el identificador del usuario en el sistema de seguridad (ms-security).
            Primero se debe registrar al conductor en <strong>Seguridad → Usuarios</strong> y luego asignarle el rol de conductor.
          </Typography>
        </Box>

        {/* Selector de bus */}
        <TextField
          label="Bus"
          value={form.busId || ""}
          onChange={handleChange("busId")}
          select
          required
          fullWidth
        >
          {buses?.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: b.status === "operative" ? "success.main" : "warning.main",
                    display: "inline-block",
                  }}
                />
                <Typography variant="body2">
                  {b.plate} — {b.model}
                </Typography>
                {b.company && (
                  <Chip label={b.company.name} size="small" variant="outlined" />
                )}
              </Stack>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Fecha y hora de inicio"
          type="datetime-local"
          value={form.startTime}
          onChange={handleChange("startTime")}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Fecha y hora de fin (opcional)"
          type="datetime-local"
          value={form.endTime ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, endTime: e.target.value || undefined }))
          }
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Observaciones"
          value={form.observations ?? ""}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              observations: e.target.value || undefined,
            }))
          }
          fullWidth
          multiline
          rows={2}
          placeholder="Notas adicionales sobre el turno"
        />

        {isEditing && (
          <TextField
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            select
            fullWidth
          >
            {SHIFT_STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
    </FormDialog>
  );
};

export default ShiftFormDialog;
