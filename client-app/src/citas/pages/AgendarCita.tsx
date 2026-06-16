import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import VideoCallRounded from "@mui/icons-material/VideoCallRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PageHeader from "../../permisos/common/components/PageHeader";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";

const N8N_DISPONIBILIDAD_URL =
  import.meta.env.VITE_N8N_CITAS_DISPONIBILIDAD_URL ||
  "http://localhost:5678/webhook/citas-disponibilidad";

const N8N_AGENDAR_URL =
  import.meta.env.VITE_N8N_CITAS_AGENDAR_URL ||
  "http://localhost:5678/webhook/citas-agendar";

const TIPOS_ATENCION = ["Presencial", "Virtual"] as const;
const TIPOS_CONSULTA = [
  "Problema con tarjeta",
  "Reclamo",
  "Reembolso",
  "Otro",
] as const;

const MAX_MOTIVO = 300;

interface Slot {
  start: string;
  end: string;
  label: string;
}

const getUserFromToken = (): { email: string; name: string } => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return { email: "", name: "" };
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload?.email ?? "",
      name: payload?.name ?? "Usuario",
    };
  } catch {
    return { email: "", name: "" };
  }
};

const formatFechaCO = (isoString: string) =>
  new Date(isoString).toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });

const AgendarCita = () => {
  const [step, setStep] = useState(0);
  const [tipoAtencion, setTipoAtencion] = useState<string>("");
  const [tipoConsulta, setTipoConsulta] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null);
  const [motivo, setMotivo] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isAgendando, setIsAgendando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citaConfirmada, setCitaConfirmada] = useState<any>(null);

  const handleConsultarDisponibilidad = async () => {
    if (!tipoAtencion || !tipoConsulta) return;
    setIsLoadingSlots(true);
    setError(null);
    setSlots([]);
    setSlotSeleccionado(null);

    try {
      const res = await fetch(N8N_DISPONIBILIDAD_URL);
      const data = await res.json();
      const slotsData: Slot[] = data.slots ?? [];
      if (slotsData.length === 0) {
        setError("No hay horarios disponibles para los próximos 10 días. Intenta más tarde.");
      } else {
        setSlots(slotsData);
        setStep(1);
      }
    } catch {
      setError("No se pudo consultar la disponibilidad. Verifica tu conexión.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleAgendar = async () => {
    if (!slotSeleccionado || !motivo.trim()) return;
    setIsAgendando(true);
    setError(null);

    const { email, name } = getUserFromToken();
    const labelCO = formatFechaCO(slotSeleccionado.start);

    try {
      const res = await fetch(N8N_AGENDAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: slotSeleccionado.start,
          end: slotSeleccionado.end,
          label: labelCO,
          tipoAtencion,
          tipoConsulta,
          motivo: motivo.trim(),
          email,
          nombreUsuario: name,
        }),
      });

      if (!res.ok) throw new Error("Error al agendar");

      const data = await res.json();
      setCitaConfirmada({
        ...data,
        slot: slotSeleccionado,
        tipoAtencion,
        tipoConsulta,
        labelCO,
      });
      setStep(2);
    } catch {
      setError("No se pudo agendar la cita. Intenta de nuevo.");
    } finally {
      setIsAgendando(false);
    }
  };

  const handleReiniciar = () => {
    setStep(0);
    setTipoAtencion("");
    setTipoConsulta("");
    setSlots([]);
    setSlotSeleccionado(null);
    setMotivo("");
    setCitaConfirmada(null);
    setError(null);
  };

  // Agrupar slots por fecha
  const slotsPorFecha: Record<string, Slot[]> = {};
  slots.forEach((slot) => {
    const fecha = new Date(slot.start).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Bogota",
    });
    if (!slotsPorFecha[fecha]) slotsPorFecha[fecha] = [];
    slotsPorFecha[fecha].push(slot);
  });

  return (
    <Box className="page-enter">
      <PageHeader
        title="Agendar Cita"
        subtitle="Reserva una cita de atención personalizada con nuestros asesores."
      />

      <Stepper activeStep={step} sx={{ mb: 4, maxWidth: 600 }}>
        <Step><StepLabel>Tipo de cita</StepLabel></Step>
        <Step><StepLabel>Seleccionar horario</StepLabel></Step>
        <Step><StepLabel>Confirmación</StepLabel></Step>
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* PASO 0 — Tipo de cita */}
      {step === 0 && (
        <Card variant="outlined" sx={{ maxWidth: 500 }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                ¿Qué tipo de cita necesitas?
              </Typography>

              <TextField
                label="Tipo de atención"
                value={tipoAtencion}
                onChange={(e) => setTipoAtencion(e.target.value)}
                select
                fullWidth
              >
                {TIPOS_ATENCION.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {tipo === "Virtual" ? <VideoCallRounded fontSize="small" /> : <EventAvailableRounded fontSize="small" />}
                      <span>{tipo}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Tipo de consulta"
                value={tipoConsulta}
                onChange={(e) => setTipoConsulta(e.target.value)}
                select
                fullWidth
              >
                {TIPOS_CONSULTA.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                size="large"
                disabled={!tipoAtencion || !tipoConsulta || isLoadingSlots}
                onClick={handleConsultarDisponibilidad}
                startIcon={
                  isLoadingSlots
                    ? <CircularProgress size={18} color="inherit" />
                    : <CalendarMonthRounded />
                }
              >
                {isLoadingSlots ? "Consultando disponibilidad..." : "Ver horarios disponibles"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* PASO 1 — Seleccionar horario */}
      {step === 1 && (
        <Stack spacing={3} sx={{ maxWidth: 700 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={tipoAtencion} color="primary" variant="outlined" />
            <Chip label={tipoConsulta} variant="outlined" />
          </Stack>

          <Typography variant="h6" fontWeight={700}>
            Selecciona fecha y hora
          </Typography>

          {Object.entries(slotsPorFecha).map(([fecha, slotsDelDia]) => (
            <Box key={fecha}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.secondary"
                sx={{ mb: 1, textTransform: "capitalize" }}
              >
                {fecha}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {slotsDelDia.map((slot) => {
                  const hora = new Date(slot.start).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Bogota",
                  });
                  const isSelected = slotSeleccionado?.start === slot.start;
                  return (
                    <Chip
                      key={slot.start}
                      label={hora}
                      onClick={() => setSlotSeleccionado(slot)}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{ cursor: "pointer" }}
                    />
                  );
                })}
              </Stack>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}

          {slotSeleccionado && (
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Horario seleccionado
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {formatFechaCO(slotSeleccionado.start)}
                  </Typography>

                  <TextField
                    label="Motivo de la consulta"
                    value={motivo}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_MOTIVO) setMotivo(e.target.value);
                    }}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Describe brevemente el motivo de tu cita..."
                    helperText={`${motivo.length}/${MAX_MOTIVO} caracteres`}
                  />

                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => setStep(0)}>
                      Volver
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!motivo.trim() || isAgendando}
                      onClick={handleAgendar}
                      startIcon={
                        isAgendando
                          ? <CircularProgress size={18} color="inherit" />
                          : <EventAvailableRounded />
                      }
                    >
                      {isAgendando ? "Agendando..." : "Confirmar cita"}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {/* PASO 2 — Confirmación */}
      {step === 2 && citaConfirmada && (
        <Card variant="outlined" sx={{ maxWidth: 500 }}>
          <CardContent>
            <Stack spacing={2.5} alignItems="center" textAlign="center">
              <CheckCircleRounded sx={{ fontSize: 64, color: "success.main" }} />
              <Typography variant="h5" fontWeight={700}>
                ¡Cita agendada!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recibirás un email de confirmación con todos los detalles.
              </Typography>

              <Divider sx={{ width: "100%" }} />

              <Stack spacing={1} sx={{ width: "100%", textAlign: "left" }}>
                <Typography variant="body2">
                  <strong>Fecha y hora:</strong>{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {citaConfirmada.labelCO}
                  </span>
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo de atención:</strong> {citaConfirmada.tipoAtencion}
                </Typography>
                <Typography variant="body2">
                  <strong>Tipo de consulta:</strong> {citaConfirmada.tipoConsulta}
                </Typography>
                {citaConfirmada.tipoAtencion === "Virtual" && citaConfirmada.hangoutLink && (
                  <Typography variant="body2">
                    <strong>Enlace Meet:</strong>{" "}
                    <a href={citaConfirmada.hangoutLink} target="_blank" rel="noreferrer">
                      {citaConfirmada.hangoutLink}
                    </a>
                  </Typography>
                )}
                {citaConfirmada.tipoAtencion === "Presencial" && (
                  <Typography variant="body2">
                    <strong>Ubicación:</strong> Oficina de Atención al Cliente - Buses Inteligentes
                  </Typography>
                )}
              </Stack>

              <Button variant="outlined" onClick={handleReiniciar} fullWidth>
                Agendar otra cita
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AgendarCita;