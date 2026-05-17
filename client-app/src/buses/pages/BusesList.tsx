import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Bus } from "../models/bus";
import { BUS_STATUS_LABELS } from "../models/bus";
import { useBuses, useDeleteBus } from "../stores/useBusesStore";
import BusFormDialog from "./BusFormDialog";

const BUS_STATUS_COLORS: Record<string, "success" | "warning" | "error"> = {
  operative: "success",
  maintenance: "warning",
  out_of_service: "error",
};

const BusesList = () => {
  const navigate = useNavigate();
  const { data: buses, isLoading } = useBuses();
  const { mutateAsync: deleteBus, isPending: isDeleting } = useDeleteBus();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bus | null>(null);

  const handleEdit = (bus: Bus) => {
    setEditingBus(bus);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBus(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBus(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar bus"
        description={`¿Estás seguro de eliminar el bus con placa "${deleteTarget?.plate}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <BusFormDialog
        open={isFormOpen}
        bus={editingBus}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Flota de buses"
        subtitle="Registra, edita y administra los buses de tu flota."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Registrar bus
          </Button>
        }
      />

      <DataTable
        columns={[
          "Placa",
          "Modelo",
          "Año",
          "Capacidad total",
          "Sentados",
          "Parados",
          "Estado",
          "Empresa",
          "Acciones",
        ]}
        hasData={!!buses && buses.length > 0}
        emptyMessage={
          isLoading ? "Cargando buses..." : "No hay buses registrados."
        }
        colSpan={9}
      >
        {buses?.map((bus) => (
          <TableRow key={bus.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>
              <Link
                component="button"
                variant="body2"
                fontWeight={700}
                onClick={() => navigate(`/buses/${bus.id}`)}
                underline="hover"
                sx={{ cursor: "pointer" }}
              >
                {bus.plate}
              </Link>
            </TableCell>
            <TableCell>{bus.model}</TableCell>
            <TableCell>{bus.year}</TableCell>
            <TableCell>{bus.totalCapacity}</TableCell>
            <TableCell>{bus.seatedCapacity ?? "—"}</TableCell>
            <TableCell>{bus.standingCapacity ?? "—"}</TableCell>
            <TableCell>
              <Chip
                label={BUS_STATUS_LABELS[bus.status]}
                color={BUS_STATUS_COLORS[bus.status]}
                size="small"
              />
            </TableCell>
            <TableCell>
              {bus.company?.nombre
                ? `${bus.company.nombre} (${bus.company.nit ?? ""})`
                : "—"}
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(bus)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(bus)}
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

export default BusesList;
