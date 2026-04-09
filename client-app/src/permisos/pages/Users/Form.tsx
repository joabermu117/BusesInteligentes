import { Box, TextField } from "@mui/material";
import { useFormik } from "formik";
import { useState } from "react";
import FormDialog from "../../common/components/forms/FormDialog";
import SelectableChecklist from "../../common/components/forms/SelectableChecklist";
import type { Role } from "../../models/Role";
import type { User } from "../../models/user";
import { userSchema } from "../../schemas/userSchema";

interface UserFormProps {
  mode: "create" | "edit";
  user?: User;
  availableRoles: Role[];
  onSubmit: (userData: Omit<User, "id"> | User) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

const UserFormModal = ({
  mode,
  user,
  availableRoles,
  onSubmit,
  onCancel,
  isOpen,
}: UserFormProps) => {
  const [roleSearch, setRoleSearch] = useState("");

  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      roleIds: user?.roleIds || [],
      ...(mode === "edit" && user ? { id: user.id } : {}),
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

  const title = mode === "create" ? "Nuevo usuario" : "Editar usuario";
  const submitText = mode === "create" ? "Crear" : "Guardar cambios";

  const filteredRoles = availableRoles.filter((role) => {
    const q = roleSearch.toLowerCase();
    return (
      role.name.toLowerCase().includes(q) ||
      role.description.toLowerCase().includes(q)
    );
  });

  const roleItems = filteredRoles.map((role) => ({
    key: role.id,
    title: role.name,
    description: role.description,
    checked: formik.values.roleIds.includes(role.id),
  }));

  const handleRoleToggle = (roleId: string) => {
    const selectedRoleIds = formik.values.roleIds.includes(roleId)
      ? formik.values.roleIds.filter((id) => id !== roleId)
      : [...formik.values.roleIds, roleId];
    formik.setFieldValue("roleIds", selectedRoleIds);
  };

  const handleClose = () => {
    formik.resetForm();
    setRoleSearch("");
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
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gap={3}
        mb={3}
      >
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
          placeholder="email@ejemplo.com"
          type="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={formik.isSubmitting || mode === "edit"}
        />
      </Box>

      <SelectableChecklist
        title="Roles asignados"
        searchPlaceholder="Buscar roles..."
        searchValue={roleSearch}
        onSearchChange={setRoleSearch}
        onSelectAll={() => {
          const selected = new Set(formik.values.roleIds);
          filteredRoles.forEach((role) => selected.add(role.id));
          formik.setFieldValue("roleIds", Array.from(selected));
        }}
        onUnselectFiltered={() => {
          const filteredRoleIds = filteredRoles.map((role) => role.id);
          formik.setFieldValue(
            "roleIds",
            formik.values.roleIds.filter((id) => !filteredRoleIds.includes(id)),
          );
        }}
        disableSelectAll={filteredRoles.length === 0}
        disableUnselectFiltered={
          filteredRoles.length === 0 ||
          formik.values.roleIds.filter((id) =>
            filteredRoles.some((role) => role.id === id),
          ).length === 0
        }
        selectAllLabel={
          roleSearch ? "Seleccionar filtrados" : "Seleccionar todos"
        }
        unselectLabel={roleSearch ? "Desmarcar filtrados" : "Desmarcar todos"}
        items={roleItems}
        onToggle={handleRoleToggle}
        emptyMessage="No hay roles disponibles"
      />
    </FormDialog>
  );
};

export default UserFormModal;
