import { MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useCompanies } from "../../companies/stores/useCompaniesStore";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { Bus, CreateBusPayload } from "../models/bus";
import { BUS_STATUS_OPTIONS } from "../models/bus";
import { useCreateBus, useUpdateBus } from "../stores/useBusesStore";

type BusFormDialogProps = {
  open: boolean;
  bus: Bus | null;
  onClose: () => void;
};

const emptyForm: CreateBusPayload = {
  plate: "",
  model: "",
  year: new Date().getFullYear(),
  totalCapacity: 0,
  seatedCapacity: undefined,
  standingCapacity: undefined,
  photoUrl: undefined,
  status: "operative",
  companyId: 1,
};

const BusFormDialog = ({ open, bus, onClose }: BusFormDialogProps) => {
  const isEditing = !!bus;
  const { mutateAsync: createBus, isPending: isCreating } = useCreateBus();
  const { mutateAsync: updateBus, isPending: isUpdating } = useUpdateBus();
  const { data: companies } = useCompanies();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateBusPayload>(emptyForm);

  useEffect(() => {
    if (bus) {
      setForm({
        plate: bus.plate,
        model: bus.model,
        year: bus.year,
        totalCapacity: bus.totalCapacity,
        seatedCapacity: bus.seatedCapacity,
        standingCapacity: bus.standingCapacity,
        photoUrl: bus.photoUrl,
        status: bus.status,
        companyId: bus.company?.id ?? 1,
      });
    } else {
      setForm(emptyForm);
    }
  }, [bus, open]);

  const handleChange =
    (field: keyof CreateBusPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "year" ||
        field === "totalCapacity" ||
        field === "seatedCapacity" ||
        field === "standingCapacity" ||
        field === "companyId"
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async () => {
    if (isEditing && bus) {
      await updateBus({ id: bus.id, payload: form });
    } else {
      await createBus(form);
    }
    onClose();
  };

  const isFormValid =
    form.plate.trim().length >= 3 &&
    form.model.trim().length >= 2 &&
    form.totalCapacity > 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar bus" : "Registrar nuevo bus"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Registrar bus"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Placa"
          value={form.plate}
          onChange={handleChange("plate")}
          required
          fullWidth
          placeholder="ABC-123"
          inputProps={{ maxLength: 20 }}
        />

        <TextField
          label="Modelo"
          value={form.model}
          onChange={handleChange("model")}
          required
          fullWidth
          placeholder="Mercedes-Benz Sprinter"
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          label="Año"
          type="number"
          value={form.year}
          onChange={handleChange("year")}
          required
          fullWidth
          inputProps={{ min: 1990, max: 2030 }}
        />

        <TextField
          label="Capacidad máxima de pasajeros"
          type="number"
          value={form.totalCapacity}
          onChange={handleChange("totalCapacity")}
          required
          fullWidth
          inputProps={{ min: 1, max: 200 }}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Capacidad sentados"
            type="number"
            value={form.seatedCapacity ?? ""}
            onChange={handleChange("seatedCapacity")}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Capacidad parados"
            type="number"
            value={form.standingCapacity ?? ""}
            onChange={handleChange("standingCapacity")}
            fullWidth
            inputProps={{ min: 0 }}
          />
        </Stack>

        <TextField
          label="Estado inicial"
          value={form.status}
          onChange={handleChange("status")}
          select
          fullWidth
        >
          {BUS_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Empresa"
          value={form.companyId}
          onChange={handleChange("companyId")}
          select
          required
          fullWidth
        >
          {companies?.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name} ({c.nit})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="URL de foto (opcional)"
          value={form.photoUrl ?? ""}
          onChange={handleChange("photoUrl")}
          fullWidth
          placeholder="https://ejemplo.com/foto-bus.jpg"
        />
      </Stack>
    </FormDialog>
  );
};

export default BusFormDialog;
