import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
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
import { useNavigate } from "react-router-dom";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { Group } from "../models/group";
import { useDeleteGroup, useGroups } from "../stores/useGroupsStore";
import GrupoFormDialog from "./GrupoFormDialog";

const AdminGruposList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const { mutateAsync: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGroup(deleteTarget.id);
      enqueueSnackbar("Grupo eliminado correctamente.", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al eliminar el grupo"), {
        variant: "error",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingGroup(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar grupo"
        description={`¿Estás seguro de eliminar el grupo "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <GrupoFormDialog
        open={isFormOpen}
        group={editingGroup}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Gestión de grupos"
        subtitle="Crea y administra los grupos del sistema."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Crear grupo
          </Button>
        }
      />

      <DataTable
        columns={[
          "Nombre",
          "Descripción",
          "Visibilidad",
          "Miembros",
          "Creado por",
          "Acciones",
        ]}
        hasData={!!groups && groups.length > 0}
        emptyMessage={
          isLoading ? "Cargando grupos..." : "No hay grupos registrados."
        }
        colSpan={6}
      >
        {groups?.map((group) => (
          <TableRow
            key={group.id}
            hover
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/grupos/admin/${group.id}`)}
          >
            <TableCell sx={{ fontWeight: 700 }}>{group.name}</TableCell>
            <TableCell
              sx={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {group.description ?? "—"}
            </TableCell>
            <TableCell>
              <Chip
                label={group.is_public ? "Público" : "Privado"}
                size="small"
                color={group.is_public ? "success" : "default"}
                variant="outlined"
              />
            </TableCell>
            <TableCell>
              <Chip
                icon={<PeopleRounded sx={{ fontSize: 14 }} />}
                label={group.groupPersons?.length ?? 0}
                size="small"
                variant="outlined"
              />
            </TableCell>
            <TableCell>{group.created_by?.name ?? group.created_by_person_id ?? "—"}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(group)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(group)}
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

export default AdminGruposList;