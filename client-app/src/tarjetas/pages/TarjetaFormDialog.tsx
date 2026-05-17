import { MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { getAuthUserId } from "../../config/httpClient";
import { usePaymentMethods } from "../../payment-methods/stores/usePaymentMethodsStore";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { CreateTarjetaPayload, Tarjeta } from "../models/tarjeta";
import { useCreateTarjeta, useUpdateTarjeta } from "../stores/useTarjetasStore";

type Props = {
  open: boolean;
  tarjeta: Tarjeta | null;
  onClose: () => void;
};

const emptyForm = (): CreateTarjetaPayload => ({
  citizenId: "",
  paymentMethodId: 0,
  cardNumber: "",
  cardHolder: "",
  expirationDate: undefined,
  isDefault: false,
});

const TarjetaFormDialog = ({ open, tarjeta, onClose }: Props) => {
  const isEditing = !!tarjeta;
  const { mutateAsync: createTarjeta, isPending: isCreating } =
    useCreateTarjeta();
  const { mutateAsync: updateTarjeta, isPending: isUpdating } =
    useUpdateTarjeta();
  const { data: paymentMethods } = usePaymentMethods();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateTarjetaPayload>(emptyForm());

  const currentUserId = getAuthUserId();

  useEffect(() => {
    const userId = currentUserId || "";
    if (tarjeta) {
      setForm({
        citizenId: userId,
        paymentMethodId: tarjeta.paymentMethod?.id ?? 0,
        cardNumber: tarjeta.cardNumber ?? "",
        cardHolder: tarjeta.cardHolder ?? "",
        expirationDate: tarjeta.expirationDate ?? undefined,
        isDefault: tarjeta.isDefault,
      });
    } else {
      setForm({ ...emptyForm(), citizenId: userId });
    }
  }, [tarjeta, open, currentUserId]);

  const handleChange =
    (field: keyof CreateTarjetaPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "paymentMethodId" || field === "isDefault"
          ? field === "isDefault"
            ? e.target.value === "true"
            : Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async () => {
    if (isEditing && tarjeta) {
      await updateTarjeta({ id: tarjeta.id, payload: form });
    } else {
      await createTarjeta(form);
    }
    onClose();
  };

  const isFormValid =
    form.paymentMethodId > 0 && (form.cardNumber ?? "").trim().length > 0;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar tarjeta" : "Vincular tarjeta"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Vincular"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Método de pago"
          value={form.paymentMethodId}
          onChange={handleChange("paymentMethodId")}
          select
          required
          fullWidth
        >
          {paymentMethods?.map((pm) => (
            <MenuItem key={pm.id} value={pm.id}>
              {pm.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Número de tarjeta"
          value={form.cardNumber}
          onChange={handleChange("cardNumber")}
          required
          fullWidth
          placeholder="**** **** **** 1234"
        />

        <TextField
          label="Titular"
          value={form.cardHolder}
          onChange={handleChange("cardHolder")}
          fullWidth
          placeholder="Nombre del titular"
        />

        <TextField
          label="Fecha de vencimiento"
          type="date"
          value={form.expirationDate ?? ""}
          onChange={handleChange("expirationDate")}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Stack>
    </FormDialog>
  );
};

export default TarjetaFormDialog;
