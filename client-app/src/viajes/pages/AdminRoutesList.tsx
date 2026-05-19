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
import type { Ruta } from "../models/ruta";
import {
  useAdminRoutes,
  useDeleteRoute,
} from "../stores/useAdminRoutesStore";
import RouteFormDialog from "./RouteFormDialog";

const AdminRoutesList = () => {
  const { data: routes, isLoading } = useAdminRoutes();
  const { mutateAsync: deleteRoute, isPending: isDeleting } = useDeleteRoute();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Ruta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ruta | null>(null);

  const handleEdit = (route: Ruta) => {
    setEditingRoute(route);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRoute(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRoute(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar ruta"
        description={`¿Estás seguro de eliminar la ruta "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <RouteFormDialog
        open={isFormOpen}
        route={editingRoute}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Administración de rutas"
        subtitle="Crea y gestiona las rutas del sistema de transporte."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Crear ruta
          </Button>
        }
      />

      <DataTable
        columns={[
          "ID",
          "Nombre",
          "Origen",
          "Destino",
          "Distancia",
          "Duración",
          "Tarifa",
          "Paraderos",
          "Estado",
          "Acciones",
        ]}
        hasData={!!routes && routes.length > 0}
        emptyMessage={
          isLoading ? "Cargando rutas..." : "No hay rutas registradas."
        }
        colSpan={10}
      >
        {routes?.map((route) => (
          <TableRow key={route.id} hover>
            <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>#{route.id}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{route.name}</TableCell>
            <TableCell>{route.origin}</TableCell>
            <TableCell>{route.destination}</TableCell>
            <TableCell>{route.distance} km</TableCell>
            <TableCell>{route.estimated_duration} min</TableCell>
            <TableCell>${route.tarifa.toLocaleString("es-CO")}</TableCell>
            <TableCell>
              <Chip
                label={route.routeStops?.length ?? 0}
                size="small"
                variant="outlined"
              />
            </TableCell>
            <TableCell>
              <Chip
                label={route.is_active ? "Activa" : "Inactiva"}
                color={route.is_active ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(route)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(route)}
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

export default AdminRoutesList;