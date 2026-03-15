/**
 * Componente Form.tsx - Formulario de Usuario
 *
 * Este componente proporciona un formulario modal para:
 * - Crear nuevos usuarios
 * - Editar usuarios existentes
 * - Asignar roles y scopes adicionales
 * - Validar los datos del usuario según el esquema definido
 *
 * Características principales:
 * - Validación de campos usando Formik y Yup
 * - Búsqueda y selección de roles
 * - Búsqueda y selección de scopes adicionales
 * - Manejo de estados de carga y validación
 * - Interfaz responsiva con Material-UI
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
import { useState } from "react";
import type { Role } from "../../models/Role";
import type { Scope } from "../../models/Scope";
import type { User } from "../../models/user";
import { userSchema } from "../../schemas/userSchema";

/**
 * Props del componente UserFormModal
 *
 * @property mode - Modo de operación ('create' | 'edit')
 * @property user - Datos del usuario para edición (opcional en modo creación)
 * @property availableRoles - Lista de roles disponibles para asignar
 * @property availableScopes - Lista de scopes disponibles para asignar
 * @property onSubmit - Función que se ejecuta al enviar el formulario
 * @property onCancel - Función para cancelar/cerrar el modal
 * @property isOpen - Controla si el modal está abierto o cerrado
 */
interface UserFormProps {
  mode: "create" | "edit";
  user?: User;
  availableRoles: Role[];
  availableScopes: Scope[];
  onSubmit: (userData: Omit<User, "uid"> | User) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

/**
 * Componente UserFormModal
 *
 * Modal de formulario para creación/edición de usuarios con:
 * - Campos básicos (nombre, email)
 * - Selección de roles con búsqueda
 * - Selección de scopes adicionales con búsqueda
 * - Validación en tiempo real
 * - Estilo Material-UI consistente
 */
const UserFormModal = ({
  mode,
  user,
  availableRoles,
  availableScopes,
  onSubmit,
  onCancel,
  isOpen,
}: UserFormProps) => {
  // Estados para búsqueda de roles y scopes
  const [roleSearch, setRoleSearch] = useState("");
  const [scopeSearch, setScopeSearch] = useState("");

  /**
   * Configuración de Formik para manejo del formulario
   * - Valores iniciales basados en el modo (creación/edición)
   * - Esquema de validación (userSchema)
   * - Manejo de envío con estados de carga
   */
  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      roles: user?.roles || ([] as string[]),
      customScopes: user?.customScopes || ([] as string[]),
      ...(mode === "edit" && user ? { uid: user.uid } : {}),
    },
    validationSchema: userSchema,
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
   * Filtra roles basados en el término de búsqueda
   * Busca coincidencias en nombre o key del rol
   */
  const filteredRoles = availableRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      role.key.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  /**
   * Filtra scopes basados en el término de búsqueda
   * Busca coincidencias en nombre o key del scope
   * Excluye scopes marcados como deprecated
   */
  const filteredScopes = availableScopes.filter(
    (scope) =>
      (scope.name.toLowerCase().includes(scopeSearch.toLowerCase()) ||
        scope.key.toLowerCase().includes(scopeSearch.toLowerCase())) &&
      !scope.deprecated,
  );

  /**
   * Obtiene todos los scopes de los roles seleccionados
   * @returns Array de keys de scopes
   */
  const getScopesFromSelectedRoles = (): string[] => {
    return formik.values.roles.flatMap((roleKey) => {
      const role = availableRoles.find((r) => r.key === roleKey);
      return role ? role.scopes : [];
    });
  };

  /**
   * Verifica si un scope está incluido en los roles seleccionados
   * @param scopeKey - Key del scope a verificar
   * @returns Booleano indicando si está incluido
   */
  const isScopeInSelectedRoles = (scopeKey: string): boolean => {
    const roleScopes = getScopesFromSelectedRoles();
    return roleScopes.includes(scopeKey);
  };

  /**
   * Maneja la selección/deselección de roles
   * @param roleKey - Key del rol a togglear
   */
  const handleRoleToggle = (roleKey: string) => {
    const newRoles = formik.values.roles.includes(roleKey)
      ? formik.values.roles.filter((key) => key !== roleKey)
      : [...formik.values.roles, roleKey];
    formik.setFieldValue("roles", newRoles);
  };

  /**
   * Maneja la selección/deselección de scopes adicionales
   * @param scopeKey - Key del scope a togglear
   */
  const handleScopeToggle = (scopeKey: string) => {
    const newScopes = formik.values.customScopes.includes(scopeKey)
      ? formik.values.customScopes.filter((key) => key !== scopeKey)
      : [...formik.values.customScopes, scopeKey];
    formik.setFieldValue("customScopes", newScopes);
  };

  /**
   * Limpia todos los roles seleccionados
   */
  const clearAllRoles = () => {
    formik.setFieldValue("roles", []);
  };

  /**
   * Maneja la selección/deselección de todos los roles filtrados
   * @param selectAll - Indica si se deben seleccionar todos (true) o ninguno (false)
   */
  const toggleAllRoles = (selectAll: boolean) => {
    if (selectAll) {
      // Agregar solo los roles filtrados que no estén ya seleccionados
      const filteredRoleKeys = filteredRoles.map((r) => r.key);
      const newRoles = [
        ...new Set([...formik.values.roles, ...filteredRoleKeys]),
      ];
      formik.setFieldValue("roles", newRoles);
    } else {
      // Remover solo los roles que están en el filtro actual
      const filteredRoleKeys = filteredRoles.map((r) => r.key);
      const newRoles = formik.values.roles.filter(
        (key) => !filteredRoleKeys.includes(key),
      );
      formik.setFieldValue("roles", newRoles);
    }
  };

