import CreditCardRounded from '@mui/icons-material/CreditCardRounded';
import GpsFixedRounded from '@mui/icons-material/GpsFixedRounded';
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUserId } from '../../../config/httpClient';
import useSocketTracking from '../../../shared/hooks/useSocketTracking';
import type { BusAlert, ProximityNotification } from '../../../shared/hooks/useSocketTracking';

interface WeatherAlertData {
  title: string;
  message: string;
  forecast?: { temperature: number; condition: string; icon: string };
  city?: string;
}

type GlobalNotification =
  | { kind: 'proximity'; data: ProximityNotification }
  | { kind: 'weather'; data: WeatherAlertData };

/**
 * Global notification listener.
 * Mount this once at the AppShell level. Handles:
 *  - Bus proximity alerts
 *  - Weather alerts (via busAlert with type 'weather_alert')
 */
const GlobalNotificationListener = () => {
  const navigate = useNavigate();
  const citizenId = getAuthUserId() ?? '';
  const [notification, setNotification] = useState<GlobalNotification | null>(null);

  const handleProximity = useCallback((n: ProximityNotification) => {
    setNotification({ kind: 'proximity', data: n });
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const handleBusAlert = useCallback((alert: BusAlert) => {
    if (alert.type === 'weather_alert') {
      setNotification({
        kind: 'weather',
        data: {
          title: alert.title ?? '☀️ Alerta del clima',
          message: alert.message,
          forecast: alert.forecast,
          city: alert.city,
        },
      });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const { connected, socket } = useSocketTracking({
    subscribeAll: false,
    onProximityNotification: handleProximity,
    onBusAlert: handleBusAlert,
  });

  // Join personal room when connected
  useEffect(() => {
    if (connected && citizenId && socket) {
      socket.emit('join', { citizenId });
    }
  }, [connected, citizenId, socket]);

  const handleDismiss = useCallback(() => setNotification(null), []);

  const isRainy = useMemo(
    () => notification?.kind === 'weather' && notification.data.message.includes('lloverá'),
    [notification],
  );

  return (
    <>
      {/* Proximity Dialog */}
      {notification?.kind === 'proximity' && (
        <Dialog
          open
          onClose={handleDismiss}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              borderTop: '4px solid',
              borderTopColor: 'info.main',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚌 ¡Tu bus está cerca!
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
              {notification.data.routeName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Bus: <strong>{notification.data.plate}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Paradero: <strong>{notification.data.stopName}</strong>
            </Typography>
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Llegada estimada en ~{notification.data.estimatedMinutes} minutos
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button onClick={handleDismiss} color="inherit" fullWidth>
              Descartar
            </Button>
            <Button
              variant="outlined"
              onClick={() => { setNotification(null); navigate('/buses/tracking'); }}
              fullWidth
              startIcon={<GpsFixedRounded />}
            >
              Ver en mapa
            </Button>
            <Button
              variant="contained"
              onClick={() => { setNotification(null); navigate('/abordar'); }}
              fullWidth
              startIcon={<CreditCardRounded />}
            >
              Pagar y abordar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Weather Alert Dialog */}
      {notification?.kind === 'weather' && (
        <Dialog
          open
          onClose={handleDismiss}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              borderTop: '4px solid',
              borderTopColor: isRainy ? 'warning.main' : 'success.main',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            {isRainy ? '🌧️' : '☀️'} {notification.data.title}
          </DialogTitle>
          <DialogContent dividers>
            {notification.data.forecast && (
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h3" sx={{ fontSize: 40 }}>
                    {notification.data.forecast.icon || (isRainy ? '🌧️' : '☀️')}
                  </Typography>
                  <Stack>
                    <Typography variant="h4" fontWeight={800}>
                      {notification.data.forecast.temperature}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {notification.data.forecast.condition}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            )}
            <Alert
              severity={isRainy ? 'warning' : 'success'}
              icon={isRainy ? <UmbrellaRounded /> : <WbSunnyRounded />}
            >
              {notification.data.message}
            </Alert>
            {notification.data.city && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Ciudad: {notification.data.city}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5 }}>
            <Button onClick={handleDismiss} variant="contained" fullWidth>
              Entendido
            </Button>
            <Button
              variant="outlined"
              onClick={() => { setNotification(null); navigate('/clima'); }}
              fullWidth
            >
              ⚙️ Configurar alertas
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default GlobalNotificationListener;
