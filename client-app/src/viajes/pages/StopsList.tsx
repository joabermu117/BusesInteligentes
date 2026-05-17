import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Box,
  Button,
  Chip,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Stop } from "../models/stop";
import { useDeleteStop, useStops } from "../stores/useStopsStore";
import StopFormDialog from "./StopFormDialog";

const StopsList = () => {
  const { data: stops, isLoading } = useStops();
  const { mutateAsync: deleteStop, isPending: isDeleting } = useDeleteStop();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stop | null>(null);

  const handleEdit = (stop: Stop) => {
    setEditingStop(stop);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteStop(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStop(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar paradero"
        description={`¿Estás seguro de eliminar el paradero "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <StopFormDialog
        open={isFormOpen}
        stop={editingStop}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Paraderos"
        subtitle="Registra y administra los paraderos del sistema de transporte."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Registrar paradero
          </Button>
        }
      />

      <DataTable
        columns={[
          "Nombre",
          "Dirección",
          "Latitud",
          "Longitud",
          "Estado",
          "Acciones",
        ]}
        hasData={!!stops && stops.length > 0}
        emptyMessage={
          isLoading ? "Cargando paraderos..." : "No hay paraderos registrados."
        }
        colSpan={6}
      >
        {stops?.map((stop) => (
          <TableRow key={stop.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>{stop.name}</TableCell>
            <TableCell>{stop.address}</TableCell>
            <TableCell>{stop.latitude}</TableCell>
            <TableCell>{stop.longitude}</TableCell>
            <TableCell>
              <Chip
                label={stop.is_active ? "Activo" : "Inactivo"}
                color={stop.is_active ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(stop)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(stop)}
                  >
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </Box>
  );
};

export default StopsList;