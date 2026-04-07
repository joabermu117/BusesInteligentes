// schemas/scopeSchema.ts
import * as yup from 'yup';

export const scopeSchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  description: yup
    .string()
    .max(500, 'La descripción no puede exceder los 500 caracteres')
    .required('La descripción es requerida'),
  deprecated: yup
    .boolean()
});