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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { CitizenSearchResult } from "../models/message";
import { useCitizenSearch, useSendPersonalMessage } from "../stores/useMessagesStore";

interface ReplyState {
  replyTo?: string;
  replyName?: string;
}

const NuevoMensajeDirecto = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const personId = getAuthUserId() ?? "";

  const [searchQ, setSearchQ] = useState("");
  const debouncedSearchQ = useDebouncedValue(searchQ, 350);
  const [recipients, setRecipients] = useState<CitizenSearchResult[]>([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  // Pre-seleccionar destinatario si viene de "Responder" (vía state, no query params)
  useEffect(() => {
    const state = routerLocation.state as ReplyState | null;
    if (state?.replyTo) {
      setRecipients([{ person_id: state.replyTo, name: state.replyName ?? state.replyTo, isActive: true }]);
    }
  }, [routerLocation.state]);

  const [content, setContent] = useState("");
  const [contentTouched, setContentTouched] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmUrgentOpen, setConfirmUrgentOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const { data: searchResults, isFetching: isSearching } = useCitizenSearch(debouncedSearchQ, personId);
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

  const isContentEmpty = content.trim().length === 0;
  const hasUnsavedContent = content.trim().length > 0 || recipients.length > 0;

  const doSend = async () => {
    const validRecipients = recipients.filter((r) => r.person_id !== personId);
    if (validRecipients.length === 0) {
      enqueueSnackbar("No puedes enviarte un mensaje a ti mismo", { variant: "error" });
      return;
    }

    try {
      await sendMessage({
        content: content.trim(),
        sender_person_id: personId,
        recipient_person_ids: validRecipients.map((r) => r.person_id),
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

  const handleSend = async () => {
    setContentTouched(true);
    if (isContentEmpty || recipients.length === 0) return;

    if (isUrgent) {
      setConfirmUrgentOpen(true);
      return;
    }
    await doSend();
  };

  const handleCancel = () => {
    if (hasUnsavedContent) {
      setDiscardConfirmOpen(true);
    } else {
      navigate("/mensajes/bandeja");
    }
  };

  const canSend = !isContentEmpty && recipients.length > 0 && !isPending;

  return (
    <Box className="page-enter" maxWidth={600} mx="auto">
      {isPending && <LinearProgress sx={{ mb: 2 }} />}

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
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
            <Typography variant="subtitle2">Destinatarios</Typography>
            {recipients.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {recipients.length} destinatario{recipients.length !== 1 ? "s" : ""} seleccionado
                {recipients.length !== 1 ? "s" : ""}
              </Typography>
            )}
          </Stack>
          <Autocomplete
            multiple
            open={autocompleteOpen}
            onOpen={() => setAutocompleteOpen(true)}
            onClose={() => setAutocompleteOpen(false)}
            options={(searchResults ?? []).filter((o) => o.isActive)}
            getOptionLabel={(o) => o.name ?? o.person_id}
            getOptionDisabled={(o) => !o.isActive}
            filterOptions={(x) => x}
            inputValue={searchQ}
            onInputChange={(_, v) => setSearchQ(v)}
            value={recipients}
            onChange={(_, v, reason) => {
              setRecipients(v);
              if (reason === "selectOption") {
                setSearchQ("");
                setAutocompleteOpen(false);
              }
            }}
            loading={isSearching}
            noOptionsText={searchQ.length < 2 ? "Escribe al menos 2 caracteres" : "Sin resultados"}
            isOptionEqualToValue={(a, b) => a.person_id === b.person_id}
            renderOption={(props, option) => (
              <li {...props} key={option.person_id}>
                {option.name ?? option.person_id}
                {!option.isActive && (
                  <Typography variant="caption" color="text.secondary" ml={1}>
                    (Inactivo)
                  </Typography>
                )}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => {
                const { key, ...chipProps } = getTagProps({ index: idx });
                return (
                  <Chip
                    key={opt.person_id}
                    label={opt.name ?? opt.person_id}
                    size="small"
                    icon={<PersonAddRounded />}
                    {...chipProps}
                  />
                );
              })
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
          onBlur={() => setContentTouched(true)}
          fullWidth
          inputProps={{ maxLength: 2000 }}
          placeholder="Escribe tu mensaje aquí..."
          error={contentTouched && isContentEmpty}
          helperText={
            contentTouched && isContentEmpty
              ? "El mensaje no puede estar vacío"
              : `${content.length}/2000`
          }
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

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" onClick={handleCancel} disabled={isPending} fullWidth>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SendRounded />}
            onClick={handleSend}
            disabled={!canSend}
            size="large"
            fullWidth
          >
            {isPending ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </Stack>
      </Stack>

      {/* Confirmación de mensaje urgente */}
      <Dialog open={confirmUrgentOpen} onClose={() => setConfirmUrgentOpen(false)}>
        <DialogTitle>¿Enviar como urgente?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este mensaje se marcará como urgente y generará una notificación inmediata para
            el destinatario. ¿Confirmas el envío?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUrgentOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmUrgentOpen(false);
              doSend();
            }}
          >
            Enviar urgente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación de descartar */}
      <Dialog open={discardConfirmOpen} onClose={() => setDiscardConfirmOpen(false)}>
        <DialogTitle>¿Descartar mensaje?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Perderás el contenido escrito y los destinatarios seleccionados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardConfirmOpen(false)}>Seguir editando</Button>
          <Button color="error" onClick={() => navigate("/mensajes/bandeja")}>
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NuevoMensajeDirecto;
