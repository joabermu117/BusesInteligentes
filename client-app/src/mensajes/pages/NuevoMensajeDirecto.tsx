import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import PersonAddRounded from "@mui/icons-material/PersonAddRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { CitizenSearchResult } from "../models/message";
import { useCitizenSearch, useSendPersonalMessage } from "../stores/useMessagesStore";

const NuevoMensajeDirecto = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const personId = getAuthUserId() ?? "";
  const [searchParams] = useSearchParams();

  const [searchQ, setSearchQ] = useState("");
  const [recipients, setRecipients] = useState<CitizenSearchResult[]>([]);

  // Pre-seleccionar destinatario si viene de "Responder"
  useEffect(() => {
    const replyTo = searchParams.get("replyTo");
    const replyName = searchParams.get("replyName");
    if (replyTo) {
      setRecipients([{ person_id: replyTo, name: replyName ?? replyTo, isActive: true }]);
    }
  }, [searchParams]);
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: searchResults, isFetching: isSearching } = useCitizenSearch(searchQ);
  const { mutateAsync: sendMessage, isPending } = useSendPersonalMessage();

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        enqueueSnackbar("Ubicación obtenida correctamente", { variant: "success" });
      },
      () => enqueueSnackbar("No se pudo obtener la ubicación", { variant: "error" }),
    );
  };

  const handleSend = async () => {
    if (!content.trim() || recipients.length === 0) return;
    try {
      await sendMessage({
        content: content.trim(),
        sender_person_id: personId,
        recipient_person_ids: recipients.map((r) => r.person_id),
        is_urgent: isUrgent,
        latitude: includeLocation ? location?.lat : undefined,
        longitude: includeLocation ? location?.lng : undefined,
      });
      enqueueSnackbar("Mensaje enviado correctamente", { variant: "success" });
      navigate("/mensajes/bandeja");
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al enviar el mensaje"), { variant: "error" });
    }
  };

  const canSend = content.trim().length > 0 && recipients.length > 0 && !isPending;

  return (
    <Box className="page-enter" maxWidth={600} mx="auto">
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/mensajes/bandeja")}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Typography variant="h4" fontWeight={700} mb={1}>
        Nuevo mensaje directo
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Envía un mensaje privado a uno o varios usuarios del sistema.
      </Typography>

      <Stack spacing={3}>
        {/* Destinatarios */}
        <Box>
          <Typography variant="subtitle2" mb={1}>
            Destinatarios
          </Typography>
          <Autocomplete
            multiple
            options={searchResults ?? []}
            getOptionLabel={(o) => o.name ?? o.person_id}
            filterOptions={(x) => x}
            inputValue={searchQ}
            onInputChange={(_, v) => setSearchQ(v)}
            value={recipients}
            onChange={(_, v) => setRecipients(v)}
            loading={isSearching}
            noOptionsText={searchQ.length < 2 ? "Escribe al menos 2 caracteres" : "Sin resultados"}
            isOptionEqualToValue={(a, b) => a.person_id === b.person_id}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => (
                <Chip
                  key={opt.person_id}
                  label={opt.name ?? opt.person_id}
                  size="small"
                  icon={<PersonAddRounded />}
                  {...getTagProps({ index: idx })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Buscar por nombre..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Contenido */}
        <TextField
          label="Mensaje"
          multiline
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          inputProps={{ maxLength: 2000 }}
          placeholder="Escribe tu mensaje aquí..."
          helperText={`${content.length}/2000`}
        />

        {/* Opciones */}
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                color="error"
              />
            }
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <WarningAmberRounded fontSize="small" color={isUrgent ? "error" : "disabled"} />
                <Typography variant="body2">Marcar como urgente</Typography>
              </Stack>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={includeLocation}
                onChange={(e) => {
                  setIncludeLocation(e.target.checked);
                  if (e.target.checked && !location) handleGetLocation();
                }}
              />
            }
            label="Incluir mi ubicación actual"
          />

          {includeLocation && location && (
            <Alert severity="info" icon={false}>
              Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
            </Alert>
          )}
        </Stack>

        <Button
          variant="contained"
          startIcon={<SendRounded />}
          onClick={handleSend}
          disabled={!canSend}
          size="large"
        >
          {isPending ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </Stack>
    </Box>
  );
};

export default NuevoMensajeDirecto;
