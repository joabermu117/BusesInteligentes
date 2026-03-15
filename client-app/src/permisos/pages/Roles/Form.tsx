/**
 * Componente Form.tsx - Formulario de Roles
 *
 * Este componente proporciona un formulario modal para:
 * - Crear nuevos roles
 * - Editar roles existentes
 * - Asignar permisos (scopes) a roles
 * - Validar los datos del rol según el esquema definido
 *
 * Características principales:
 * - Validación de campos usando Formik y Yup
 * - Selección múltiple de permisos
 * - Opciones para seleccionar/deseleccionar todos los permisos
 * - Manejo de estados de carga y validación
 * - Interfaz responsiva
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
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import type { Role } from "../../models/Role";
import type { Scope } from "../../models/Scope";
import { roleSchema } from "../../schemas/roleSchema";

/**
 * Props del componente RoleFormModal
 *
 * @property mode - Modo de operación ('create' | 'edit')
 * @property role - Datos del rol para edición (opcional en modo creación)
 * @property availableScopes - Lista de scopes/permisos disponibles para asignar
 * @property onSubmit - Función que se ejecuta al enviar el formulario
 * @property onCancel - Función para cancelar/cerrar el modal
 * @property isOpen - Controla si el modal está abierto o cerrado
 */
interface RoleFormProps {
  mode: "create" | "edit";
  role?: Role;
  availableScopes: Scope[];
  onSubmit: (roleData: Omit<Role, "key"> | Role) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

/**
 * Componente RoleFormModal
 *
 * Modal de formulario para creación/edición de roles con:
 * - Campos para nombre y descripción
 * - Selector múltiple de permisos (scopes)
 * - Buscador funcional de permisos
 * - Validación en tiempo real
 * - Manejo de estados de carga
 */
const RoleFormModal = ({
  mode,
  role,
  availableScopes,
  onSubmit,
  onCancel,
  isOpen,
}: RoleFormProps) => {
  // Estado para el filtro de búsqueda de permisos
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Configuración de Formik para manejo del formulario:
   * - Valores iniciales basados en el modo (creación/edición)
   * - Esquema de validación (roleSchema)
   * - Manejo de envío con estados de carga
   * - Reinicio de valores cuando cambian las props
   */
  const formik = useFormik({
    initialValues: {
      name: role?.name || "",
      description: role?.description || "",
      scopes: role?.scopes || ([] as string[]),
      ...(mode === "edit" && role ? { key: role.key } : {}),
    },
    validationSchema: roleSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  /**
   * Efecto para actualizar valores del formulario cuando cambia el rol en modo edición
   */
  useEffect(() => {
    if (mode === "edit" && role) {
      formik.setValues({
        name: role.name,
        description: role.description,
        scopes: [...role.scopes],
        key: role.key,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, mode]);

  /**
   * Maneja la selección/deselección de un scope individual
   * @param scopeKey - Key del scope a togglear
   */
  const handleScopeToggle = (scopeKey: string) => {
    const newScopes = formik.values.scopes.includes(scopeKey)
      ? formik.values.scopes.filter((key) => key !== scopeKey)
      : [...formik.values.scopes, scopeKey];
    formik.setFieldValue("scopes", newScopes);
  };

  /**
   * Maneja la selección/deselección de todos los scopes filtrados
   * @param selectAll - Indica si se deben seleccionar todos (true) o ninguno (false)
   */
  const toggleAllScopes = (selectAll: boolean) => {
    if (selectAll) {
      // Agregar solo los scopes filtrados no deprecated que no estén ya seleccionados
      const filteredScopeKeys = filteredScopes
        .filter((s) => !s.deprecated)
        .map((s) => s.key);
      const newScopes = [
        ...new Set([...formik.values.scopes, ...filteredScopeKeys]),
      ];
      formik.setFieldValue("scopes", newScopes);
    } else {
      // Remover solo los scopes que están en el filtro actual
      const filteredScopeKeys = filteredScopes.map((s) => s.key);
      const newScopes = formik.values.scopes.filter(
        (key) => !filteredScopeKeys.includes(key),
      );
      formik.setFieldValue("scopes", newScopes);
    }
  };

  /**
   * Filtra los scopes basado en el término de búsqueda
   */
  const filteredScopes = availableScopes.filter(
    (scope) =>
      scope.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scope.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Textos dinámicos según el modo
  const title = mode === "create" ? "Nuevo Rol" : "Editar Rol";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const handleClose = () => {
    formik.resetForm();
    setSearchTerm("");
    onCancel();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="role-form-title"
    >
      {/* Header del modal */}
      <DialogTitle id="role-form-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={formik.isSubmitting}
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
              label="Nombre del rol"
              placeholder="Nombre del rol"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={formik.isSubmitting}
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
              label="Descripción del rol"
              placeholder="Descripción del rol"
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
              disabled={formik.isSubmitting}
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

            {/* Sección de permisos */}
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                >
                  Permisos asignados *
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    type="button"
                    onClick={() => toggleAllScopes(true)}
                    size="small"
                    disabled={
                      filteredScopes.filter((s) => !s.deprecated).length === 0
                    }
                    sx={{
                      color: "#E52320",
                      textDecoration: "underline",
                      textTransform: "none",
                      minWidth: "auto",
                      padding: "2px 4px",
                      fontSize: "0.75rem",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {searchTerm ? "Seleccionar filtrados" : "Seleccionar todos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => toggleAllScopes(false)}
                    size="small"
                    disabled={
                      filteredScopes.length === 0 ||
                      formik.values.scopes.filter((key) =>
                        filteredScopes.map((s) => s.key).includes(key),
                      ).length === 0
                    }
                    sx={{
                      color: "#E52320",
                      textDecoration: "underline",
                      textTransform: "none",
                      minWidth: "auto",
                      padding: "2px 4px",
                      fontSize: "0.75rem",
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {searchTerm ? "Desmarcar filtrados" : "Desmarcar todos"}
                  </Button>
                </Box>
              </Box>

              {/* Buscador de permisos */}
              <TextField
                fullWidth
                placeholder="Buscar permisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                  sx: {
                    fontSize: "0.875rem",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#E52320",
                    },
                  },
                }}
              />

              {/* Lista de permisos seleccionables */}
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 300,
                  overflowY: "auto",
                  backgroundColor: "#fafafa",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 1,
                  }}
                >
                  {filteredScopes.length > 0 ? (
                    filteredScopes.map((scope) => (
                      <FormControlLabel
                        key={scope.key}
                        control={
                          <Checkbox
                            checked={formik.values.scopes.includes(scope.key)}
                            onChange={() => handleScopeToggle(scope.key)}
                            size="small"
                            sx={{
                              color: "#E52320",
                              "&.Mui-checked": {
                                color: "#E52320",
                              },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "0.875rem" }}
                            >
                              {scope.name}
                              {scope.deprecated && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: "text.secondary" }}
                                >
                                  (obsoleto)
                                </Typography>
                              )}
                            </Typography>
                            {scope.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {scope.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ alignItems: "flex-start", m: 0 }}
                      />
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ gridColumn: "1 / -1", textAlign: "center", py: 2 }}
                    >
                      No se encontraron permisos con el término de búsqueda
                    </Typography>
                  )}
                </Box>
                {formik.touched.scopes && formik.errors.scopes && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {formik.errors.scopes}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* Botones de acción */}
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={formik.isSubmitting}
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
            disabled={formik.isSubmitting || !formik.isValid}
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
              formik.isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {formik.isSubmitting ? "Procesando..." : submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RoleFormModal;
