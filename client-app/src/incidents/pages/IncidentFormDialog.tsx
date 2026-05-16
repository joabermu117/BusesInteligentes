import { MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
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
} from "../stores/useIncidentsStore";

type IncidentFormDialogProps = {
  open: boolean;
  onClose: () => void;
};

const emptyForm: CreateIncidentPayload & { busId: number | "" } = {
  type: "mechanical",
  severity: "low",
  description: "",
  busId: "",
};

const IncidentFormDialog = ({ open, onClose }: IncidentFormDialogProps) => {
  const { mutateAsync: createIncident, isPending: isCreatingIncident } =
    useCreateIncident();
  const { mutateAsync: createIncidentBus, isPending: isCreatingLink } =
    useCreateIncidentBus();
  const { data: buses } = useBuses();
  const isSubmitting = isCreatingIncident || isCreatingLink;

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: field === "busId" ? Number(e.target.value) : e.target.value,
      }));
    };

  const handleSubmit = async () => {
    // 1. Crear el incidente
    const incident = await createIncident({
      type: form.type,
      severity: form.severity,
      description: form.description,
    });

    // 2. Vincular con el bus
    await createIncidentBus({
      busId: Number(form.busId),
      incidentId: incident.id,
    });

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
      </Stack>
    </FormDialog>
  );
};

export default IncidentFormDialog;