import { MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { Incident, UpdateIncidentPayload } from "../models/incident";
import {
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_TYPE_OPTIONS,
} from "../models/incident";
import { useUpdateIncident } from "../stores/useIncidentsStore";

type UpdateIncidentDialogProps = {
  open: boolean;
  incident: Incident;
  onClose: () => void;
};

const UpdateIncidentDialog = ({
  open,
  incident,
  onClose,
}: UpdateIncidentDialogProps) => {
  const { mutateAsync: updateIncident, isPending } = useUpdateIncident();
  const [form, setForm] = useState<UpdateIncidentPayload>({});

  useEffect(() => {
    if (incident) {
      setForm({
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        status: incident.status,
        supervisorComment: incident.supervisorComment,
      });
    }
  }, [incident, open]);

  const handleChange =
    (field: keyof UpdateIncidentPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async () => {
    await updateIncident({ id: incident.id, payload: form });
    onClose();
  };

  return (
    <FormDialog
      open={open}
      title="Actualizar incidente"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Guardar cambios"
      submitting={isPending}
      canSubmit={!isPending}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Tipo de incidente"
          value={form.type ?? ""}
          onChange={handleChange("type")}
          select
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
          value={form.severity ?? ""}
          onChange={handleChange("severity")}
          select
          fullWidth
        >
          {INCIDENT_SEVERITY_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Estado"
          value={form.status ?? ""}
          onChange={handleChange("status")}
          select
          fullWidth
        >
          {INCIDENT_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Descripción"
          value={form.description ?? ""}
          onChange={handleChange("description")}
          multiline
          rows={3}
          fullWidth
        />

        <TextField
          label="Comentario del supervisor"
          value={form.supervisorComment ?? ""}
          onChange={handleChange("supervisorComment")}
          multiline
          rows={2}
          fullWidth
        />
      </Stack>
    </FormDialog>
  );
};

export default UpdateIncidentDialog;