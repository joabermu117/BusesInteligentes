/**
 * Componente List.tsx - Tabla de Scopes/Permisos
 *
 * Este componente proporciona una interfaz para administrar scopes/permisos:
 * - Visualización de scopes agrupados por categoría
 * - Creación, edición y eliminación de scopes
 * - Filtrado por categoría
 * - Cambio de estado (activo/obsoleto)
 * - Funcionalidad de colapsar/expandir categorías
 *
 * Características principales:
 * - Agrupación automática por categoría
 * - Soporte para marcar scopes como obsoletos
 * - Filtrado interactivo por categoría
 * - Modales para creación/edición con Material-UI
 * - Confirmación para eliminación
 * - Categorías colapsables
 */

import { ExpandLess, ExpandMore, KeyboardArrowDown } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { Scope } from "../../models/Scope";
import type { ScopeCategory } from "../../models/ScopeCategory";
import { useCategoryStore } from "../../stores/useScopeCategoryStore";
import { useScopeStore } from "../../stores/useScopeStore";
import { ScopeFormModal } from "./Form";

/**
 * Componente principal ScopesTable
 *
 * Maneja la visualización y gestión de scopes agrupados por categoría
 */
const ScopesTable = () => {
  // Stores para manejo de estado global
  const scopeStore = useScopeStore(); // Store para scopes
  const categoryStore = useCategoryStore(); // Store para categorías

  // Estados locales del componente
  const [isCreating, setIsCreating] = useState(false); // Controla modal de creación
  const [editingScope, setEditingScope] = useState<Scope | null>(null); // Scope en edición
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Controla modal de eliminación
  const [scopeToDelete, setScopeToDelete] = useState<string | null>(null); // Key del scope a eliminar
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Categoría seleccionada para filtrado
  const [showCategoryFilter, setShowCategoryFilter] = useState(false); // Controla visibilidad del filtro
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  ); // Categorías expandidas

  const handleCreate = async (values: Partial<Scope>) => {
    await scopeStore.createScope(
      values as Omit<Scope, "key" | "deprecated" | "categoryName">,
    );
    setIsCreating(false);
  };

  /**
   * Maneja la actualización de un scope existente
   * @param values - Datos actualizados del scope
   */
  const handleUpdate = async (values: Partial<Scope>) => {
    if (!values.key) return;
    await scopeStore.updateScope(values.key, values);
    setEditingScope(null);
  };

  /**
   * Ejecuta la eliminación de un scope confirmada
   */
  const handleDelete = async () => {
    if (!scopeToDelete) return;
    await scopeStore.deleteScope(scopeToDelete);
    setIsDeleteModalOpen(false);
    setScopeToDelete(null);
  };

  /**
   * Cambia el estado deprecated de un scope
   * @param key - Key del scope a modificar
   */
  const toggleDeprecated = async (key: string) => {
    await scopeStore.toggleDeprecatedStatus(key);
  };

  // Mostrar estado de carga mientras se obtienen los datos
  if (scopeStore.loading && scopeStore.scopes.length === 0) {
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
      {/* Modal de confirmación para eliminar scope */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => !scopeStore.loading && setIsDeleteModalOpen(false)}
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
            ¿Estás seguro de eliminar el scope{" "}
            <span style={{ fontWeight: "bold" }}>"{scopeToDelete}"</span>? Esta
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
            disabled={scopeStore.loading}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Barra de herramientas */}
      <Box sx={{ maxWidth: "90%", margin: "0 auto", mb: 3, mt: 5 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box sx={{ ml: 0 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#1D1D1B", mb: 2 }}
            >
              Gestión de permisos
            </Typography>

            {/* Filtro por categoría */}
            <Box sx={{ position: "relative" }}>
              <Button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                sx={{
                  backgroundColor: "transparent",
                  color: "#E52320",
                  textTransform: "none",
                  fontWeight: 500,
                  border: "none",
                  padding: "4px 8px",
                  minWidth: "auto",
                  ml: 0,
                  "&:hover": {
                    backgroundColor: "transparent",
                    textDecoration: "underline",
                  },
                  "& .MuiButton-endIcon": {
                    marginLeft: "4px",
                  },
                }}
              >
                {<KeyboardArrowDown />} Categorías
              </Button>

              {/* Menú desplegable de categorías */}
              {showCategoryFilter && (
                <Paper
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 10,
                    minWidth: 220,
                    maxHeight: 200,
                    mt: 1,
                    boxShadow: 3,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": {
                        width: "6px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#f1f1f1",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#c1c1c1",
                        borderRadius: "3px",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        background: "#a1a1a1",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        cursor: "pointer",
                        borderRadius: 0,
                        backgroundColor: !selectedCategory
                          ? "#E3F2FD"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: !selectedCategory
                            ? "#E3F2FD"
                            : "#f5f5f5",
                        },
                      }}
                      onClick={() => {
                        setSelectedCategory("");
                        setShowCategoryFilter(false);
                      }}
                    >
                      Todas las categorías
                    </Box>
                    {categoryStore.categories.map((category: ScopeCategory) => (
                      <Box
                        key={category.id}
                        sx={{
                          px: 2,
                          py: 1,
                          cursor: "pointer",
                          borderRadius: 0,
                          backgroundColor:
                            selectedCategory === category.name
                              ? "#E3F2FD"
                              : "transparent",
                          "&:hover": {
                            backgroundColor:
                              selectedCategory === category.name
                                ? "#E3F2FD"
                                : "#f5f5f5",
                          },
                        }}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setShowCategoryFilter(false);
                        }}
                      >
                        {category.name}
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            {/* Botón para crear nuevo scope 
            {canCreateScope && (
              <Button
                onClick={() => setIsCreating(true)}
                variant="contained"
                disabled={scopeStore.loading}
                sx={{
                  backgroundColor: '#E52320',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#c21e1b',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  },
                }}
              >
                Crear Scope
              </Button>
              
            )}
              */}
          </Box>
        </Box>
      </Box>

      {/* Modales de formulario */}
      <ScopeFormModal
        isOpen={isCreating}
        mode="create"
        initialData={{ name: "", description: "", categoryId: "" }}
        categories={categoryStore.categories}
        onCancel={() => setIsCreating(false)}
        onSubmit={handleCreate}
        isLoading={scopeStore.loading}
      />

      <ScopeFormModal
        isOpen={!!editingScope}
        mode="edit"
        initialData={editingScope || undefined}
        categories={categoryStore.categories}
        onCancel={() => setEditingScope(null)}
        onSubmit={handleUpdate}
        isLoading={scopeStore.loading}
      />

      {/* Tabla de scopes agrupados por categoría */}
      <Box sx={{ maxWidth: "90%", margin: "0 auto" }}>
        {Object.entries(groupedScopes).map(([category, scopesInCategory]) => (
          <Box key={category} sx={{ mb: 3 }}>
            {/* Header de categoría con botón de colapsar/expandir */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: "4px 4px 0 0",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#eeeeee" },
              }}
              onClick={() => toggleCategory(category)}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#1D1D1B" }}
              >
                {category}
              </Typography>
              <IconButton size="small">
                {expandedCategories.has(category) ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )}
              </IconButton>
            </Box>

            {/* Tabla de scopes */}
            <Collapse in={expandedCategories.has(category)}>
              <TableContainer
                component={Paper}
                sx={{ boxShadow: 0, borderRadius: "0 0 4px 4px" }}
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
                      <TableCell sx={{ fontWeight: 600, height: 60 }}>
                        Nombre
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, height: 60 }}>
                        Descripción
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, height: 60 }}>
                        Estado
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, height: 60 }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scopesInCategory.map((scope) => (
                      <TableRow
                        key={scope.key}
                        hover
                        sx={{
                          backgroundColor: scope.deprecated
                            ? "#f9f9f9"
                            : "transparent",
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {scope.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {scope.description}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {scope.deprecated ? (
                            <Chip
                              label="Obsoleto"
                              size="small"
                              icon={
                                <span
                                  style={{
                                    fontSize: "14px",
                                    marginRight: "2px",
                                  }}
                                >
                                  ✕
                                </span>
                              }
                              sx={{
                                backgroundColor: "#ffebee",
                                color: "#d32f2f",
                                "& .MuiChip-icon": {
                                  color: "#d32f2f",
                                  marginLeft: "8px",
                                  marginRight: "4px",
                                },
                              }}
                            />
                          ) : (
                            <Chip
                              label="Activo"
                              size="small"
                              icon={
                                <span
                                  style={{
                                    fontSize: "14px",
                                    marginRight: "2px",
                                  }}
                                >
                                  ✓
                                </span>
                              }
                              sx={{
                                backgroundColor: "#e8f5e8",
                                color: "#1b5e20",
                                "& .MuiChip-icon": {
                                  color: "#1b5e20",
                                  marginLeft: "8px",
                                  marginRight: "4px",
                                },
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" gap={2}>
                            {/* Botón de editar 
                            {canUpdateScope && (
                              <Button
                                onClick={() => setEditingScope(scope)}
                                disabled={scopeStore.loading}
                                sx={{
                                  color: '#E52320',
                                  textDecoration: 'underline',
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  padding: 0,
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    backgroundColor: 'transparent',
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                Editar
                              </Button>
                            )}*/}
                            {/* Botón de eliminación 
                            {canDeleteScope && (
                              <Button
                                onClick={() => confirmDelete(scope.key)}
                                disabled={scopeStore.loading}
                                sx={{
                                  color: '#E52320',
                                  textDecoration: 'underline',
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  padding: 0,
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    backgroundColor: 'transparent',
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                Eliminar
                              </Button>
                            )}*/}
                            {/* Botón para cambiar estado */}
                            <Button
                              onClick={() => toggleDeprecated(scope.key)}
                              disabled={scopeStore.loading}
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
                              {scope.deprecated ? "Activar" : "Desactivar"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        ))}

        {Object.keys(groupedScopes).length === 0 && (
          <Box textAlign="center" py={6}>
            <Typography variant="body1" color="text.secondary">
              No hay permisos disponibles
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ScopesTable;
