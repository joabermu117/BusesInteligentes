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
import { useSnackbar } from "notistack";
import { useState } from "react";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { Schedule } from "../models/schedule";
import {
  SCHEDULE_RECURRENCE_LABELS,
  SCHEDULE_STATUS_COLORS,
  SCHEDULE_STATUS_LABELS,
} from "../models/schedule";
import {
  useDeleteSchedule,
  useSchedules,
} from "../stores/useSchedulesStore";
import ScheduleFormDialog from "./ScheduleFormDialog";

const SchedulesList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: schedules, isLoading } = useSchedules();
  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeleteSchedule();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedule(deleteTarget.id);
      enqueueSnackbar("Programación eliminada correctamente.", {
        variant: "success",
      });
    } catch (e: unknown) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al eliminar la programación"),
        { variant: "error" },
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar programación"
        description="¿Estás seguro de eliminar esta programación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ScheduleFormDialog
        open={isFormOpen}
        schedule={editingSchedule}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Programaciones de ruta"
        subtitle="Asigna buses a rutas con fecha y hora de salida."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Crear programación
          </Button>
        }
      />

      <DataTable
        columns={[
          "Bus",
          "Empresa",
          "Ruta",
          "Fecha/Hora salida",
          "Tolerancia",
          "Recurrencia",
          "Estado",
          "Acciones",
        ]}
        hasData={!!schedules && schedules.length > 0}
        emptyMessage={
          isLoading
            ? "Cargando programaciones..."
            : "No hay programaciones registradas."
        }
        colSpan={8}
      >
        {schedules?.map((schedule) => (
          <TableRow key={schedule.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>
              {schedule.bus?.plate ?? "—"}
            </TableCell>
            <TableCell>
              {schedule.bus?.company?.nombre ?? "—"}
            </TableCell>
            <TableCell>
              {schedule.route
                ? `${schedule.route.name} (${schedule.route.origin} → ${schedule.route.destination})`
                : `#${schedule.routeId}`}
            </TableCell>
            <TableCell>
              {new Date(schedule.departureTime).toLocaleString("es-CO")}
            </TableCell>
            <TableCell>
              {schedule.toleranceMinutes != null
                ? `± ${schedule.toleranceMinutes} min`
                : "—"}
            </TableCell>
            <TableCell>
              {SCHEDULE_RECURRENCE_LABELS[schedule.recurrence]}
            </TableCell>
            <TableCell>
              <Chip
                label={SCHEDULE_STATUS_LABELS[schedule.status]}
                color={SCHEDULE_STATUS_COLORS[schedule.status]}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(schedule)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(schedule)}
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

export default SchedulesList;