  /**
   * Limpia todos los scopes adicionales seleccionados
   */
  const clearAllScopes = () => {
    formik.setFieldValue("customScopes", []);
  };

  /**
   * Maneja la selección/deselección de todos los scopes filtrados
   * @param selectAll - Indica si se deben seleccionar todos (true) o ninguno (false)
   */
  const toggleAllScopes = (selectAll: boolean) => {
    if (selectAll) {
      // Agregar solo los scopes filtrados no deprecated y que no estén en roles que no estén ya seleccionados
      const availableFilteredScopes = filteredScopes.filter(
        (scope) => !scope.deprecated && !isScopeInSelectedRoles(scope.key),
      );
      const filteredScopeKeys = availableFilteredScopes.map((s) => s.key);
      const newScopes = [
        ...new Set([...formik.values.customScopes, ...filteredScopeKeys]),
      ];
      formik.setFieldValue("customScopes", newScopes);
    } else {
      // Remover solo los scopes que están en el filtro actual
      const filteredScopeKeys = filteredScopes.map((s) => s.key);
      const newScopes = formik.values.customScopes.filter(
        (key) => !filteredScopeKeys.includes(key),
      );
      formik.setFieldValue("customScopes", newScopes);
    }
  };

  // Textos dinámicos según el modo
  const title = mode === "create" ? "Nuevo Usuario" : "Editar Usuario";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const handleClose = () => {
    formik.resetForm();
    setRoleSearch("");
    setScopeSearch("");
    onCancel();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="user-form-title"
    >
      {/* Header del modal */}
      <DialogTitle id="user-form-title">
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
            {/* Campos básicos - Nombre y Email */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
              gap={3}
              mb={4}
            >
              {/* Campo de nombre */}
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nombre"
                placeholder="Nombre del usuario"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={formik.isSubmitting}
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

              {/* Campo de email */}
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                placeholder="Email del usuario"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={formik.isSubmitting || mode === "edit"}
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

            {/* Sección de Roles */}
            <Box mb={4}>
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
                  Roles asignados
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    type="button"
                    onClick={() => toggleAllRoles(true)}
                    size="small"
                    disabled={filteredRoles.length === 0}
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
                    {roleSearch ? "Seleccionar filtrados" : "Seleccionar todos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => toggleAllRoles(false)}
                    size="small"
                    disabled={
                      filteredRoles.length === 0 ||
                      formik.values.roles.filter((key) =>
                        filteredRoles.map((r) => r.key).includes(key),
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
                    {roleSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={clearAllRoles}
                    size="small"
                    disabled={formik.values.roles.length === 0}
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
                    Limpiar todos
                  </Button>
                </Box>
              </Box>

              {/* Buscador de roles */}
              <TextField
                fullWidth
                placeholder="Buscar roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
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

              {/* Lista de roles seleccionables */}
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  backgroundColor: "#fafafa",
                }}
              >
                {filteredRoles.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No se encontraron roles
                  </Typography>
                ) : (
                  <Box sx={{ display: "grid", gap: 1 }}>
                    {filteredRoles.map((role) => (
                      <FormControlLabel
                        key={role.key}
                        control={
                          <Checkbox
                            checked={formik.values.roles.includes(role.key)}
                            onChange={() => handleRoleToggle(role.key)}
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
                              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                            >
                              {role.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              {role.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ alignItems: "flex-start", m: 0 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Sección de Scopes adicionales */}
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
                  Scopes adicionales
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    type="button"
                    onClick={() => toggleAllScopes(true)}
                    size="small"
                    disabled={
                      filteredScopes.filter(
                        (s) => !s.deprecated && !isScopeInSelectedRoles(s.key),
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
                    {scopeSearch
                      ? "Seleccionar filtrados"
                      : "Seleccionar todos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => toggleAllScopes(false)}
                    size="small"
                    disabled={
                      filteredScopes.length === 0 ||
                      formik.values.customScopes.filter((key) =>
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
                    {scopeSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
                  </Button>
                  <Button
                    type="button"
                    onClick={clearAllScopes}
                    size="small"
                    disabled={formik.values.customScopes.length === 0}
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
                    Limpiar todos
                  </Button>
                </Box>
              </Box>

              {/* Buscador de scopes */}
              <TextField
                fullWidth
                placeholder="Buscar scopes..."
                value={scopeSearch}
                onChange={(e) => setScopeSearch(e.target.value)}
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

              {/* Lista de scopes seleccionables */}
              <Box
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  backgroundColor: "#fafafa",
                }}
              >
                {filteredScopes.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No se encontraron scopes
                  </Typography>
                ) : (
                  <Box sx={{ display: "grid", gap: 1 }}>
                    {filteredScopes.map((scope) => {
                      const isInRoles = isScopeInSelectedRoles(scope.key);
                      const isChecked = formik.values.customScopes.includes(
                        scope.key,
                      );

                      return (
                        <FormControlLabel
                          key={scope.key}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() =>
                                !isInRoles && handleScopeToggle(scope.key)
                              }
                              disabled={isInRoles}
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
                            <Box sx={{ opacity: isInRoles ? 0.6 : 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                              >
                                {scope.name}
                                {isInRoles && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ ml: 1, color: "text.secondary" }}
                                  >
                                    (incluido en roles)
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
                      );
                    })}
                  </Box>
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

export default UserFormModal;
