import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageHeader from "../../permisos/common/components/PageHeader";
import type { Pqrs } from "../models/pqrs";
import { PQRS_ESTADO_COLORS, PQRS_ESTADO_LABELS } from "../models/pqrs";
import { fetchPqrsByRadicado } from "../services/pqrsService";

const ConsultarPqrs = () => {
  const [radicado, setRadicado] = useState("");
  const [pqrs, setPqrs] = useState<Pqrs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsultar = async () => {
    if (!radicado.trim()) return;
    setIsLoading(true);
    setError(null);
    setPqrs(null);
    try {
      const data = await fetchPqrsByRadicado(radicado.trim().toUpperCase());
      setPqrs(data);
    } catch {
      setError("No se encontró ningún PQRS con ese número de radicado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="page-enter">
      <PageHeader
        title="Consultar PQRS"
        subtitle="Ingresa tu número de radicado para consultar el estado de tu solicitud."
      />

      <Stack direction="row" spacing={1} mb={3} sx={{ maxWidth: 500 }}>
        <TextField
          label="Número de radicado"
          value={radicado}
          onChange={(e) => setRadicado(e.target.value)}
          placeholder="PQRS-2026-123456"
          fullWidth
          size="small"
          onKeyDown={(e) => e.key === "Enter" && handleConsultar()}
        />
        <Button
          variant="contained"
          startIcon={
            isLoading ? <CircularProgress size={16} color="inherit" /> : <SearchRounded />
          }
          disabled={isLoading || !radicado.trim()}
          onClick={handleConsultar}
        >
          Consultar
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ maxWidth: 500 }}>{error}</Alert>}

      {pqrs && (
        <Card variant="outlined" sx={{ maxWidth: 600 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6" fontWeight={700}>
                  {pqrs.radicado}
                </Typography>
                <Chip
                  label={PQRS_ESTADO_LABELS[pqrs.estado]}
                  color={PQRS_ESTADO_COLORS[pqrs.estado]}
                />
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Tipo:</strong> {pqrs.tipo}
                </Typography>
                <Typography variant="body2">
                  <strong>Categoría:</strong> {pqrs.categoria}
                </Typography>
                <Typography variant="body2">
                  <strong>Descripción:</strong> {pqrs.descripcion}
                </Typography>
                <Typography variant="body2">
                  <strong>Fecha de radicado:</strong>{" "}
                  {pqrs.createdAt
                    ? new Date(pqrs.createdAt).toLocaleString("es-CO")
                    : "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Tiempo estimado de respuesta:</strong>{" "}
                  {pqrs.tiempoRespuesta ?? "5 días hábiles"}
                </Typography>
                {pqrs.resolvedAt && (
                  <Typography variant="body2">
                    <strong>Fecha de resolución:</strong>{" "}
                    {new Date(pqrs.resolvedAt).toLocaleString("es-CO")}
                  </Typography>
                )}
              </Stack>

              {pqrs.respuesta && (
                <Alert severity="success">
                  <strong>Respuesta del agente:</strong> {pqrs.respuesta}
                </Alert>
              )}

              {pqrs.estado !== "resuelto" && (
                <Alert severity="info">
                  Tu PQRS está siendo atendido. Recibirás un email cuando haya
                  actualizaciones.
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConsultarPqrs;