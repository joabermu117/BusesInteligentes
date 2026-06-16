import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Pqrs, PqrsEstado, UpdatePqrsEstadoPayload } from "../models/pqrs";
import {
  PQRS_ESTADO_COLORS,
  PQRS_ESTADO_LABELS,
} from "../models/pqrs";
import { fetchAllPqrs, updatePqrsEstado } from "../services/pqrsService";

const ESTADO_OPTIONS: { value: PqrsEstado; label: string }[] = [
  { value: "en_revision", label: "En revisión" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto", label: "Resuelto" },
];

const AdminPqrsList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [pqrsList, setPqrsList] = useState<Pqrs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Pqrs | null>(null);
  const [estadoForm, setEstadoForm] = useState<UpdatePqrsEstadoPayload>({
    estado: "en_revision",
    respuesta: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const loadPqrs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllPqrs();
      setPqrsList(data);
    } catch {
      enqueueSnackbar("Error al cargar los PQRS", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPqrs(); }, []);

  const handleOpenDialog = (pqrs: Pqrs) => {
    setSelected(pqrs);
    setEstadoForm({
      estado: pqrs.estado === "recibido" ? "en_revision" : pqrs.estado,
      respuesta: pqrs.respuesta ?? "",
    });
  };

  const handleUpdateEstado = async () => {
    if (!selected) return;
    setIsUpdating(true);
    try {
      await updatePqrsEstado(selected.radicado, estadoForm);
      enqueueSnackbar("Estado actualizado. Se notificó al ciudadano.", {
        variant: "success",
      });
      setSelected(null);
      await loadPqrs();
    } catch {
      enqueueSnackbar("Error al actualizar el estado", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box className="page-enter">
      <PageHeader
        title="Gestión de PQRS"
        subtitle="Administra y da seguimiento a las peticiones, quejas, reclamos y sugerencias."
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : pqrsList.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={6}>
          No hay PQRS registrados.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {pqrsList.map((pqrs) => (
            <Card key={pqrs.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ sm: "center" }}
                  spacing={1}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {pqrs.radicado}
                      </Typography>
                      <Chip
                        label={PQRS_ESTADO_LABELS[pqrs.estado]}
                        color={PQRS_ESTADO_COLORS[pqrs.estado]}
                        size="small"
                      />
                      <Chip label={pqrs.tipo} size="small" variant="outlined" />
                      <Chip label={pqrs.categoria} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {pqrs.descripcion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pqrs.email} —{" "}
                      {pqrs.createdAt
                        ? new Date(pqrs.createdAt).toLocaleString("es-CO")
                        : "—"}
                    </Typography>
                    {pqrs.respuesta && (
                      <Typography variant="body2" mt={0.5} fontStyle="italic">
                        Respuesta: {pqrs.respuesta}
                      </Typography>
                    )}
                  </Box>
                  {pqrs.estado !== "resuelto" && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(pqrs)}
                    >
                      Actualizar estado
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Dialog actualizar estado */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Actualizar estado — {selected?.radicado}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Nuevo estado"
              value={estadoForm.estado}
              onChange={(e) =>
                setEstadoForm((prev) => ({
                  ...prev,
                  estado: e.target.value as PqrsEstado,
                }))
              }
              select
              fullWidth
            >
              {ESTADO_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Respuesta al ciudadano"
              value={estadoForm.respuesta}
              onChange={(e) =>
                setEstadoForm((prev) => ({ ...prev, respuesta: e.target.value }))
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Escribe una respuesta para el ciudadano..."
              helperText={
                estadoForm.estado === "resuelto"
                  ? "Obligatorio al resolver"
                  : "Opcional"
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              isUpdating ||
              (estadoForm.estado === "resuelto" &&
                !estadoForm.respuesta?.trim())
            }
            onClick={handleUpdateEstado}
          >
            {isUpdating ? "Guardando..." : "Guardar y notificar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPqrsList;