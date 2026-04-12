import { Box, Button, TableCell, TableRow } from "@mui/material";
import { useState } from "react";
import ConfirmActionDialog from "../../common/components/ConfirmActionDialog";
import DataTable from "../../common/components/DataTable";
import PageHeader from "../../common/components/PageHeader";
import TextActionButton from "../../common/components/TextActionButton";
import Loader from "../../common/loader";
import type { Scope } from "../../models/Scope";
import { useScopeStore } from "../../stores/useScopeStore";
// import { CargaMasivaButton } from "../../utils/autocrear";
import { ScopeFormModal } from "./Form";

const ScopesTable = () => {
  const scopeStore = useScopeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingScope, setEditingScope] = useState<Scope | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scopeToDelete, setScopeToDelete] = useState<string | null>(null);

  const handleCreate = async (values: Partial<Scope>) => {
    await scopeStore.createScope(values as Omit<Scope, "id">);
    setIsCreating(false);
  };

  const handleUpdate = async (values: Partial<Scope>) => {
    if (!values.id) {
      return;
    }

    await scopeStore.updateScope(values.id, values);
    setEditingScope(null);
  };

  const confirmDelete = (id: string) => {
    setScopeToDelete(id);
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

  if (scopeStore.isInitialLoading && scopeStore.scopes.length === 0) {
    return <Loader message="Cargando permisos del sistema..." />;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={isDeleteModalOpen}
        title="Confirmar eliminacion"
        description={`Estas seguro de eliminar el permiso "${scopeToDelete ?? ""}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={scopeStore.isMutating}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <PageHeader
        title="Permisos"
        subtitle="Administra el catalogo de permisos operativos del sistema."
        actions={
          <Box display="flex" gap={1.5} flexWrap="wrap">
            {/* <CargaMasivaButton /> */}
            <Button
              onClick={() => setIsCreating(true)}
              variant="contained"
              disabled={scopeStore.isMutating}
            >
              Crear permiso
            </Button>
          </Box>
        }
      />

      <ScopeFormModal
        isOpen={isCreating}
        mode="create"
        initialData={{ url: "", method: "GET", model: "" }}
        onCancel={() => setIsCreating(false)}
        onSubmit={handleCreate}
        isLoading={scopeStore.isMutating}
      />

      <ScopeFormModal
        isOpen={!!editingScope}
        mode="edit"
        initialData={editingScope || undefined}
        onCancel={() => setEditingScope(null)}
        onSubmit={handleUpdate}
        isLoading={scopeStore.isMutating}
      />

      <DataTable
        columns={["URL", "Metodo", "Modelo", "Acciones"]}
        hasData={scopeStore.scopes.length > 0}
        emptyMessage="No hay permisos disponibles"
      >
        {scopeStore.scopes.map((scope) => (
          <TableRow key={scope.id} hover>
            <TableCell>{scope.url}</TableCell>
            <TableCell>{scope.method}</TableCell>
            <TableCell>{scope.model}</TableCell>
            <TableCell>
              <Box display="flex" gap={2}>
                <TextActionButton
                  label="Editar"
                  onClick={() => setEditingScope(scope)}
                  disabled={scopeStore.isMutating}
                />
                <TextActionButton
                  label="Eliminar"
                  onClick={() => confirmDelete(scope.id)}
                  disabled={scopeStore.isMutating}
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

export default ScopesTable;
