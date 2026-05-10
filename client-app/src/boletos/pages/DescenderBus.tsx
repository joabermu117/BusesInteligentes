import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExitToAppRounded from "@mui/icons-material/ExitToAppRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { useActiveTicket, useAlightBus } from "../stores/useBoardingStore";
import { useParaderosByRuta } from "../../viajes/stores/useRutasStore";
import type { Paradero } from "../../viajes/models/ruta";

const DescenderBus = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const citizenId = localStorage.getItem("citizenId") ?? "default-citizen";

  useEffect(() => {
    if (!localStorage.getItem("citizenId")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const { data: activeTicket, isLoading, error: ticketError } =
    useActiveTicket(citizenId);
  const alightMutation = useAlightBus();

  const routeId = activeTicket?.schedule?.routeId ?? 0;
  const { data: paraderos, isLoading: paraderosLoading } =
    useParaderosByRuta(routeId);

  const handleAlight = async () => {
    if (!activeTicket || !selectedStopId) return;

    try {
      await alightMutation.mutateAsync({
        ticketId: activeTicket.id,
        stopId: selectedStopId,
        citizenId,
      });
      setSuccess(true);
    } catch {
      // error handled by mutation
    }
  };

  if (success) {
    return (
      <Box>
        <Card sx={{ textAlign: "center", py: 6, px: 4 }}>
          <CheckCircleRounded
            sx={{ fontSize: 72, color: "success.main", mb: 2 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Viaje completado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Gracias por usar nuestro servicio
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/viajes/historial")}
          >
            Ver historial de viajes
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Descender del Bus
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Registra tu salida del bus cuando llegues a tu destino.
      </Typography>

      {ticketError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al obtener tu boleto activo
        </Alert>
      )}

      {alightMutation.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(alightMutation.error as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ??
            "Error al registrar descenso"}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTicket ? (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <ExitToAppRounded color="action" />
              <Typography variant="h6" fontWeight={600}>
                Boleto activo
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Número de boleto
                </Typography>
                <Chip
                  label={activeTicket.ticketNumber}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Chip label="Emitido" color="success" size="small" />
              </Box>
              {activeTicket.price && (
                <Box
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Tarifa
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    S/ {Number(activeTicket.price).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Paradero de descenso
            </Typography>

            {paraderosLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : paraderos && paraderos.length > 0 ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Seleccionar paradero</InputLabel>
                <Select
                  value={selectedStopId ?? ""}
                  label="Seleccionar paradero"
                  onChange={(e) => setSelectedStopId(Number(e.target.value))}
                >
                  {paraderos.map((p: Paradero) => (
                    <MenuItem key={p.stop_id} value={p.stop_id}>
                      {p.stop.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No hay paraderos registrados para esta ruta.
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleAlight}
              disabled={alightMutation.isPending || !selectedStopId}
            >
              {alightMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Descender aquí"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes un boleto activo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Debes abordar un bus primero para poder descender.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/abordar")}
            >
              Ir a abordar
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DescenderBus;
