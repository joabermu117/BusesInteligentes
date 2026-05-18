import { Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type {
  CreatePaymentMethodPayload,
  PaymentMethod,
} from "../models/paymentMethod";
import {
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
} from "../stores/usePaymentMethodsStore";

type Props = {
  open: boolean;
  method: PaymentMethod | null;
  onClose: () => void;
};

const emptyForm: CreatePaymentMethodPayload = {
  name: "",
  description: "",
  isActive: true,
};

const PaymentMethodFormDialog = ({ open, method, onClose }: Props) => {
  const isEditing = !!method;
  const { mutateAsync: createMethod, isPending: isCreating } =
    useCreatePaymentMethod();
  const { mutateAsync: updateMethod, isPending: isUpdating } =
    useUpdatePaymentMethod();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreatePaymentMethodPayload>(emptyForm);

  useEffect(() => {
    if (method) {
      setForm({
        name: method.name,
        description: method.description ?? "",
        isActive: method.isActive ?? true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [method, open]);

  const handleChange =
    (field: keyof CreatePaymentMethodPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "isActive" ? e.target.value === "true" : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async () => {
    if (isEditing && method) {
      await updateMethod({ id: method.id, payload: form });
    } else {
      await createMethod(form);
    }
    onClose();
  };

  const isFormValid = form.name.trim().length > 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar método de pago" : "Agregar método de pago"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Agregar"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Nombre"
          value={form.name}
          onChange={handleChange("name")}
          required
          fullWidth
          placeholder="Ej: Tarjeta de crédito, PSE, Efectivo"
          inputProps={{ maxLength: 100 }}
        />
        <TextField
          label="Descripción (opcional)"
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
          multiline
          rows={2}
          placeholder="Descripción del método de pago"
        />
      </Stack>
    </FormDialog>
  );
};

export default PaymentMethodFormDialog;
