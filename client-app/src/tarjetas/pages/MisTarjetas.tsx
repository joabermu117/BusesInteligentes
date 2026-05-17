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
import { getAuthUserId } from "../../config/httpClient";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import { formatCurrency } from "../../shared/utils/format";
import type { Tarjeta } from "../models/tarjeta";
import {
  useDeleteTarjeta,
  useTarjetasByCitizen,
} from "../stores/useTarjetasStore";
import TarjetaFormDialog from "./TarjetaFormDialog";

const MisTarjetas = () => {
  const citizenId = getAuthUserId() ?? "";
  const { data: tarjetas, isLoading } = useTarjetasByCitizen(citizenId);
  const { mutateAsync: deleteTarjeta, isPending: isDeleting } =
    useDeleteTarjeta();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarjeta, setEditingTarjeta] = useState<Tarjeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tarjeta | null>(null);

  const handleEdit = (tarjeta: Tarjeta) => {
    setEditingTarjeta(tarjeta);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTarjeta(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTarjeta(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar tarjeta"
        description={`¿Estás seguro de eliminar esta tarjeta?`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <TarjetaFormDialog
        open={isFormOpen}
        tarjeta={editingTarjeta}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Mis tarjetas"
        subtitle="Administra tus métodos de pago vinculados."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Vincular tarjeta
          </Button>
        }
      />

      <DataTable
        columns={[
          "Método",
          "Número",
          "Titular",
          "Vencimiento",
          "Saldo",
          "Preferida",
          "Estado",
          "Acciones",
        ]}
        hasData={!!tarjetas && tarjetas.length > 0}
        emptyMessage={
          isLoading ? "Cargando tarjetas..." : "No tienes tarjetas vinculadas."
        }
        colSpan={8}
      >
        {tarjetas?.map((t) => (
          <TableRow key={t.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>
              {t.paymentMethod?.name ?? "—"}
            </TableCell>
            <TableCell>
              {t.cardNumber ? `****${t.cardNumber.slice(-4)}` : "—"}
            </TableCell>
            <TableCell>{t.cardHolder ?? "—"}</TableCell>
            <TableCell>
              {t.expirationDate
                ? new Date(t.expirationDate).toLocaleDateString("es-PE", {
                    month: "2-digit",
                    year: "2-digit",
                  })
                : "—"}
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>
              {formatCurrency(t.balance ?? 0)}
            </TableCell>
            <TableCell>
              <Chip
                label={t.isDefault ? "Sí" : "No"}
                color={t.isDefault ? "primary" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Chip
                label={t.isActive ? "Activa" : "Inactiva"}
                color={t.isActive ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(t)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(t)}
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

export default MisTarjetas;
