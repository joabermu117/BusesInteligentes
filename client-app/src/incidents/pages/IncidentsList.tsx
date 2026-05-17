import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Incident, IncidentStatus, IncidentType } from "../models/incident";
import {
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_TYPE_LABELS,
  INCIDENT_TYPE_OPTIONS,
} from "../models/incident";
import {
  useDeleteIncident,
  useIncidents,
} from "../stores/useIncidentsStore";
import IncidentFormDialog from "./IncidentFormDialog";
import UpdateIncidentDialog from "./UpdateIncidentDialog";

const IncidentsList = () => {
  const { data: incidents, isLoading } = useIncidents();
  const { mutateAsync: deleteIncident, isPending: isDeleting } =
    useDeleteIncident();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);
  const [filterType, setFilterType] = useState<IncidentType | "">("");
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | "">("");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteIncident(deleteTarget.id);
    setDeleteTarget(null);
  };

  const filtered = incidents?.filter((inc) => {
    if (filterType && inc.type !== filterType) return false;
    if (filterStatus && inc.status !== filterStatus) return false;
    return true;
  });

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar incidente"
        description={`¿Estás seguro de eliminar este incidente? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <IncidentFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {editingIncident && (
        <UpdateIncidentDialog
          open={!!editingIncident}
          incident={editingIncident}
          onClose={() => setEditingIncident(null)}
        />
      )}

      <PageHeader
        title="Incidentes"
        subtitle="Consulta y gestiona los incidentes reportados durante la operación."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Reportar incidente
          </Button>
        }
      />

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Filtrar por tipo"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as IncidentType | "")}
          select
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {INCIDENT_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Filtrar por estado"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as IncidentStatus | "")
          }
          select
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {INCIDENT_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={[
          "Tipo",
          "Gravedad",
          "Estado",
          "Bus",
          "Descripción",
          "Fecha reporte",
          "Acciones",
        ]}
        hasData={!!filtered && filtered.length > 0}
        emptyMessage={
          isLoading ? "Cargando incidentes..." : "No hay incidentes registrados."
        }
        colSpan={7}
      >
        {filtered?.map((incident) => (
          <TableRow key={incident.id} hover>
            <TableCell>
              {INCIDENT_TYPE_LABELS[incident.type]}
            </TableCell>
            <TableCell>
              <Chip
                label={INCIDENT_SEVERITY_LABELS[incident.severity]}
                color={INCIDENT_SEVERITY_COLORS[incident.severity]}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Chip
                label={INCIDENT_STATUS_LABELS[incident.status]}
                color={INCIDENT_STATUS_COLORS[incident.status]}
                size="small"
              />
            </TableCell>
            <TableCell>
              {incident.incidentBuses?.[0]?.bus?.plate ?? "—"}
            </TableCell>
            <TableCell sx={{ maxWidth: 200 }}>
              {incident.description ?? "—"}
            </TableCell>
            <TableCell>
              {incident.reportedAt
                ? new Date(incident.reportedAt).toLocaleDateString("es-CO")
                : "—"}
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Ver incidentes del bus">
                  <IconButton
                    size="small"
                    onClick={() => {
                      const busId = incident.incidentBuses?.[0]?.bus?.id;
                      if (busId) navigate(`/incidentes/bus/${busId}`);
                    }}
                  >
                    <VisibilityRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => setEditingIncident(incident)}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(incident)}
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

export default IncidentsList;