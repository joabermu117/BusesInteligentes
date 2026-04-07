/**
 * Componente Form.tsx - Modal de Formulario para Scopes
 *
 * Este componente proporciona un formulario modal para:
 * - Crear nuevos scopes/permisos
 * - Editar scopes existentes
 * - Asignar categorías a scopes
 * - Marcar scopes como obsoletos (en modo edición)
 *
 * Características principales:
 * - Validación de campos usando Formik y Yup
 * - Soporte para modo creación y edición
 * - Selector de categorías
 * - Manejo de estados de carga
 * - Interfaz responsiva y accesible con Material-UI
 */

import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import FormDialog from "../../common/components/forms/FormDialog";
import type { Scope } from "../../models/Scope";
import { scopeSchema } from "../../schemas/scopeSchema";

/**
 * Props del componente ScopeFormModal
 *
 * @property mode - Modo de operación ('create' | 'edit')
 * @property initialData - Datos iniciales del scope (opcional)
 * @property onCancel - Función para cancelar/cerrar el modal
 * @property onSubmit - Función que se ejecuta al enviar el formulario
 * @property isLoading - Indica si hay una operación en curso
 * @property isOpen - Controla si el modal está abierto o cerrado
 */
interface ScopeFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Scope>;
  onCancel: () => void;
  onSubmit: (values: Partial<Scope>) => Promise<void>;
  isLoading: boolean;
  isOpen: boolean;
}

/**
 * Componente ScopeFormModal
 *
 * Modal de formulario para creación/edición de scopes con:
 * - Campos para nombre y descripción
 * - Selector de categoría
 * - Opción para marcar como obsoleto (en edición)
 * - Validación en tiempo real
 * - Estados de carga
 */
export const ScopeFormModal = ({
  mode,
  initialData = { name: "", description: "" },
  onCancel,
  onSubmit,
  isLoading,
  isOpen,
}: ScopeFormProps) => {
  /**
   * Configuración de Formik para manejo del formulario:
   * - Valores iniciales basados en el modo (creación/edición)
   * - Esquema de validación (scopeSchema)
   * - Manejo de envío con estados de carga
   * - Reinicio de valores cuando cambian las props
   */
  const formik = useFormik({
    initialValues: {
      name: initialData.name || "",
      description: initialData.description || "",
      ...(mode === "edit" && {
        key: initialData.key || "",
        deprecated: initialData.deprecated || false,
      }),
    },
    validationSchema: scopeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  // Textos dinámicos según el modo
  const title = mode === "create" ? "Nuevo Scope" : "Editar Scope";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const handleClose = () => {
    formik.resetForm();
    onCancel();
  };

  return (
    <FormDialog
      open={isOpen}
      title={title}
      onClose={handleClose}
      onSubmit={() => void formik.submitForm()}
      submitLabel={submitText}
      submitting={isLoading || formik.isSubmitting}
      canSubmit={formik.isValid}
      maxWidth="sm"
    >
      <TextField
        fullWidth
        id="name"
        name="name"
        label="Nombre del scope"
        placeholder="Nombre del scope"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.name && Boolean(formik.errors.name)}
        helperText={formik.touched.name && formik.errors.name}
        disabled={isLoading}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        id="description"
        name="description"
        label="Descripcion del scope"
        placeholder="Descripcion del scope"
        multiline
        rows={3}
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.description && Boolean(formik.errors.description)}
        helperText={formik.touched.description && formik.errors.description}
        disabled={isLoading}
        sx={{ mb: mode === "edit" ? 2 : 0 }}
      />

      {mode === "edit" ? (
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                id="deprecated"
                name="deprecated"
                checked={formik.values.deprecated || false}
                onChange={formik.handleChange}
                disabled={isLoading}
                sx={{ color: "#E52320", "&.Mui-checked": { color: "#E52320" } }}
              />
            }
            label={<Typography variant="body2">Marcar como obsoleto</Typography>}
          />
        </Box>
      ) : null}
    </FormDialog>
  );
};
