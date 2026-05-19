import { Alert, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useActiveShiftByBus } from "../../boletos/stores/useShiftStore";
import { useBuses } from "../../buses/stores/useBusesStore";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import { useAdminRoutes } from "../../viajes/stores/useAdminRoutesStore";
import type { CreateSchedulePayload, Schedule } from "../models/schedule";
import {
  SCHEDULE_RECURRENCE_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
} from "../models/schedule";
import {
  useCreateSchedule,
  useUpdateSchedule,
} from "../stores/useSchedulesStore";

type ScheduleFormDialogProps = {
  open: boolean;
  schedule: Schedule | null;
  onClose: () => void;
};

const emptyForm: CreateSchedulePayload = {
  busId: 0,
  routeId: 0,
  departureTime: "",
  date: "",
  toleranceMinutes: 5,
  status: "scheduled",
  recurrence: "none",
};

const ScheduleFormDialog = ({
  open,
  schedule,
  onClose,
}: ScheduleFormDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const isEditing = !!schedule;
  const { mutateAsync: createSchedule, isPending: isCreating } =
    useCreateSchedule();
  const { mutateAsync: updateSchedule, isPending: isUpdating } =
    useUpdateSchedule();
  const { data: buses } = useBuses();
  const { data: routes } = useAdminRoutes();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateSchedulePayload>(emptyForm);

  // Validar turno activo del bus seleccionado
  const { data: activeShift } = useActiveShiftByBus(
    form.busId > 0 ? form.busId : 0,
  );

  // Empresa del bus seleccionado
  const selectedBus = buses?.find((b) => b.id === form.busId);

  useEffect(() => {
    if (schedule) {
      setForm({
        busId: schedule.bus?.id ?? 0,
        routeId: schedule.routeId,
        departureTime: schedule.departureTime
          ? schedule.departureTime.slice(0, 16)
          : "",
        date: schedule.date ?? "",
        toleranceMinutes: schedule.toleranceMinutes ?? 5,
        status: schedule.status,
        recurrence: schedule.recurrence,
      });
    } else {
      setForm(emptyForm);
    }
  }, [schedule, open]);

  const handleChange =
    (field: keyof CreateSchedulePayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "busId" ||
        field === "routeId" ||
        field === "toleranceMinutes"
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async () => {
    // Validar que el bus tenga conductor asignado (turno activo)
    if (form.busId > 0 && !activeShift) {
      enqueueSnackbar(
        "El bus seleccionado no tiene un conductor asignado (turno activo). Asigna un turno antes de crear la programación.",
        { variant: "warning" },
      );
      return;
    }

    try {
      const payload: CreateSchedulePayload = {
        ...form,
        date: form.date || undefined,
      };

      if (isEditing && schedule) {
        await updateSchedule({ id: schedule.id, payload });
        enqueueSnackbar("Programación actualizada correctamente.", {
          variant: "success",
        });
      } else {
        await createSchedule(payload);
        enqueueSnackbar("Programación creada correctamente.", {
          variant: "success",
        });
      }
      onClose();
    } catch (e: unknown) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al guardar la programación"),
        { variant: "error", style: { whiteSpace: "pre-line" } },
      );
    }
  };

  const isFormValid =
    form.busId > 0 && form.routeId > 0 && form.departureTime.length > 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar programación" : "Crear programación de ruta"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Crear programación"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
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
              {b.plate} — {b.model}{" "}
              {b.company ? `(${b.company.nombre})` : ""}
            </MenuItem>
          ))}
        </TextField>

        {/* Mostrar empresa y validación de turno automáticamente */}
        {form.busId > 0 && (
          <Stack spacing={0.5}>
            {selectedBus?.company && (
              <Typography variant="caption" color="text.secondary">
                Empresa: <strong>{selectedBus.company.nombre}</strong>
              </Typography>
            )}
            {activeShift ? (
              <Alert severity="success" sx={{ py: 0.5 }}>
                Conductor asignado — Turno #{activeShift.id} activo
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                Este bus no tiene un conductor asignado (turno activo).
              </Alert>
            )}
          </Stack>
        )}

        <TextField
          label="Ruta"
          value={form.routeId || ""}
          onChange={handleChange("routeId")}
          select
          required
          fullWidth
        >
          {routes?.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name} — {r.origin} → {r.destination}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Fecha y hora de salida"
          type="datetime-local"
          value={form.departureTime}
          onChange={handleChange("departureTime")}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Fecha específica (opcional)"
          type="date"
          value={form.date}
          onChange={handleChange("date")}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="Déjalo vacío si es recurrente"
        />

        <TextField
          label="Margen de tolerancia (minutos)"
          type="number"
          value={form.toleranceMinutes ?? ""}
          onChange={handleChange("toleranceMinutes")}
          fullWidth
          inputProps={{ min: 0, max: 60 }}
          helperText="Ej: 5 minutos de tolerancia en la salida"
        />

        <TextField
          label="Recurrencia"
          value={form.recurrence}
          onChange={handleChange("recurrence")}
          select
          fullWidth
        >
          {SCHEDULE_RECURRENCE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Estado inicial"
          value={form.status}
          onChange={handleChange("status")}
          select
          fullWidth
        >
          {SCHEDULE_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FormDialog>
  );
};

export default ScheduleFormDialog;