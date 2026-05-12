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
import type { PaymentMethod } from "../models/paymentMethod";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
} from "../stores/usePaymentMethodsStore";
import PaymentMethodFormDialog from "./PaymentMethodFormDialog";

const PaymentMethodsList = () => {
  const { data: methods, isLoading } = usePaymentMethods();
  const { mutateAsync: deleteMethod, isPending: isDeleting } =
    useDeletePaymentMethod();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMethod(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMethod(null);
  };

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar método de pago"
        description={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <PaymentMethodFormDialog
        open={isFormOpen}
        method={editingMethod}
        onClose={handleFormClose}
      />

      <PageHeader
        title="Métodos de pago"
        subtitle="Administra los métodos de pago disponibles en el sistema."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setIsFormOpen(true)}
          >
            Agregar método
          </Button>
        }
      />

      <DataTable
        columns={["Nombre", "Descripción", "Estado", "Acciones"]}
        hasData={!!methods && methods.length > 0}
        emptyMessage={
          isLoading
            ? "Cargando métodos de pago..."
            : "No hay métodos de pago registrados."
        }
        colSpan={4}
      >
        {methods?.map((method) => (
          <TableRow key={method.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>{method.name}</TableCell>
            <TableCell>{method.description ?? "—"}</TableCell>
            <TableCell>
              <Chip
                label={method.isActive ? "Activo" : "Inactivo"}
                color={method.isActive ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(method)}>
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(method)}
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

export default PaymentMethodsList;
