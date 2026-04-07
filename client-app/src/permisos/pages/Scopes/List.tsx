import { Box, Button, Chip, TableCell, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import ConfirmActionDialog from "../../common/components/ConfirmActionDialog";
import DataTable from "../../common/components/DataTable";
import PageHeader from "../../common/components/PageHeader";
import TextActionButton from "../../common/components/TextActionButton";
import Loader from "../../common/loader";
import type { Scope } from "../../models/Scope";
import { useScopeStore } from "../../stores/useScopeStore";
import { ScopeFormModal } from "./Form";

const ScopesTable = () => {
  const scopeStore = useScopeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scopeToDelete, setScopeToDelete] = useState<string | null>(null);

  const handleCreate = async (values: Partial<Scope>) => {
    await scopeStore.createScope(values as Omit<Scope, "key" | "deprecated">);
    setIsCreating(false);
  };

  const handleUpdate = async (values: Partial<Scope>) => {
    if (!values.key) {
      return;
    }
    await scopeStore.updateScope(values.key, values);
    setEditingScope(null);
  };

  const confirmDelete = (key: string) => {
    setScopeToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!scopeToDelete) {
      return;
    }
    await scopeStore.deleteScope(scopeToDelete);
    setIsDeleteModalOpen(false);
    setScopeToDelete(null);
  };

  const toggleDeprecated = async (key: string) => {
    await scopeStore.toggleDeprecatedStatus(key);
  };

  if (scopeStore.loading && scopeStore.scopes.length === 0) {
    return <Loader message="Cargando paraderos y cobertura..." />;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={isDeleteModalOpen}
        title="Confirmar eliminacion"
        description={`Estas seguro de eliminar el permiso "${scopeToDelete ?? ""}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={scopeStore.loading}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PageHeader
        title="Paraderos"
        subtitle="Configura paraderos por ruta y controla su estado operativo."
        actions={
          <Button onClick={() => setIsCreating(true)} variant="contained" disabled={scopeStore.loading}>
            Crear paradero
          </Button>
        }
      />

      <ScopeFormModal
        isOpen={isCreating}
        mode="create"
        initialData={{ name: "", description: "" }}
        onCancel={() => setIsCreating(false)}
        onSubmit={handleCreate}
        isLoading={scopeStore.loading}
      />

      <ScopeFormModal
        isOpen={!!editingScope}
        mode="edit"
        initialData={editingScope || undefined}
        onCancel={() => setEditingScope(null)}
        onSubmit={handleUpdate}
        isLoading={scopeStore.loading}
      />

      <DataTable
        columns={["Nombre", "Descripcion", "Estado", "Acciones"]}
        hasData={scopeStore.scopes.length > 0}
        emptyMessage="No hay paraderos disponibles"
      >
        {scopeStore.scopes.map((scope) => (
          <TableRow key={scope.key} hover>
            <TableCell>{scope.name}</TableCell>
            <TableCell>{scope.description}</TableCell>
            <TableCell>
              <Chip
                label={scope.deprecated ? "Obsoleto" : "Activo"}
                size="small"
                sx={{
                  backgroundColor: scope.deprecated ? "#ffebee" : "#e8f5e8",
                  color: scope.deprecated ? "#d32f2f" : "#1b5e20",
                }}
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={2}>
                <TextActionButton
                  label="Editar"
                  onClick={() => setEditingScope(scope)}
                  disabled={scopeStore.loading}
                />
                <TextActionButton
                  label="Eliminar"
                  onClick={() => confirmDelete(scope.key)}
                  disabled={scopeStore.loading}
                  color="error"
                />
                <TextActionButton
                  label={scope.deprecated ? "Activar" : "Desactivar"}
                  onClick={() => toggleDeprecated(scope.key)}
                  disabled={scopeStore.loading}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>

      {scopeStore.scopes.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            No hay permisos disponibles
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default ScopesTable;
