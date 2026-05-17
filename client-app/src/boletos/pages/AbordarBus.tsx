import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import PageHeader from "../../permisos/common/components/PageHeader";
import {
  useActiveSchedules,
  usePaymentMethods,
  useBoardBus,
} from "../stores/useBoardingStore";
import { useParaderosByRuta, useRuta } from "../../viajes/stores/useRutasStore";
import ScheduleSelector from "../components/ScheduleSelector";
import StopSelector from "../components/StopSelector";
import { StepPayment, StepConfirm } from "../components/StepsAbordaje";
import ConfirmacionAbordaje from "../components/ConfirmacionAbordaje";
import { useCitizenGuard } from "../hooks/useCitizenGuard";
import { countActivePassengers } from "../../shared/utils/boarding";
import type { Schedule, BoardBusResponse } from "../models/boletos";

const STEPS = ["Seleccionar bus", "Método de pago", "Abordar"];

const AbordarBus = () => {
  const navigate = useNavigate();
  const citizenId = useCitizenGuard();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<BoardBusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: schedules, isLoading: schedulesLoading } = useActiveSchedules();
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods(citizenId);
  const boardMutation = useBoardBus();

  const selectedSchedule: Schedule | undefined = schedules?.find(
    (s) => s.id === selectedScheduleId
  );
  const routeId = selectedSchedule?.routeId ?? 0;
  const { data: paraderos, isLoading: paraderosLoading } = useParaderosByRuta(routeId);
  const { data: route } = useRuta(routeId);

  const tariff = route?.tarifa ?? 0;
  const availableSeats = selectedSchedule
    ? (selectedSchedule.bus?.totalCapacity ?? 0) - countActivePassengers(selectedSchedule.tickets)
    : 0;

  const selectedParadero = paraderos?.find((p) => p.stop_id === selectedStopId);
  const selectedPaymentMethodName = paymentMethods?.find(
    (pm) => pm.id === selectedPaymentId
  )?.paymentMethod?.name;

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
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al realizar el abordaje"
      );
    }
  };

  return (
    <Box>
      <PageHeader
        title="Abordar Bus"
        subtitle="Selecciona una ruta activa y tu método de pago para abordar."
      />

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

      {activeStep === 0 && (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          <Box sx={{ flex: { md: 7 } }}>
            <ScheduleSelector
              schedules={schedules}
              isLoading={schedulesLoading}
              selectedId={selectedScheduleId}
              onSelect={(id) => {
                setSelectedScheduleId(id);
                setSelectedStopId(null);
                setError(null);
              }}
            />
          </Box>
          <Box sx={{ flex: { md: 5 } }}>
            <StopSelector
              selectedScheduleId={selectedScheduleId}
              paraderos={paraderos}
              isLoading={paraderosLoading}
              selectedStopId={selectedStopId}
              onChange={setSelectedStopId}
            />
          </Box>
        </Box>
      )}

      {activeStep === 1 && (
        <StepPayment
          tariff={tariff}
          paraderoName={selectedParadero?.stop.name}
          paymentMethods={paymentMethods ?? []}
          isLoading={paymentMethodsLoading}
          selectedPaymentId={selectedPaymentId}
          onChange={setSelectedPaymentId}
        />
      )}

      {activeStep === 2 && (
        <StepConfirm
          schedule={selectedSchedule}
          availableSeats={availableSeats}
          paraderoName={selectedParadero?.stop.name}
          paymentMethodName={selectedPaymentMethodName}
          isPending={boardMutation.isPending}
          onBoard={handleBoard}
        />
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
