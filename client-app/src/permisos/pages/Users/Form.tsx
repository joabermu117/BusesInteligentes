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

import { Box, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import FormDialog from "../../common/components/forms/FormDialog";
import SelectableChecklist from "../../common/components/forms/SelectableChecklist";
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

  const filteredRoles = availableRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      role.key.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  const filteredScopes = availableScopes.filter(
    (scope) =>
      (scope.name.toLowerCase().includes(scopeSearch.toLowerCase()) ||
        scope.key.toLowerCase().includes(scopeSearch.toLowerCase())) &&
      !scope.deprecated,
  );

  const getScopesFromSelectedRoles = (): string[] => {
    return formik.values.roles.flatMap((roleKey) => {
      const role = availableRoles.find((r) => r.key === roleKey);
      return role ? role.scopes : [];
    });
  };

  const isScopeInSelectedRoles = (scopeKey: string): boolean => {
    const roleScopes = getScopesFromSelectedRoles();
    return roleScopes.includes(scopeKey);
  };

  const handleRoleToggle = (roleKey: string) => {
    const newRoles = formik.values.roles.includes(roleKey)
      ? formik.values.roles.filter((key) => key !== roleKey)
      : [...formik.values.roles, roleKey];
    formik.setFieldValue("roles", newRoles);
  };

  const handleScopeToggle = (scopeKey: string) => {
    const newScopes = formik.values.customScopes.includes(scopeKey)
      ? formik.values.customScopes.filter((key) => key !== scopeKey)
      : [...formik.values.customScopes, scopeKey];
    formik.setFieldValue("customScopes", newScopes);
  };

  const clearAllRoles = () => {
    formik.setFieldValue("roles", []);
  };

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

  const clearAllScopes = () => {
    formik.setFieldValue("customScopes", []);
  };

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

  const title = mode === "create" ? "Nuevo Usuario" : "Editar Usuario";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const filteredRoleKeys = filteredRoles.map((item) => item.key);
  const filteredScopeKeys = filteredScopes.map((item) => item.key);

  const roleItems = filteredRoles.map((role) => ({
    key: role.key,
    title: role.name,
    description: role.description,
    checked: formik.values.roles.includes(role.key),
  }));

  const scopeItems = filteredScopes.map((scope) => {
    const includedByRole = isScopeInSelectedRoles(scope.key);
    return {
      key: scope.key,
      title: scope.name,
      description: scope.description,
      checked: formik.values.customScopes.includes(scope.key),
      disabled: includedByRole,
      caption: includedByRole ? "(incluido en roles)" : undefined,
    };
  });

  const handleClose = () => {
    formik.resetForm();
    setRoleSearch("");
    setScopeSearch("");
    onCancel();
  };

  return (
    <FormDialog
      open={isOpen}
      title={title}
      onClose={handleClose}
      onSubmit={() => void formik.submitForm()}
      submitLabel={submitText}
      submitting={formik.isSubmitting}
      canSubmit={formik.isValid}
      maxWidth="md"
    >
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3} mb={4}>
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
        />

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
        />
      </Box>

      <Box mb={4}>
        <SelectableChecklist
          title="Roles asignados"
          searchPlaceholder="Buscar roles..."
          searchValue={roleSearch}
          onSearchChange={setRoleSearch}
          onSelectAll={() => toggleAllRoles(true)}
          onUnselectFiltered={() => toggleAllRoles(false)}
          onClearAll={clearAllRoles}
          disableSelectAll={filteredRoles.length === 0}
          disableUnselectFiltered={
            filteredRoles.length === 0 ||
            formik.values.roles.filter((key) => filteredRoleKeys.includes(key)).length === 0
          }
          disableClearAll={formik.values.roles.length === 0}
          selectAllLabel={roleSearch ? "Seleccionar filtrados" : "Seleccionar todos"}
          unselectLabel={roleSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
          items={roleItems}
          onToggle={handleRoleToggle}
          emptyMessage="No se encontraron roles"
        />
      </Box>

      <SelectableChecklist
        title="Scopes adicionales"
        searchPlaceholder="Buscar scopes..."
        searchValue={scopeSearch}
        onSearchChange={setScopeSearch}
        onSelectAll={() => toggleAllScopes(true)}
        onUnselectFiltered={() => toggleAllScopes(false)}
        onClearAll={clearAllScopes}
        disableSelectAll={filteredScopes.filter((scope) => !isScopeInSelectedRoles(scope.key)).length === 0}
        disableUnselectFiltered={
          filteredScopes.length === 0 ||
          formik.values.customScopes.filter((key) => filteredScopeKeys.includes(key)).length === 0
        }
        disableClearAll={formik.values.customScopes.length === 0}
        selectAllLabel={scopeSearch ? "Seleccionar filtrados" : "Seleccionar todos"}
        unselectLabel={scopeSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
        items={scopeItems}
        onToggle={(key) => {
          if (!isScopeInSelectedRoles(key)) {
            handleScopeToggle(key);
          }
        }}
        emptyMessage="No se encontraron scopes"
      />
    </FormDialog>
  );
};

export default UserFormModal;
