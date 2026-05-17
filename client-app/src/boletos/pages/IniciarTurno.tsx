import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Alert,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import GpsFixedRounded from "@mui/icons-material/GpsFixedRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { getAuthUserId } from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useShiftsByDriver, useStartShift } from "../stores/useShiftStore";

const IniciarTurno = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shiftId = Number(id);

  const storedDriverUserId = localStorage.getItem("driverUserId");
  const jwtUserId = getAuthUserId();
  const driverUserId = storedDriverUserId ?? jwtUserId ?? "";
  const { data: shifts, isLoading: loadingShifts } =
    useShiftsByDriver(driverUserId);
  const startShiftMutation = useStartShift();

  const [busCondition, setBusCondition] = useState("operative");
  const [observations, setObservations] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverUserId) {
      navigate("/login", { replace: true });
      return;
    }

    if (!storedDriverUserId && jwtUserId) {
      localStorage.setItem("driverUserId", jwtUserId);
    }
  }, [driverUserId, jwtUserId, navigate, storedDriverUserId]);

  const shift = shifts?.find((s) => s.id === shiftId);

  const handleStartShift = async () => {
    try {
      setError(null);
      await startShiftMutation.mutateAsync({
        shiftId,
        busCondition: busCondition === "operative" ? undefined : busCondition,
        observations: observations || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Error al iniciar el turno"
      );
    }
  };

  if (loadingShifts) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shift) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Turno no encontrado
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/turnos")}
          sx={{ mt: 2 }}
        >
          Volver a mis turnos
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Card sx={{ textAlign: "center", py: 6, px: 4 }}>
          <CheckCircleRounded
            sx={{ fontSize: 72, color: "success.main", mb: 2 }}
          />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Turno iniciado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            GPS activado — el bus ya está siendo monitoreado.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Tu turno está en curso. Buena ruta, conductor.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => navigate("/turnos")}
            >
              Ir a mis turnos
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
      <PageHeader
        title="Iniciar turno"
        subtitle="Confirma los datos y el estado del bus para comenzar tu turno."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <DirectionsBusRounded color="action" />
            <Typography variant="h6" fontWeight={600}>
              Bus asignado
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Placa
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {shift.bus?.plate ?? "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Modelo
              </Typography>
              <Typography variant="body2">
                {shift.bus?.model ?? "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Capacidad
              </Typography>
              <Typography variant="body2">
                {shift.bus?.totalCapacity
                  ? `${shift.bus.totalCapacity} pasajeros`
                  : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Horario programado
              </Typography>
              <Chip
                label={
                  shift.startTime
                    ? new Date(shift.startTime).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
                }
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <GpsFixedRounded color="action" />
            <Typography variant="h6" fontWeight={600}>
              Estado del bus
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              Condición del bus
            </FormLabel>
            <RadioGroup
              value={busCondition}
              onChange={(e) => setBusCondition(e.target.value)}
            >
              <FormControlLabel
                value="operative"
                control={<Radio />}
                label="Operativo — el bus está en buenas condiciones"
              />
              <FormControlLabel
                value="maintenance"
                control={<Radio />}
                label="Con observaciones — reportar detalle"
              />
              <FormControlLabel
                value="out_of_service"
                control={<Radio />}
                label="Fuera de servicio — no puede operar"
              />
            </RadioGroup>
          </FormControl>

          {busCondition !== "operative" && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              placeholder="Describe el estado del bus..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </Card>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleStartShift}
        disabled={startShiftMutation.isPending}
        sx={{ py: 1.5 }}
      >
        {startShiftMutation.isPending ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Confirmar inicio de turno"
        )}
      </Button>
    </Box>
  );
};

export default IniciarTurno;
