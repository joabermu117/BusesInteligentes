import { ExpandMore } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Popover,
  TableCell,
  TableRow,
} from "@mui/material";
import { useState } from "react";
import DataTable from "../../common/components/DataTable";
import ConfirmActionDialog from "../../common/components/ConfirmActionDialog";
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedRoleScopes, setSelectedRoleScopes] = useState<string[]>([]);

  const handleCreate = async (roleData: Omit<Role, "key">) => {
    await createRole(roleData);
    setIsCreating(false);
  };

  const handleUpdate = async (roleData: Role | Omit<Role, "key">) => {
    if ("key" in roleData) {
      await updateRole(roleData.key, roleData);
      setEditingRole(null);
    }
  };

  const confirmDelete = (key: string) => {
    setRoleToDelete(key);
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

  const handleScopesClick = (
    event: React.MouseEvent<HTMLDivElement>,
    roleScopes: string[],
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoleScopes(roleScopes);
  };

  const handleScopesClose = () => {
    setAnchorEl(null);
    setSelectedRoleScopes([]);
  };

  const getScopeNames = (scopeKeys: string[]): string[] => {
    return scopeKeys
      .map((key) => scopes.find((scope) => scope.key === key)?.name || key)
      .filter(Boolean);
  };

  if (loading && roles.length === 0) {
    return <Loader message="Cargando empresas y flotas..." />;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={isDeleteModalOpen}
        title="Confirmar eliminacion"
        description={`Estas seguro de eliminar el registro "${roleToDelete ?? ""}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={loading}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PageHeader
        title="Empresas y Flotas"
        subtitle="Administra las empresas operadoras y su configuracion de cobertura." 
        actions={
          <Button
            onClick={() => setIsCreating(true)}
            variant="contained"
            disabled={loading}
          >
            Registrar flota
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

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleScopesClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { maxHeight: 300, minWidth: 250, boxShadow: 3 } }}
      >
        <Box sx={{ p: 1 }}>
          <List dense>
            {getScopeNames(selectedRoleScopes).length > 0 ? (
              getScopeNames(selectedRoleScopes).map((scopeName) => (
                <ListItem key={scopeName} sx={{ py: 0.5 }}>
                  <ListItemText primary={scopeName} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="Sin atributos operativos" />
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>

      <DataTable
        columns={["Nombre", "Descripcion", "Permisos", "Acciones"]}
        hasData={roles.length > 0}
        emptyMessage="No hay empresas o flotas registradas"
      >
        {roles.map((role) => (
          <TableRow key={role.key} hover>
            <TableCell>{role.name}</TableCell>
            <TableCell>{role.description}</TableCell>
            <TableCell>
              <Chip
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ExpandMore sx={{ fontSize: "1rem" }} />
                    {`${role.scopes?.length || 0} atributos`}
                  </Box>
                }
                size="small"
                onClick={(event) => handleScopesClick(event, role.scopes || [])}
                sx={{
                  backgroundColor: "#e8f5e8",
                  color: "#2e7d32",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#d4edda" },
                }}
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={2}>
                <TextActionButton
                  label="Editar"
                  onClick={() => setEditingRole(role)}
                  disabled={loading}
                />
                {role.key !== "administrador" && role.key !== "metrologo" ? (
                  <TextActionButton
                    label="Eliminar"
                    onClick={() => confirmDelete(role.key)}
                    disabled={loading}
                    color="error"
                  />
                ) : null}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </Box>
  );
};

export default RoleList;
