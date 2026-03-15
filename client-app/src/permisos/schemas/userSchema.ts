// schemas/userSchema.ts
import * as yup from 'yup';

export const userSchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  email: yup
    .string()
    .required('El email es requerido')
    .email('Ingrese un email válido'),
  roles: yup
    .array()
    .of(yup.string().required()),
  customScopes: yup
    .array()
    .of(yup.string().required())
});