import * as yup from "yup";

export const scopeSchema = yup.object().shape({
  url: yup
    .string()
    .required("La URL es requerida")
    .min(2, "La URL debe tener al menos 2 caracteres")
    .max(200, "La URL no puede exceder los 200 caracteres"),
  method: yup
    .string()
    .required("El metodo es requerido")
    .oneOf(["GET", "POST", "PUT", "PATCH", "DELETE"], "Metodo no valido"),
  model: yup
    .string()
    .required("El modelo es requerido")
    .min(2, "El modelo debe tener al menos 2 caracteres")
    .max(100, "El modelo no puede exceder los 100 caracteres"),
});
