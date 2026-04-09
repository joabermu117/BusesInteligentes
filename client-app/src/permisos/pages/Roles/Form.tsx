import { TextField } from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import FormDialog from "../../common/components/forms/FormDialog";
import SelectableChecklist from "../../common/components/forms/SelectableChecklist";
import type { Role } from "../../models/Role";
import type { Scope } from "../../models/Scope";
import { roleSchema } from "../../schemas/roleSchema";

interface RoleFormProps {
  mode: "create" | "edit";
  role?: Role;
  availableScopes: Scope[];
  onSubmit: (roleData: Omit<Role, "id"> | Role) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const RoleFormModal = ({
  mode,
  role,
  availableScopes,
  onSubmit,
  onCancel,
  isOpen,
}: RoleFormProps) => {
  const [scopeSearch, setScopeSearch] = useState("");

  const formik = useFormik({
    initialValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissionIds: role?.permissionIds || [],
      ...(mode === "edit" && role ? { id: role.id } : {}),
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

  const title = mode === "create" ? "Nuevo rol" : "Editar rol";
  const submitText = mode === "create" ? "Crear" : "Guardar cambios";

  const filteredScopes = availableScopes.filter((scope) => {
    const q = scopeSearch.toLowerCase();
    return (
      scope.url.toLowerCase().includes(q) ||
      scope.method.toLowerCase().includes(q) ||
      scope.model.toLowerCase().includes(q)
    );
  });

  const handlePermissionToggle = (permissionId: string) => {
    const selectedPermissionIds = formik.values.permissionIds.includes(
      permissionId,
    )
      ? formik.values.permissionIds.filter((id) => id !== permissionId)
      : [...formik.values.permissionIds, permissionId];
    formik.setFieldValue("permissionIds", selectedPermissionIds);
  };

  const permissionItems = filteredScopes.map((scope) => ({
    key: scope.id,
    title: `${scope.method} ${scope.url}`,
    description: `Modelo: ${scope.model}`,
    checked: formik.values.permissionIds.includes(scope.id),
  }));

  const handleClose = () => {
    formik.resetForm();
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
      <TextField
        fullWidth
        id="name"
        name="name"
        label="Nombre"
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
        label="Descripcion"
        placeholder="Describe el alcance del rol"
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
        title="Permisos asignados"
        searchPlaceholder="Buscar permisos..."
        searchValue={scopeSearch}
        onSearchChange={setScopeSearch}
        onSelectAll={() =>
          formik.setFieldValue(
            "permissionIds",
            filteredScopes.map((scope) => scope.id),
          )
        }
        onUnselectFiltered={() => {
          const filteredIds = filteredScopes.map((scope) => scope.id);
          formik.setFieldValue(
            "permissionIds",
            formik.values.permissionIds.filter(
              (id) => !filteredIds.includes(id),
            ),
          );
        }}
        disableSelectAll={filteredScopes.length === 0}
        disableUnselectFiltered={
          filteredScopes.length === 0 ||
          formik.values.permissionIds.filter((id) =>
            filteredScopes.some((scope) => scope.id === id),
          ).length === 0
        }
        selectAllLabel={
          scopeSearch ? "Seleccionar filtrados" : "Seleccionar todos"
        }
        unselectLabel={scopeSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
        items={permissionItems}
        onToggle={handlePermissionToggle}
        emptyMessage="No hay permisos disponibles"
      />
    </FormDialog>
  );
};

export default RoleFormModal;
