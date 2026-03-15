/**
 * Componente List.tsx - Gestión de Roles
 *
 * Este componente proporciona una interfaz para administrar roles:
 * - Visualización de roles en una tabla Material-UI
 * - Creación, edición y eliminación de roles
 * - Asignación de permisos (scopes) a roles
 * - Confirmación de acciones críticas
 * - Sistema de notificaciones para feedback al usuario
 *
 * Características principales:
 * - Tabla Material-UI con lista de roles
 * - Modales para formularios de creación/edición
 * - Modal de confirmación para eliminación
 * - Visualización de permisos como dropdown con nombres
 * - Estados de carga
 * - Estilo consistente con el resto de la aplicación
 */

import { ExpandMore } from "@mui/icons-material";
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
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Role } from "../../models/Role";
import { useRoleStore } from "../../stores/useRoleStore";
import { useScopeStore } from "../../stores/useScopeStore";
import RoleFormModal from "./Form";

/**
 * Componente principal RoleList
 *
 * Maneja la visualización y gestión de roles
 */
const RoleList = () => {
  // Store para manejo de roles
  const {
    roles, // Lista de roles
    loading, // Estado de carga
    fetchRoles, // Función para obtener roles
    createRole, // Función para crear rol
    updateRole, // Función para actualizar rol
    deleteRole, // Función para eliminar rol
  } = useRoleStore();

  // Store para manejo de scopes/permisos
  const { fetchScopes, scopes } = useScopeStore();

  // Estados locales del componente
  const [isCreating, setIsCreating] = useState(false); // Controla modal de creación
  const [editingRole, setEditingRole] = useState<Role | null>(null); // Rol en edición
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Controla modal de eliminación
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null); // Key del rol a eliminar
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null); // Elemento anchor para popover
  const [selectedRoleScopes, setSelectedRoleScopes] = useState<string[]>([]); // Scopes del rol seleccionado
  /**
   * Efecto para cargar datos iniciales
   * Se ejecuta al montar el componente
   */
  useEffect(() => {
    fetchRoles();
    fetchScopes();
  }, [fetchRoles, fetchScopes]);

  /**
   * Maneja la creación de un nuevo rol
   * @param roleData - Datos del nuevo rol (sin key)
   */
  const handleCreate = async (roleData: Omit<Role, "key">) => {
    await createRole(roleData);
    setIsCreating(false);
  };

  /**
   * Maneja la actualización de un rol existente
   * @param roleData - Datos del rol a actualizar
   */
  const handleUpdate = async (roleData: Role | Omit<Role, "key">) => {
    if ("key" in roleData) {
      await updateRole(roleData.key, roleData);
      setEditingRole(null);
    }
  };

  /**
   * Prepara la eliminación de un rol mostrando modal de confirmación
   * @param key - Key del rol a eliminar
   */
  const confirmDelete = (key: string) => {
    setRoleToDelete(key);
    setIsDeleteModalOpen(true);
  };

  /**
   * Ejecuta la eliminación del rol confirmada
   */
  const handleDelete = async () => {
    if (!roleToDelete) return;
    await deleteRole(roleToDelete);
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
  };

  /**
   * Maneja el click en el chip de scopes para mostrar el popover
   */
  const handleScopesClick = (
    event: React.MouseEvent<HTMLDivElement>,
    roleScopes: string[],
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoleScopes(roleScopes);
  };

  /**
   * Cierra el popover de scopes
   */
  const handleScopesClose = () => {
    setAnchorEl(null);
    setSelectedRoleScopes([]);
  };

  /**
   * Obtiene nombres de scopes a partir de sus keys
   * @param scopeKeys - Array de keys de scopes
   * @returns Array de nombres de scopes
   */
  const getScopeNames = (scopeKeys: string[]): string[] => {
    return scopeKeys
      .map((key) => scopes.find((s) => s.key === key)?.name || key)
      .filter(Boolean);
  };

  // Mostrar estado de carga mientras se obtienen los datos
  if (loading && roles.length === 0) {
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

  const open = Boolean(anchorEl);

  return (
    <Box>
      {/* Modal de Confirmación para Eliminación */}
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
            ¿Estás seguro de eliminar el rol{" "}
            <span style={{ fontWeight: "bold" }}>"{roleToDelete}"</span>? Esta
            acción no se puede deshacer.
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

      {/* Header con título y botón de creación */}
      <Box sx={{ maxWidth: "90%", margin: "0 auto", mb: 3, mt: 5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#1D1D1B" }}
          >
            Gestión de Roles
          </Typography>

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
            Crear Rol
          </Button>
        </Box>
      </Box>

      {/* Modal para creación de rol */}
      <RoleFormModal
        isOpen={isCreating}
        mode="create"
        availableScopes={scopes}
        onSubmit={handleCreate}
        onCancel={() => setIsCreating(false)}
      />

      {/* Modal para edición de rol */}
      <RoleFormModal
        isOpen={!!editingRole}
        mode="edit"
        role={editingRole || undefined}
        availableScopes={scopes}
        onSubmit={handleUpdate}
        onCancel={() => setEditingRole(null)}
      />

      {/* Popover para mostrar scopes */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleScopesClose}
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
            Permisos asignados
          </Typography>
          <List dense>
            {getScopeNames(selectedRoleScopes).length > 0 ? (
              getScopeNames(selectedRoleScopes).map((scopeName, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={scopeName}
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

      {/* Tabla de roles */}
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
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Descripción
              </TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Permisos / Scopes
              </TableCell>
              <TableCell sx={{ fontWeight: 600, height: 60 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.key} hover>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <ExpandMore sx={{ fontSize: "1rem" }} />
                          {`${role.scopes?.length || 0} permisos`}
                        </Box>
                      }
                      size="small"
                      onClick={(event) =>
                        handleScopesClick(event, role.scopes || [])
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
                    <Box display="flex" gap={2}>
                      <Button
                        onClick={() => setEditingRole(role)}
                        disabled={loading}
                        sx={{
                          color: "#E52320",
                          textDecoration: "underline",
                          textTransform: "none",
                          minWidth: "auto",
                          padding: 0,
                          fontSize: "0.875rem",
                          "&:hover": {
                            backgroundColor: "transparent",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        Editar
                      </Button>
                      {role.key !== "administrador" &&
                        role.key !== "metrologo" && (
                          <Button
                            onClick={() => confirmDelete(role.key)}
                            disabled={loading}
                            sx={{
                              color: "#E52320",
                              textDecoration: "underline",
                              textTransform: "none",
                              minWidth: "auto",
                              padding: 0,
                              fontSize: "0.875rem",
                              "&:hover": {
                                backgroundColor: "transparent",
                                textDecoration: "underline",
                              },
                            }}
                          >
                            Eliminar
                          </Button>
                        )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Mensaje cuando no hay roles
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay roles disponibles
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

export default RoleList;
