import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import { Box, Button, Chip, IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Shift } from "../../boletos/models/boletos";
import { useAllShifts, useDeleteShift } from "../stores/useAdminShiftsStore";
import ShiftFormDialog from "./ShiftFormDialog";

const STATUS_CONFIG: Record<string, { label: string; color: "success" | "warning" | "info" | "error" | "default" }> = {
  scheduled: { label: "Programado", color: "info" },
  in_progress: { label: "En curso", color: "success" },
  finished: { label: "Finalizado", color: "default" },
  cancelled: { label: "Cancelado", color: "error" },
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TurnosList = () => {
  const { data: shifts, isLoading } = useAllShifts();
  const { mutateAsync: deleteShift, isPending: isDeleting } = useDeleteShift();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteShift(deleteTarget.id!);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingShift(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar turno"
        description={`¿Estás seguro de eliminar este turno? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ShiftFormDialog
        open={isFormOpen}
        shift={editingShift}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Gestión de turnos"
        subtitle="Asigna y administra los turnos de conductores a buses."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Asignar turno
          </Button>
        }
      />

      <DataTable
        columns={[
          "Conductor",
          "Bus",
          "Inicio",
          "Fin",
          "Estado",
          "Observaciones",
          "Acciones",
        ]}
        hasData={!!shifts && shifts.length > 0}
        emptyMessage={isLoading ? "Cargando turnos..." : "No hay turnos registrados."}
        colSpan={7}
      >
        {shifts?.map((shift) => {
          const config = STATUS_CONFIG[shift.status] ?? {
            label: shift.status,
            color: "default" as const,
          };

          return (
            <TableRow key={shift.id} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonRounded sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {shift.driver?.name || (shift.driverUserId
                        ? `${shift.driverUserId.slice(0, 12)}...`
                        : "—")}
                    </Typography>
                    {shift.driver?.licenseNumber && (
                      <Typography variant="caption" color="text.secondary">
                        Lic. {shift.driver.licenseNumber}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </TableCell>
              <TableCell>
                <Chip
                  label={shift.bus?.plate ?? "—"}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>{formatDate(shift.startTime)}</TableCell>
              <TableCell>{formatDate(shift.endTime)}</TableCell>
              <TableCell>
                <Chip
                  label={config.label}
                  color={config.color}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Box
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {shift.observations ?? "—"}
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => handleEdit(shift)}>
                      <EditRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(shift)}
                    >
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </DataTable>
    </Box>
  );
};

export default TurnosList;
