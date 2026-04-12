import { MoreHoriz, Search } from "@mui/icons-material";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  TableCell,
  TableRow,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";
import ConfirmActionDialog from "../../common/components/ConfirmActionDialog";
import DataTable from "../../common/components/DataTable";
import PageHeader from "../../common/components/PageHeader";
import Loader from "../../common/loader";
import type { User } from "../../models/user";
import { useRoleStore } from "../../stores/useRoleStore";
import { useScopeStore } from "../../stores/useScopeStore";
import { useUserStore } from "../../stores/useUserStore";
import UserFormModal from "./Form";

const UserList = () => {
  const { users, loading, updateUser, deleteUser } = useUserStore();
  const { roles } = useRoleStore();
  const { scopes } = useScopeStore();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [selectedUserForActions, setSelectedUserForActions] =
    useState<User | null>(null);
  const [selectedPermissionByUser, setSelectedPermissionByUser] = useState<
    Record<string, string>
  >({});

  const getRoleNames = (roleIds: string[]): string[] => {
    return roleIds
      .map((roleId) => roles.find((role) => role.id === roleId)?.name || roleId)
      .filter(Boolean);
  };

  const getEffectivePermissionLabels = (roleIds: string[]): string[] => {
    const permissionIds = new Set(
      roleIds.flatMap(
        (roleId) =>
          roles.find((role) => role.id === roleId)?.permissionIds ?? [],
      ),
    );

    return Array.from(permissionIds)
      .map((permissionId) => {
        const scope = scopes.find((item) => item.id === permissionId);
        return scope ? `${scope.method} ${scope.url}` : permissionId;
      })
      .filter(Boolean);
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (Array.isArray(users) ? users : []).filter((user) => {
      const name = typeof user.name === "string" ? user.name : "";
      const email = typeof user.email === "string" ? user.email : "";
      const id = typeof user.id === "string" ? user.id : "";
      const roleNames = getRoleNames(
        Array.isArray(user.roleIds) ? user.roleIds : [],
      ).join(" ");
      const effectivePermissions = getEffectivePermissionLabels(
        Array.isArray(user.roleIds) ? user.roleIds : [],
      ).join(" ");
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q) ||
        roleNames.toLowerCase().includes(q) ||
        effectivePermissions.toLowerCase().includes(q)
      );
    });
  }, [roles, scopes, users, searchTerm]);

  const selectedUserName = useMemo(
    () => users.find((user) => user.id === userToDelete)?.name ?? "",
    [users, userToDelete],
  );

  const handleUpdate = async (userData: User | Omit<User, "id">) => {
    if (!("id" in userData)) {
      return;
    }

    await updateUser(userData.id, userData);
    setEditingUser(null);
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) {
      return;
    }

    await deleteUser(userToDelete);
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const openActions = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionsAnchor(event.currentTarget);
    setSelectedUserForActions(user);
  };

  const closeActions = () => {
    setActionsAnchor(null);
    setSelectedUserForActions(null);
  };

  if (loading && users.length === 0) {
    return <Loader message="Cargando usuarios registrados..." />;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={isDeleteModalOpen}
        title="Confirmar eliminacion"
        description={`Estas seguro de eliminar al usuario "${selectedUserName}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={loading}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PageHeader
        title="Usuarios"
        subtitle="Administra usuarios registrados en el sistema."
        actions={
          <TextField
            placeholder="Buscar"
            value={searchTerm}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(event.target.value)
            }
            size="small"
            sx={{ width: 240 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search
                    sx={{ color: "text.secondary", fontSize: "1.1rem" }}
                  />
                </InputAdornment>
              ),
            }}
          />
        }
      />

      <UserFormModal
        isOpen={!!editingUser}
        mode="edit"
        user={editingUser || undefined}
        availableRoles={roles}
        onSubmit={handleUpdate}
        onCancel={() => setEditingUser(null)}
      />

      <Menu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={closeActions}
      >
        {selectedUserForActions ? (
          <MenuItem
            onClick={() => {
              setEditingUser(selectedUserForActions);
              closeActions();
            }}
          >
            Editar
          </MenuItem>
        ) : null}
        {selectedUserForActions ? (
          <MenuItem
            onClick={() => {
              confirmDelete(selectedUserForActions.id);
              closeActions();
            }}
            sx={{ color: "error.main" }}
          >
            Eliminar
          </MenuItem>
        ) : null}
      </Menu>

      <DataTable
        columns={["Nombre", "Email", "Roles", "Permisos efectivos", "Acciones"]}
        hasData={filteredUsers.length > 0}
        emptyMessage={
          searchTerm
            ? "No se encontraron usuarios con ese termino"
            : "No hay usuarios disponibles"
        }
      >
        {filteredUsers.map((user) => {
          const roleNames = getRoleNames(user.roleIds);
          const effectivePermissions = getEffectivePermissionLabels(
            user.roleIds,
          );

          return (
            <TableRow key={user.id} hover>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {roleNames.length > 0 ? (
                    roleNames.map((roleName) => (
                      <Chip
                        key={`${user.id}-${roleName}`}
                        label={roleName}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "0.75rem",
                        }}
                      />
                    ))
                  ) : (
                    <Chip
                      label="Sin roles"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.75rem" }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <Select
                    displayEmpty
                    value={selectedPermissionByUser[user.id] ?? ""}
                    onChange={(event) =>
                      setSelectedPermissionByUser((previousState) => ({
                        ...previousState,
                        [user.id]: event.target.value,
                      }))
                    }
                    renderValue={(selectedValue) => {
                      if (!selectedValue) {
                        return effectivePermissions.length > 0
                          ? `${effectivePermissions.length} permisos efectivos`
                          : "Sin permisos";
                      }
                      return selectedValue;
                    }}
                  >
                    <MenuItem value="">
                      {effectivePermissions.length > 0
                        ? "Seleccionar permiso"
                        : "Sin permisos"}
                    </MenuItem>
                    {effectivePermissions.map((permissionLabel) => (
                      <MenuItem
                        key={`${user.id}-${permissionLabel}`}
                        value={permissionLabel}
                      >
                        {permissionLabel}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    openActions(event, user);
                  }}
                  disabled={loading}
                >
                  <MoreHoriz />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </DataTable>
    </Box>
  );
};

export default UserList;
