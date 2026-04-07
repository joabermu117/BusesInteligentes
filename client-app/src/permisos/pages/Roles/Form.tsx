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

import {
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import FormDialog from "../../common/components/forms/FormDialog";
import SelectableChecklist from "../../common/components/forms/SelectableChecklist";
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

  const filteredScopeKeys = filteredScopes.map((scope) => scope.key);
  const scopeItems = filteredScopes.map((scope) => ({
    key: scope.key,
    title: scope.name,
    description: scope.description,
    checked: formik.values.scopes.includes(scope.key),
    caption: scope.deprecated ? "(obsoleto)" : undefined,
  }));

  // Textos dinámicos según el modo
  const title = mode === "create" ? "Nuevo Rol" : "Editar Rol";
  const submitText = mode === "create" ? "Crear" : "Actualizar";

  const handleClose = () => {
    formik.resetForm();
    setSearchTerm("");
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
      />

      <TextField
        fullWidth
        id="description"
        name="description"
        label="Descripcion del rol"
        placeholder="Descripcion del rol"
        multiline
        rows={3}
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.description && Boolean(formik.errors.description)}
        helperText={formik.touched.description && formik.errors.description}
        disabled={formik.isSubmitting}
        sx={{ mb: 3 }}
      />

      <SelectableChecklist
        title="Permisos asignados *"
        searchPlaceholder="Buscar permisos..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectAll={() => toggleAllScopes(true)}
        onUnselectFiltered={() => toggleAllScopes(false)}
        disableSelectAll={filteredScopes.filter((scope) => !scope.deprecated).length === 0}
        disableUnselectFiltered={
          filteredScopes.length === 0 ||
          formik.values.scopes.filter((key) => filteredScopeKeys.includes(key)).length === 0
        }
        selectAllLabel={searchTerm ? "Seleccionar filtrados" : "Seleccionar todos"}
        unselectLabel={searchTerm ? "Desmarcar filtrados" : "Desmarcar todos"}
        items={scopeItems}
        onToggle={handleScopeToggle}
        emptyMessage="No se encontraron permisos con el termino de busqueda"
      />

      {formik.touched.scopes && formik.errors.scopes ? (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
          {formik.errors.scopes}
        </Typography>
      ) : null}
    </FormDialog>
  );
};

export default RoleFormModal;
