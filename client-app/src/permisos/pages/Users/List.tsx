import { ExpandMore, MoreHoriz, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useMemo, useState } from "react";
import type { User } from "../../models/user";
import { useRoleStore } from "../../stores/useRoleStore";
import { useScopeStore } from "../../stores/useScopeStore";
import { useUserStore } from "../../stores/useUserStore";
import UserFormModal from "./Form";

const UserList = () => {
  const { users, loading, createUser, updateUser, deleteUser } = useUserStore();
  const { roles } = useRoleStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [permissionsAnchor, setPermissionsAnchor] =
    useState<HTMLElement | null>(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<
    string[]
  >([]);

  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null);
  const [selectedUserForActions, setSelectedUserForActions] =
    useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const q = searchTerm.toLowerCase();
    return safeUsers.filter((user) => {
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
      .map(
        (key: string) =>
          roles.find((role: { key: string; name: string }) => role.key === key)
            ?.name || key,
      )
      .filter(Boolean);
  };

  const getScopeNames = (scopeKeys?: string[]): string[] => {
    const keys = Array.isArray(scopeKeys) ? scopeKeys : [];
    return keys
      .map(
        (key: string) =>
          scopes.find(
            (scope: { key: string; name: string }) => scope.key === key,
          )?.name || key,
      )
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
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{ color: "#E52320", fontWeight: 700 }}
        >
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Estás seguro de eliminar al usuario{" "}
            <span style={{ fontWeight: "bold" }}>
              "{users.find((user: User) => user.uid === userToDelete)?.name}"
            </span>
            ? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteModalOpen(false)}
            sx={{
              color: "#E52320",
              borderColor: "#E52320",
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
            onClick={handleDelete}
            sx={{
              backgroundColor: "#E52320",
              color: "white",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#c21e1b",
                boxShadow: "none",
              },
            }}
            variant="contained"
            disabled={loading}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ maxWidth: "90%", margin: "0 auto", mb: 3, mt: 5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#1D1D1B" }}
          >
            Gestión de Usuarios
          </Typography>

          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Buscar"
              value={searchTerm}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(event.target.value)
              }
              size="small"
              sx={{ width: 200 }}
              InputProps={{
                endAdornment: (
                  <Search sx={{ color: "#666", fontSize: "1.2rem" }} />
                ),
                sx: {
                  fontSize: "0.875rem",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#E52320",
                  },
                },
              }}
            />

            <Button
              onClick={() => setIsCreating(true)}
              variant="contained"
              disabled={loading}
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
            >
              Crear Usuario
            </Button>
          </Box>
        </Box>
      </Box>

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
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            maxHeight: 300,
            minWidth: 250,
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, fontWeight: 600, color: "#1D1D1B" }}
          >
            Permisos efectivos
          </Typography>
          <List dense>
            {selectedUserPermissions.length > 0 ? (
              selectedUserPermissions.map((permission, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={permission}
                    primaryTypographyProps={{
                      variant: "body2",
                      sx: { fontSize: "0.875rem" },
                    }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="Sin permisos asignados"
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: { fontSize: "0.875rem", color: "text.secondary" },
                  }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Popover>

      <Menu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={closeActions}
      >
        {selectedUserForActions && (
          <MenuItem
            onClick={() => {
              setEditingUser(selectedUserForActions);
              closeActions();
            }}
          >
            Editar
          </MenuItem>
        )}
        {selectedUserForActions && (
          <MenuItem
            onClick={() => {
              confirmDelete(selectedUserForActions.uid);
              closeActions();
            }}
            sx={{ color: "error.main" }}
          >
            Eliminar
          </MenuItem>
        )}
      </Menu>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 0,
          maxWidth: "90%",
          margin: "0 auto",
        }}
      >
        <Table
          size="small"
          sx={{
            "& .MuiTableRow-root": {
              "& .MuiTableCell-root": {
                borderBottom: "1px solid rgba(0, 0, 0, 0.3)",
                height: "56px",
              },
            },
          }}
        >
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>Roles</TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Scopes Adicionales
              </TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Permisos Efectivos
              </TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.uid} hover>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {getRoleNames(user.roles).map((name) => (
                        <Chip
                          key={name}
                          label={name}
                          size="small"
                          sx={{
                            backgroundColor: "#e3f2fd",
                            color: "#1976d2",
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {getScopeNames(user.customScopes).map((name) => (
                        <Chip
                          key={name}
                          label={name}
                          size="small"
                          sx={{
                            backgroundColor: "#f3e5f5",
                            color: "#7b1fa2",
                            fontSize: "0.75rem",
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ExpandMore sx={{ fontSize: "1rem" }} />
                          {`${Array.isArray(userPermissions[user.uid]) ? userPermissions[user.uid].length : 0} permisos`}
                        </Box>
                      }
                      size="small"
                      onClick={(event: React.MouseEvent<HTMLDivElement>) =>
                        handlePermissionsClick(event, user.uid)
                      }
                      sx={{
                        backgroundColor: "#e8f5e8",
                        color: "#2e7d32",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#d4edda",
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <IconButton
                      size="small"
                      onClick={(event: React.MouseEvent<HTMLElement>) => {
                        event.stopPropagation();
                        openActions(event, user);
                      }}
                      disabled={loading}
                    >
                      <MoreHoriz />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? "No se encontraron usuarios con ese término de búsqueda"
                      : "No hay usuarios disponibles"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserList;
