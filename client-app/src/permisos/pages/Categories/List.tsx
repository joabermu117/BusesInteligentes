/**
 * Componente List.tsx - Gestión de Categorías
 *
 * Este componente proporciona una interfaz completa para administrar categorías de scopes/permisos:
 * - Visualización de categorías en formato de tabla Material-UI
 * - Creación, edición y eliminación de categorías
 * - Sistema de notificaciones para feedback al usuario
 * - Manejo de estados de carga y errores
 *
 * Características principales:
 * - Tabla Material-UI con lista de categorías
 * - Modales para formularios de creación/edición
 * - Modal de confirmación para eliminación
 * - Sistema de notificaciones temporales
 * - Estilo consistente con el resto de la aplicación
 */

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ScopeCategory } from "../../models/ScopeCategory";
import { useCategoryStore } from "../../stores/useScopeCategoryStore";
import { CategoryFormModal } from "./Form";

/**
 * Componente principal CategoriesTable
 *
 * Maneja la visualización y gestión de categorías de scopes
 */
const CategoriesTable = () => {
  // Store para manejo de categorías
  const {
    categories, // Lista de categorías
    loading, // Estado de carga
    fetchCategories, // Función para obtener categorías
    createCategory, // Función para crear categoría
    updateCategory, // Función para actualizar categoría
    deleteCategory, // Función para eliminar categoría
  } = useCategoryStore();

  // Estados locales para UI
  const [isCreating, setIsCreating] = useState(false); // Controla modal de creación
  const [editingCategory, setEditingCategory] = useState<ScopeCategory | null>(
    null,
  ); // Categoría en edición
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Controla modal de eliminación
  const [categoryToDelete, setCategoryToDelete] =
    useState<ScopeCategory | null>(null); // Categoría a eliminar
  /**
   * Efecto para cargar categorías al montar el componente
   */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Maneja la creación de una nueva categoría
   * @param values - Datos de la nueva categoría (sin ID)
   */
  const handleCreate = async (values: Omit<ScopeCategory, "id">) => {
    await createCategory(values);
    setIsCreating(false);
  };

  /**
   * Maneja la actualización de una categoría existente
   * @param values - Datos actualizados de la categoría
   */
  const handleUpdate = async (values: ScopeCategory) => {
    if (!values.id) return;
    await updateCategory(values.id, values);
    setEditingCategory(null);
  };

  /**
   * Maneja la eliminación de una categoría
   * @param id - ID de la categoría a eliminar
   */
  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  // Mostrar estado de carga mientras se obtienen los datos
  if (loading && categories.length === 0) {
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
            ¿Estás seguro de eliminar la categoría{" "}
            <span style={{ fontWeight: "bold" }}>
              "{categoryToDelete?.name}"
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
            onClick={() =>
              categoryToDelete?.id && handleDelete(categoryToDelete.id)
            }
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
            Gestión de categorías
          </Typography>

          <Box display="flex" gap={2}>
            {/*canCreateCategory && (
              <Button
                onClick={() => setIsCreating(true)}
                variant="contained"
                disabled={loading}
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
                Crear Categoría
              </Button>
            )*/}
          </Box>
        </Box>
      </Box>

      {/* Modal para creación de categoría */}
      <CategoryFormModal
        isOpen={isCreating}
        mode="create"
        initialData={{ name: "", description: "" }}
        onCancel={() => setIsCreating(false)}
        onSubmit={handleCreate}
        isLoading={loading}
      />

      {/* Modal para edición de categoría */}
      <CategoryFormModal
        isOpen={!!editingCategory}
        mode="edit"
        initialData={editingCategory || undefined}
        onCancel={() => setEditingCategory(null)}
        onSubmit={handleUpdate}
        isLoading={loading}
      />

      {/* Tabla de categorías */}
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
              {/*canManageCategoryActions && (
                <TableCell sx={{ fontWeight: 600, height: 60 }}>Acciones</TableCell>
              )*/}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {category.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </TableCell>
                  {/*  {canManageCategoryActions && (
                    <TableCell sx={{ py: 2 }}>
                      <Box display="flex" gap={2}>
                        Botón de edición 
                        {canUpdateCategory && (
                          <Button
                            onClick={() => setEditingCategory({ ...category })}
                            disabled={loading}
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
                        {canDeleteCategory && (
                          <Button
                            onClick={() => confirmDelete(category)}
                            disabled={loading}
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
                        )}}
                      </Box>
                    </TableCell>
                  )*/}
                </TableRow>
              ))
            ) : (
              // Mensaje cuando no hay categorías
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay categorías disponibles
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

export default CategoriesTable;
