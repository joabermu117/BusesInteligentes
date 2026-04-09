import * as yup from "yup";

export const userSchema = yup.object({
  name: yup
    .string()
    .required("El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  email: yup
    .string()
    .required("El email es requerido")
    .email("Ingrese un email valido"),
  roleIds: yup.array().of(yup.string().required()).default([]),
  password: yup
    .string()
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .min(8, "La contrasena debe tener al menos 8 caracteres"),
});
