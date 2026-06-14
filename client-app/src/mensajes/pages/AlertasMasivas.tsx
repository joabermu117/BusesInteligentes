import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { getAuthUserId } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import { useAlertStats, useAlerts, useSendMassAlert } from "../stores/useMessagesStore";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });

const AlertStatsCard = ({ alertId }: { alertId: number }) => {
  const { data: stats } = useAlertStats(alertId);
  if (!stats) return null;
  const pct = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" spacing={2} mb={0.5}>
        <Typography variant="caption" color="text.secondary">
          {stats.read}/{stats.total} leídos
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 6 }} />
    </Box>
  );
};

const AlertasMasivas = () => {
  const { enqueueSnackbar } = useSnackbar();
  const personId = getAuthUserId() ?? "";

  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"all" | "route" | "zone">("all");
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [lastResult, setLastResult] = useState<{ recipients: number } | null>(null);

  const { data: alerts, isLoading } = useAlerts();
  const { mutateAsync: sendAlert, isPending } = useSendMassAlert();

  const handleSend = async () => {
    if (!content.trim()) return;
    try {
      const result = await sendAlert({
        content: content.trim(),
        sender_person_id: personId,
        scope,
        is_urgent: isUrgent,
        scheduled_at: scheduledAt || undefined,
      });
      setLastResult({ recipients: result.recipients });
      setContent("");
      setScheduledAt("");
      enqueueSnackbar(
        scheduledAt
          ? "Alerta programada correctamente"
          : `Alerta enviada a ${result.recipients} destinatarios`,
        { variant: "success" },
      );
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al enviar la alerta"), { variant: "error" });
    }
  };

  const canSend = content.trim().length > 0 && !isPending;

  return (
    <Box className="page-enter">
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <NotificationsActiveRounded color="error" />
        <Typography variant="h4" fontWeight={700}>
          Alertas masivas
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Envía notificaciones a todos los ciudadanos o grupos específicos.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        {/* Formulario */}
        <Box flex={1} minWidth={0}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Contenido de la alerta"
                  multiline
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  fullWidth
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${content.length}/1000`}
                  placeholder="Mensaje de la alerta..."
                />

                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    Alcance
                  </Typography>
                  <Select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="all">Todos los ciudadanos</MenuItem>
                    <MenuItem value="route">Por ruta (próximamente)</MenuItem>
                    <MenuItem value="zone">Por zona (próximamente)</MenuItem>
                  </Select>
                </Box>

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
                      <WarningAmberRounded
                        fontSize="small"
                        color={isUrgent ? "error" : "disabled"}
                      />
                      <Typography variant="body2">Urgente (notificación inmediata)</Typography>
                    </Stack>
                  }
                />

                <TextField
                  label="Programar envío (opcional)"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Deja vacío para enviar ahora"
                />

                {lastResult && (
                  <Alert
                    severity="success"
                    icon={<CheckCircleRounded />}
                    onClose={() => setLastResult(null)}
                  >
                    Alerta enviada a <strong>{lastResult.recipients}</strong> destinatarios.
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color={isUrgent ? "error" : "primary"}
                  startIcon={<SendRounded />}
                  onClick={handleSend}
                  disabled={!canSend}
                  size="large"
                >
                  {isPending
                    ? "Enviando..."
                    : scheduledAt
                    ? "Programar alerta"
                    : "Enviar alerta ahora"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Historial */}
        <Box flex={1} minWidth={0}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Historial de alertas
          </Typography>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : !alerts || alerts.length === 0 ? (
            <Alert severity="info">No hay alertas enviadas aún.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {alerts.map((alert) => (
                <Card key={alert.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                      {alert.is_urgent && <WarningAmberRounded color="error" fontSize="small" />}
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" noWrap>
                          {alert.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(alert.sent_at)}
                        </Typography>
                      </Box>
                      {alert.is_urgent && (
                        <Chip label="Urgente" size="small" color="error" />
                      )}
                    </Stack>
                    <Divider sx={{ mb: 1 }} />
                    <AlertStatsCard alertId={alert.id} />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default AlertasMasivas;
