/**
 * Componente Form.tsx - Formulario de Categorías
 *
 * Este componente proporciona un formulario modal para:
 * - Crear nuevas categorías de scopes/permisos
 * - Editar categorías existentes
 * - Validar los datos de categorías según el esquema definido
 *
 * Características principales:
 * - Validación de campos usando Formik y Yup
 * - Soporte para modo creación y edición
 * - Manejo de estados de carga
 * - Interfaz responsiva y accesible con Material-UI
 * - Feedback visual para errores de validación
 */

import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import type { ScopeCategory } from "../../models/ScopeCategory";
import { categorySchema } from "../../schemas/scopeCategorySchema";

/**
 * Props del componente CategoryFormModal
 *
 * @property mode - Modo de operación ('create' | 'edit')
 * @property initialData - Datos iniciales de la categoría (opcional)
 * @property onCancel - Función para cancelar/cerrar el modal
 * @property onSubmit - Función que se ejecuta al enviar el formulario
 * @property isLoading - Indica si hay una operación en curso
 * @property isOpen - Controla si el modal está abierto o cerrado
 */
interface CategoryFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ScopeCategory>;
  onCancel: () => void;
  onSubmit: (
    values: Omit<ScopeCategory, "id"> | ScopeCategory,
  ) => Promise<void>;
  isLoading: boolean;
  isOpen: boolean;
}

/**
 * Componente CategoryFormModal
 *
 * Modal de formulario para creación/edición de categorías con:
 * - Campos para nombre y descripción
 * - Validación en tiempo real
 * - Estados de carga
 * - Manejo de envío y cancelación
 */
export const CategoryFormModal = ({
  mode,
  initialData = { name: "", description: "" },
  onCancel,
  onSubmit,
  isLoading,
  isOpen,
}: CategoryFormProps) => {
  /**
   * Configuración de Formik para manejo del formulario:
   * - Valores iniciales basados en el modo (creación/edición)
   * - Esquema de validación (categorySchema)
   * - Manejo de envío con estados de carga
   * - Reinicio de valores cuando cambian las props
   */
  const formik = useFormik({
    initialValues: {
      name: initialData.name || "",
      description: initialData.description || "",
      ...(mode === "edit" && { id: initialData.id }),
    },
    validationSchema: categorySchema,
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
  const title = mode === "create" ? "Nueva Categoría" : "Editar Categoría";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const handleClose = () => {
    formik.resetForm();
    onCancel();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="category-form-title"
    >
      {/* Header del modal */}
      <DialogTitle id="category-form-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              color: "#E52320",
              "&:hover": { backgroundColor: "#fce4e4" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Formulario principal */}
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Campo de nombre */}
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Nombre categoría"
              placeholder="Nombre categoría"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={isLoading}
              sx={{ mb: 3 }}
              InputLabelProps={{
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              }}
              InputProps={{
                sx: {
                  fontSize: "0.875rem",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#E52320",
                  },
                },
              }}
            />

            {/* Campo de descripción */}
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Descripción categoría"
              placeholder="Descripción categoría"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
              disabled={isLoading}
              InputLabelProps={{
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              }}
              InputProps={{
                sx: {
                  fontSize: "0.875rem",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#E52320",
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        {/* Botones de acción */}
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              color: "#E52320",
              borderColor: "#E52320",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#fce4e4",
                borderColor: "#C71A17",
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || formik.isSubmitting || !formik.isValid}
            sx={{
              backgroundColor: "#E52320",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#c21e1b",
                boxShadow: "none",
              },
              "&:disabled": {
                backgroundColor: "#ccc",
              },
            }}
            variant="contained"
            startIcon={
              isLoading || formik.isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isLoading || formik.isSubmitting ? "Procesando..." : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
