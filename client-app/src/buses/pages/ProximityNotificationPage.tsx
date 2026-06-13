import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import NotificationsOffRounded from '@mui/icons-material/NotificationsOffRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../permisos/common/components/PageHeader';
import { useRutas } from '../../viajes/stores/useRutasStore';
import { useParaderosByRuta } from '../../viajes/stores/useRutasStore';
import httpClient from '../../config/httpClient';
import { getAuthUserId } from '../../config/httpClient';
import useSocketTracking, { type ProximityNotification } from '../../shared/hooks/useSocketTracking';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Subscription {
  id: number;
  citizenId: string;
  routeId: number;
  stopId: number;
  notificationMinutes: number;
  active: boolean;
  createdAt: string;
}

const NOTIFICATION_OPTIONS = [
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
];

const ProximityNotificationPage = () => {
  const { data: rutas, isLoading: loadingRutas } = useRutas();
  const userId = getAuthUserId();
  const citizenId = userId ?? '';

  const [selectedRouteId, setSelectedRouteId] = useState<number | ''>('');
  const [selectedStopId, setSelectedStopId] = useState<number | ''>('');
  const [notificationMinutes, setNotificationMinutes] = useState(10);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [proximityAlert, setProximityAlert] = useState<ProximityNotification | null>(null);

  const { data: paraderos } = useParaderosByRuta(
    selectedRouteId ? Number(selectedRouteId) : 0,
  );

  // Load subscriptions
  const loadSubscriptions = useCallback(async () => {
    if (!citizenId) return;
    try {
      const { data } = await httpClient.get(
        `${API_URL}/api/proximity/subscriptions/${citizenId}`,
      );
      setSubscriptions(data as Subscription[]);
    } catch {
      // Ignore
    }
  }, [citizenId]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Handle proximity notification from socket
  const handleProximity = useCallback((notification: ProximityNotification) => {
    setProximityAlert(notification);
    // Vibrate if possible
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Subscribe to citizenId-specific socket room for proximity
  const { connected } = useSocketTracking({
    subscribeAll: false,
    onProximityNotification: handleProximity,
  });

  // Also need to join a personal room - we'll handle this via the subscription
  useEffect(() => {
    if (connected && citizenId) {
      // The tracking gateway will send to the specific socket
      // For now, the proximity service sends to the citizen ID as socket ID
    }
  }, [connected, citizenId]);

  const handleSubscribe = async () => {
    if (!selectedRouteId || !selectedStopId || !citizenId) return;

    setSubscribing(true);
    try {
      await httpClient.post(`${API_URL}/api/proximity/subscribe`, {
        citizenId,
        routeId: Number(selectedRouteId),
        stopId: Number(selectedStopId),
        notificationMinutes,
      });
      setSnackbar({
        message: `Recibirás notificación cuando el bus esté a ${notificationMinutes} minutos del paradero`,
        severity: 'success',
      });
      loadSubscriptions();
      setSelectedRouteId('');
      setSelectedStopId('');
    } catch {
      setSnackbar({ message: 'Error al crear la suscripción', severity: 'error' });
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async (id: number) => {
    try {
      await httpClient.delete(`${API_URL}/api/proximity/unsubscribe/${id}`);
      setSnackbar({ message: 'Suscripción cancelada', severity: 'success' });
      loadSubscriptions();
    } catch {
      setSnackbar({ message: 'Error al cancelar suscripción', severity: 'error' });
    }
  };

  const sortedParaderos = paraderos
    ? [...paraderos].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <Box className="page-enter">
      <PageHeader
        title="Notificación de bus próximo"
        subtitle="Activa alertas para que te avisemos cuando tu bus esté cerca de tu paradero."
      />

      {/* Connection status */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: connected ? '#2e7d32' : '#d32f2f',
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {connected ? 'Recibiendo notificaciones en vivo' : 'Conectando...'}
        </Typography>
      </Stack>

      {/* Proximity Alert */}
      {proximityAlert && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              size="small"
              onClick={() => setProximityAlert(null)}
              color="inherit"
            >
              Cerrar
            </Button>
          }
        >
          <Typography variant="body1" fontWeight={700}>
            🚌 ¡Tu bus está cerca!
          </Typography>
          <Typography variant="body2">
            {proximityAlert.routeName} · Bus {proximityAlert.plate} · Llegada
            estimada: ~{proximityAlert.estimatedMinutes} min al paradero{' '}
            {proximityAlert.stopName}
          </Typography>
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Subscribe form */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Configurar alerta de proximidad
            </Typography>

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Selecciona una ruta</InputLabel>
                <Select
                  value={selectedRouteId}
                  label="Selecciona una ruta"
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedStopId('');
                  }}
                >
                  {rutas?.map((ruta) => (
                    <MenuItem key={ruta.id} value={ruta.id}>
                      {ruta.name} ({ruta.origin} → {ruta.destination})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" disabled={!selectedRouteId}>
                <InputLabel>Selecciona tu paradero</InputLabel>
                <Select
                  value={selectedStopId}
                  label="Selecciona tu paradero"
                  onChange={(e) => setSelectedStopId(e.target.value)}
                >
                  {sortedParaderos.map((p) => (
                    <MenuItem key={p.stop_id} value={p.stop_id}>
                      {p.stop.name} ({p.stop.address})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>¿Con cuánta anticipación?</InputLabel>
                <Select
                  value={notificationMinutes}
                  label="¿Con cuánta anticipación?"
                  onChange={(e) => setNotificationMinutes(Number(e.target.value))}
                >
                  {NOTIFICATION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<NotificationsActiveRounded />}
                onClick={handleSubscribe}
                disabled={!selectedRouteId || !selectedStopId || subscribing || !citizenId}
                fullWidth
              >
                {subscribing ? 'Configurando...' : 'Activar notificación'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Active subscriptions */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Mis alertas activas
            </Typography>

            {subscriptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tienes alertas de proximidad activas. Configura una para
                recibir notificaciones cuando tu bus esté cerca.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {subscriptions.map((sub) => {
                  const ruta = rutas?.find((r) => r.id === sub.routeId);
                  const paradero = sortedParaderos.find(
                    (p) => p.stop_id === sub.stopId,
                  );
                  return (
                    <Paper key={sub.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            🚌 {ruta?.name ?? `Ruta #${sub.routeId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            📍 Paradero: {paradero?.stop.name ?? `#${sub.stopId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ⏰ Notificar {sub.notificationMinutes} min antes
                          </Typography>
                          <Chip
                            label="Activa"
                            size="small"
                            color="success"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<NotificationsOffRounded />}
                          onClick={() => handleUnsubscribe(sub.id)}
                        >
                          Desactivar
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? 'info'}
          variant="filled"
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProximityNotificationPage;
