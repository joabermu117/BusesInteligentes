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

import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import type { Scope } from "../../models/Scope";
import type { ScopeCategory } from "../../models/ScopeCategory";
import { scopeSchema } from "../../schemas/scopeSchema";

/**
 * Props del componente ScopeFormModal
 *
 * @property mode - Modo de operación ('create' | 'edit')
 * @property initialData - Datos iniciales del scope (opcional)
 * @property categories - Lista de categorías disponibles
 * @property onCancel - Función para cancelar/cerrar el modal
 * @property onSubmit - Función que se ejecuta al enviar el formulario
 * @property isLoading - Indica si hay una operación en curso
 * @property isOpen - Controla si el modal está abierto o cerrado
 */
interface ScopeFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Scope>;
  categories: ScopeCategory[];
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
  initialData = { name: "", description: "", categoryId: "" },
  categories,
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
      categoryId: initialData.categoryId || "",
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
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="scope-form-title"
    >
      {/* Header del modal */}
      <DialogTitle id="scope-form-title">
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
              label="Nombre del scope"
              placeholder="Nombre del scope"
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
              label="Descripción del scope"
              placeholder="Descripción del scope"
              multiline
              rows={3}
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

            {/* Selector de categoría */}
            <TextField
              fullWidth
              select
              id="categoryId"
              name="categoryId"
              label="Categoría"
              value={formik.values.categoryId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.categoryId && Boolean(formik.errors.categoryId)
              }
              helperText={formik.touched.categoryId && formik.errors.categoryId}
              disabled={isLoading}
              sx={{ mb: mode === "edit" ? 2 : 0 }}
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
            >
              <MenuItem value="">
                <em>Seleccione una categoría</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Checkbox para obsoleto (solo en edición) */}
            {mode === "edit" && (
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="deprecated"
                      name="deprecated"
                      checked={formik.values.deprecated || false}
                      onChange={formik.handleChange}
                      disabled={isLoading}
                      sx={{
                        color: "#E52320",
                        "&.Mui-checked": {
                          color: "#E52320",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      Marcar como obsoleto
                    </Typography>
                  }
                />
              </Box>
            )}
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
