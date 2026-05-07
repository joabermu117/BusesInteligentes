import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import PaymentRounded from "@mui/icons-material/PaymentRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import PagoSelector from "../components/PagoSelector";
import ConfirmacionAbordaje from "../components/ConfirmacionAbordaje";
import {
  useActiveSchedules,
  usePaymentMethods,
  useBoardBus,
} from "../stores/useBoardingStore";
import { useParaderosByRuta } from "../../viajes/stores/useRutasStore";
import { useRuta } from "../../viajes/stores/useRutasStore";
import type { Schedule } from "../models/boletos";
import type { Paradero } from "../../viajes/models/ruta";

const STEPS = ["Seleccionar bus", "Método de pago", "Abordar"];

const AbordarBus = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const citizenId = localStorage.getItem("citizenId") ?? "default-citizen";

  useEffect(() => {
    if (!localStorage.getItem("citizenId")) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const { data: schedules, isLoading: schedulesLoading } =
    useActiveSchedules();
  const { data: paymentMethods, isLoading: paymentMethodsLoading } =
    usePaymentMethods(citizenId);
  const boardMutation = useBoardBus();

  const selectedSchedule: Schedule | undefined = schedules?.find(
    (s) => s.id === selectedScheduleId
  );

  const routeId = selectedSchedule?.routeId ?? 0;
  const { data: paraderos, isLoading: paraderosLoading } =
    useParaderosByRuta(routeId);
  const { data: route } = useRuta(routeId);

  const tariff = route?.tarifa ?? 0;

  const activeTicketsCount =
    selectedSchedule?.tickets?.filter(
      (t) => t.status === "issued" || t.status === "used"
    ).length ?? 0;
  const availableSeats = selectedSchedule
    ? (selectedSchedule.bus?.totalCapacity ?? 0) - activeTicketsCount
    : 0;

  const handleNext = () => {
    if (activeStep === 0 && !selectedScheduleId) {
      setError("Selecciona una programación de bus");
      return;
    }
    if (activeStep === 0 && !selectedStopId) {
      setError("Selecciona un paradero de abordaje");
      return;
    }
    if (activeStep === 1 && !selectedPaymentId) {
      setError("Selecciona un método de pago");
      return;
    }
    setError(null);
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleBoard = async () => {
    if (!selectedScheduleId || !selectedPaymentId || !selectedStopId) return;

    try {
      setError(null);
      const result = await boardMutation.mutateAsync({
        citizenId,
        scheduleId: selectedScheduleId,
        paymentMethodId: selectedPaymentId,
        stopId: selectedStopId,
      });
      setConfirmData(result);
      setShowConfirm(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Error al realizar el abordaje"
      );
    }
  };

  const selectedParadero = paraderos?.find(
    (p: Paradero) => p.stop_id === selectedStopId
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Abordar Bus
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Selecciona una ruta activa y tu método de pago para abordar.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Step 1: Seleccionar bus y paradero */}
      {activeStep === 0 && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  <DirectionsBusRounded
                    sx={{ mr: 1, verticalAlign: "middle" }}
                  />
                  Programaciones activas
                </Typography>

                {schedulesLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {schedules?.map((schedule) => {
                      const active =
                        schedule.tickets?.filter(
                          (t) => t.status === "issued" || t.status === "used"
                        ).length ?? 0;
                      const total = schedule.bus?.totalCapacity ?? 0;
                      const isFull = active >= total;
                      return (
                        <Grid size={{ xs: 12, sm: 6 }} key={schedule.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: "pointer",
                              borderColor:
                                selectedScheduleId === schedule.id
                                  ? "primary.main"
                                  : "divider",
                              borderWidth:
                                selectedScheduleId === schedule.id ? 2 : 1,
                              bgcolor:
                                selectedScheduleId === schedule.id
                                  ? "action.selected"
                                  : "background.paper",
                              opacity: isFull ? 0.6 : 1,
                              transition: "all 0.2s",
                              "&:hover": { borderColor: "primary.light" },
                            }}
                            onClick={() => {
                              if (!isFull) {
                                setSelectedScheduleId(schedule.id);
                                setSelectedStopId(null);
                                setError(null);
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Ruta #{schedule.routeId}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Bus: {schedule.bus?.plate} ({schedule.bus?.model})
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Capacidad: {active}/{total}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {isFull ? (
                                  <Chip
                                    label="Bus lleno"
                                    color="error"
                                    size="small"
                                  />
                                ) : (
                                  <Chip
                                    label={`${total - active} disponibles`}
                                    color="success"
                                    size="small"
                                  />
                                )}
                                <Chip
                                  label={schedule.status === "in_progress" ? "En curso" : "Programado"}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Paradero de abordaje
                </Typography>
                {!selectedScheduleId ? (
                  <Typography variant="body2" color="text.secondary">
                    Selecciona una programación primero.
                  </Typography>
                ) : paraderosLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : paraderos && paraderos.length > 0 ? (
                  <FormControl fullWidth>
                    <InputLabel>Seleccionar paradero</InputLabel>
                    <Select
                      value={selectedStopId ?? ""}
                      label="Seleccionar paradero"
                      onChange={(e) =>
                        setSelectedStopId(Number(e.target.value))
                      }
                    >
                      {paraderos.map((p: Paradero) => (
                        <MenuItem key={p.stop_id} value={p.stop_id}>
                          {p.stop.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay paraderos registrados para esta ruta.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 2: Método de pago */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              <PaymentRounded sx={{ mr: 1, verticalAlign: "middle" }} />
              Método de pago
            </Typography>

            {selectedSchedule && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tarifa: <strong>S/ {tariff.toFixed(2)}</strong>
              </Typography>
            )}

            {selectedParadero && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Abordando en: <strong>{selectedParadero.stop.name}</strong>
              </Typography>
            )}

            <PagoSelector
              paymentMethods={paymentMethods ?? []}
              isLoading={paymentMethodsLoading}
              selectedId={selectedPaymentId}
              onChange={setSelectedPaymentId}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmar */}
      {activeStep === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              <CheckCircleRounded
                sx={{ mr: 1, verticalAlign: "middle", color: "success.main" }}
              />
              Confirmar abordaje
            </Typography>

            {selectedSchedule && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Bus
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedSchedule.bus?.plate} - {selectedSchedule.bus?.model}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Capacidad disponible
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {availableSeats} asientos
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Paradero de abordaje
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedParadero?.stop.name ?? "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Método de pago
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {paymentMethods?.find((pm) => pm.id === selectedPaymentId)
                      ?.paymentMethod?.name ?? "Seleccionado"}
                  </Typography>
                </Box>
              </Box>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleBoard}
              disabled={boardMutation.isPending}
            >
              {boardMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Validar y abordar"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => navigate("/rutas") : handleBack}
        >
          {activeStep === 0 ? "Volver a rutas" : "Atrás"}
        </Button>
        {activeStep < 2 && (
          <Button variant="contained" onClick={handleNext}>
            Siguiente
          </Button>
        )}
      </Box>

      <ConfirmacionAbordaje
        open={showConfirm}
        ticket={confirmData?.ticket ?? null}
        remainingBalance={confirmData?.remainingBalance ?? 0}
        onClose={() => {
          setShowConfirm(false);
          navigate("/viajes/historial");
        }}
      />
    </Box>
  );
};

export default AbordarBus;
