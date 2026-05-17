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
import type { Company } from "../models/company";
import { useCompanies, useDeleteCompany } from "../stores/useCompaniesStore";
import CompanyFormDialog from "./CompanyFormDialog";

const CompaniesList = () => {
  const { data: companies, isLoading } = useCompanies();
  const { mutateAsync: del, isPending: isDeleting } = useDeleteCompany();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Eliminar empresa"
        description={`¿Eliminar "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        confirmDisabled={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await del(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
      <CompanyFormDialog
        open={open}
        company={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
      <PageHeader
        title="Empresas"
        subtitle="Administra las empresas operadoras de transporte."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setOpen(true)}
          >
            Agregar empresa
          </Button>
        }
      />
      <DataTable
        columns={[
          "NIT",
          "Nombre",
          "Dirección",
          "Teléfono",
          "Estado",
          "Acciones",
        ]}
        hasData={!!companies?.length}
        emptyMessage={
          isLoading ? "Cargando..." : "No hay empresas registradas."
        }
        colSpan={6}
      >
        {companies?.map((c: Company) => (
          <TableRow key={c.id} hover>
            <TableCell sx={{ fontWeight: 700 }}>{c.nit}</TableCell>
            <TableCell>{c.nombre}</TableCell>
            <TableCell>{c.direccion ?? "—"}</TableCell>
            <TableCell>{c.telefono ?? "—"}</TableCell>
            <TableCell>
              <Chip
                label={c.activa !== false ? "Activa" : "Inactiva"}
                color={c.activa !== false ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(c)}
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

export default CompaniesList;
