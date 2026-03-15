// schemas/roleSchema.ts
import * as yup from "yup";

export const roleSchema = yup.object().shape({
  name: yup
    .string()
    .required("El nombre del rol es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede exceder los 50 caracteres"),
  description: yup
    .string()
    .required("La descripción es requerida")
    .max(500, "La descripción no puede exceder los 500 caracteres"),
  scopes: yup
    .array()
    .of(yup.string().required())
    .min(1, "Debe seleccionar al menos un permiso"),
});
