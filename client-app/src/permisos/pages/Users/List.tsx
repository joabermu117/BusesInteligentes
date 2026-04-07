import { ExpandMore, MoreHoriz, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
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
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
  } = useUserStore();
  const { roles } = useRoleStore();
  const { scopes } = useScopeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionsAnchor, setPermissionsAnchor] = useState<HTMLElement | null>(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<string[]>([]);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [selectedUserForActions, setSelectedUserForActions] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (Array.isArray(users) ? users : []).filter((user) => {
      const name = typeof user.name === "string" ? user.name : "";
      const email = typeof user.email === "string" ? user.email : "";
      const uid = typeof user.uid === "string" ? user.uid : "";
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        uid.toLowerCase().includes(q)
      );
    });
  }, [users, searchTerm]);

  const userPermissions = useMemo<Record<string, string[]>>(() => {
    const roleScopesMap = new Map(roles.map((role) => [role.key, role.scopes]));

    return users.reduce<Record<string, string[]>>((acc, user) => {
      const roleScopes = (user.roles || []).flatMap((roleKey) => roleScopesMap.get(roleKey) || []);
      const directScopes = user.customScopes || [];
      acc[user.uid] = Array.from(new Set([...roleScopes, ...directScopes]));
      return acc;
    }, {});
  }, [roles, users]);

  const selectedUserName = useMemo(
    () => users.find((user) => user.uid === userToDelete)?.name ?? "",
    [users, userToDelete],
  );

  const handleCreate = async (userData: Omit<User, "uid">) => {
    await createUser(userData);
    setIsCreating(false);
  };

  const handleUpdate = async (userData: User | Omit<User, "uid">) => {
    if (!("uid" in userData)) {
      return;
    }
    await updateUser(userData.uid, userData);
    setEditingUser(null);
  };

  const confirmDelete = (uid: string) => {
    setUserToDelete(uid);
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

  const handlePermissionsClick = (
    event: React.MouseEvent<HTMLDivElement>,
    uid: string,
  ) => {
    setPermissionsAnchor(event.currentTarget);
    setSelectedUserPermissions(userPermissions[uid] || []);
  };

  const handlePermissionsClose = () => {
    setPermissionsAnchor(null);
    setSelectedUserPermissions([]);
  };

  const getRoleNames = (roleKeys?: string[]): string[] => {
    const keys = Array.isArray(roleKeys) ? roleKeys : [];
    return keys
      .map((key) => roles.find((role) => role.key === key)?.name || key)
      .filter(Boolean);
  };

  const getScopeNames = (scopeKeys?: string[]): string[] => {
    const keys = Array.isArray(scopeKeys) ? scopeKeys : [];
    return keys
      .map((key) => scopes.find((scope) => scope.key === key)?.name || key)
      .filter(Boolean);
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
    return <Loader message="Cargando ciudadanos registrados..." />;
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
        title="Ciudadanos"
        subtitle="Administra personas usuarias, metodos y trazabilidad de uso del sistema."
        actions={
          <Box display="flex" gap={1.5} alignItems="center">
            <TextField
              placeholder="Buscar"
              value={searchTerm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(event.target.value)
              }
              size="small"
              sx={{ width: 220 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Search sx={{ color: "text.secondary", fontSize: "1.1rem" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button onClick={() => setIsCreating(true)} variant="contained" disabled={loading}>
              Registrar ciudadano
            </Button>
          </Box>
        }
      />

      <UserFormModal
        isOpen={isCreating}
        mode="create"
        availableRoles={roles}
        availableScopes={scopes}
        onSubmit={handleCreate}
        onCancel={() => setIsCreating(false)}
      />

      <UserFormModal
        isOpen={!!editingUser}
        mode="edit"
        user={editingUser || undefined}
        availableRoles={roles}
        availableScopes={scopes}
        onSubmit={handleUpdate}
        onCancel={() => setEditingUser(null)}
      />

      <Popover
        open={Boolean(permissionsAnchor)}
        anchorEl={permissionsAnchor}
        onClose={handlePermissionsClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { maxHeight: 300, minWidth: 250, boxShadow: 3 } }}
      >
        <Box sx={{ p: 1 }}>
          <List dense>
            {selectedUserPermissions.length > 0 ? (
              selectedUserPermissions.map((permission) => (
                <ListItem key={permission} sx={{ py: 0.5 }}>
                  <ListItemText primary={permission} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="Sin permisos asignados" />
                
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>

      <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={closeActions}>
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
              confirmDelete(selectedUserForActions.uid);
              closeActions();
            }}
            sx={{ color: "error.main" }}
          >
            Eliminar
          </MenuItem>
        ) : null}
      </Menu>

      <DataTable
        columns={[
          "Nombre",
          "Email",
          "Roles",
          "Scopes adicionales",
          "Reglas efectivas",
          "Acciones",
        ]}
        hasData={filteredUsers.length > 0}
        emptyMessage={
          searchTerm
            ? "No se encontraron ciudadanos con ese termino"
            : "No hay ciudadanos disponibles"
        }
      >
        {filteredUsers.map((user) => (
          <TableRow key={user.uid} hover>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {getRoleNames(user.roles).map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    sx={{ backgroundColor: "#e3f2fd", color: "#1976d2", fontSize: "0.75rem" }}
                  />
                ))}
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {getScopeNames(user.customScopes).map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    size="small"
                    sx={{ backgroundColor: "#f3e5f5", color: "#7b1fa2", fontSize: "0.75rem" }}
                  />
                ))}
              </Box>
            </TableCell>
            <TableCell>
              <Chip
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ExpandMore sx={{ fontSize: "1rem" }} />
                    {`${Array.isArray(userPermissions[user.uid]) ? userPermissions[user.uid].length : 0} reglas`}
                  </Box>
                }
                size="small"
                onClick={(event) => handlePermissionsClick(event, user.uid)}
                sx={{
                  backgroundColor: "#e8f5e8",
                  color: "#2e7d32",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#d4edda" },
                }}
              />
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
        ))}
      </DataTable>
    </Box>
  );
};

export default UserList;
