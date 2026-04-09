import { Box, Button, Chip, TableCell, TableRow } from "@mui/material";
import { useState } from "react";
import ConfirmActionDialog from "../../common/components/ConfirmActionDialog";
import DataTable from "../../common/components/DataTable";
import PageHeader from "../../common/components/PageHeader";
import TextActionButton from "../../common/components/TextActionButton";
import Loader from "../../common/loader";
import type { Role } from "../../models/Role";
import { useRoleStore } from "../../stores/useRoleStore";
import { useScopeStore } from "../../stores/useScopeStore";
import RoleFormModal from "./Form";

const RoleList = () => {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoleStore();
  const { scopes } = useScopeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const handleCreate = async (roleData: Omit<Role, "id">) => {
    await createRole(roleData);
    setIsCreating(false);
  };

  const handleUpdate = async (roleData: Role | Omit<Role, "id">) => {
    if (!("id" in roleData)) {
      return;
    }

    await updateRole(roleData.id, roleData);
    setEditingRole(null);
  };

  const confirmDelete = (id: string) => {
    setRoleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) {
      return;
    }

    await deleteRole(roleToDelete);
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  if (loading && roles.length === 0) {
    return <Loader message="Cargando roles del sistema..." />;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={isDeleteModalOpen}
        title="Confirmar eliminacion"
        description={`Estas seguro de eliminar el rol "${roleToDelete ?? ""}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={loading}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PageHeader
        title="Roles"
        subtitle="Administra los perfiles de acceso disponibles en el sistema."
        actions={
          <Button
            onClick={() => setIsCreating(true)}
            variant="contained"
            disabled={loading}
          >
            Anadir rol
          </Button>
        }
      />

      <RoleFormModal
        isOpen={isCreating}
        mode="create"
        availableScopes={scopes}
        onSubmit={handleCreate}
        onCancel={() => setIsCreating(false)}
      />

      <RoleFormModal
        isOpen={!!editingRole}
        mode="edit"
        role={editingRole || undefined}
        availableScopes={scopes}
        onSubmit={handleUpdate}
        onCancel={() => setEditingRole(null)}
      />

      <DataTable
        columns={["Nombre", "Descripcion", "Permisos", "Acciones"]}
        hasData={roles.length > 0}
        emptyMessage="No hay roles registrados"
      >
        {roles.map((role) => (
          <TableRow key={role.id} hover>
            <TableCell>{role.name}</TableCell>
            <TableCell>{role.description}</TableCell>
            <TableCell>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {role.permissionIds.length > 0 ? (
                  role.permissionIds.map((permissionId) => {
                    const permission = scopes.find(
                      (scope) => scope.id === permissionId,
                    );
                    const label = permission
                      ? `${permission.method} ${permission.url}`
                      : permissionId;
                    return (
                      <Chip
                        key={permissionId}
                        label={label}
                        size="small"
                        sx={{
                          backgroundColor: "#e8f5e8",
                          color: "#2e7d32",
                          fontSize: "0.75rem",
                        }}
                      />
                    );
                  })
                ) : (
                  <Chip
                    label="Sin permisos"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" gap={2}>
                <TextActionButton
                  label="Editar"
                  onClick={() => setEditingRole(role)}
                  disabled={loading}
                />
                <TextActionButton
                  label="Eliminar"
                  onClick={() => confirmDelete(role.id)}
                  disabled={loading}
                  color="error"
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </Box>
  );
};

export default RoleList;
