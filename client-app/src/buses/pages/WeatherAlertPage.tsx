import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded';
import UmbrellaRounded from '@mui/icons-material/UmbrellaRounded';
import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../permisos/common/components/PageHeader';
import httpClient, { getAuthUserId } from '../../config/httpClient';
import { useSocketTracking } from '../../shared/hooks/useSocketTracking';
import type { BusAlert } from '../../shared/hooks/useSocketTracking';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WeatherPreference {
  id?: number;
  citizenId: string;
  weatherAlertsEnabled: boolean;
  habitualTravelTime: string;
  city: string;
  preferredChannel: string;
}

interface ForecastResult {
  location: { name: string; country: string } | null;
  forecast: {
    temperature: number;
    condition: string;
    precipitationProbability: number;
    windSpeed: number;
    humidity: number;
    icon: string;
  } | null;
  rainLikely: boolean;
}

const CHANNEL_OPTIONS = [
  { value: 'push', label: 'Notificación Push' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const WeatherAlertPage = () => {
  const userId = getAuthUserId();
  const citizenId = userId ?? '';

  const [prefs, setPrefs] = useState<WeatherPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [lastNotification, setLastNotification] = useState<{
    message: string;
    timestamp: string;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [travelTime, setTravelTime] = useState('07:00');
  const [city, setCity] = useState('Manizales');
  const [channel, setChannel] = useState('push');

  // Load preferences
  const loadPrefs = useCallback(async () => {
    if (!citizenId) return;
    try {
      const { data } = await httpClient.get(
        `${API_URL}/api/weather/preferences/${citizenId}`,
      );
      if (data) {
        setPrefs(data);
        setEnabled(data.weatherAlertsEnabled ?? false);
        setTravelTime(data.habitualTravelTime || '07:00');
        setCity(data.city || 'Manizales');
        setChannel(data.preferredChannel || 'push');
      }
    } catch {
      // Not found = first time
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  // Listen for weather alerts via socket
  const handleAlert = useCallback((alert: BusAlert) => {
    if (alert.type === 'weather_alert') {
      setLastNotification({
        message: alert.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  useSocketTracking({
    subscribeAll: false,
    onBusAlert: handleAlert,
  });

  // Listen for weather notifications from the main socket
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socket = new WebSocket(`ws://${socketUrl.replace('http://', '').replace('https://', '')}`);

    // Listen for notifications
    const handleNotification = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'weather_alert' && data.citizenId === citizenId) {
          setLastNotification({
            message: data.message,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } catch {}
    };

    // For socket.io we need a different approach - this will be handled by the notification gateway
    // For now, we simulate with the tracking socket

    return () => {
      socket.close();
    };
  }, [citizenId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        citizenId,
        weatherAlertsEnabled: enabled,
        habitualTravelTime: travelTime,
        city,
        preferredChannel: channel,
      };

      if (prefs?.id) {
        await httpClient.put(
          `${API_URL}/api/weather/preferences/${citizenId}`,
          payload,
        );
      } else {
        await httpClient.post(
          `${API_URL}/api/weather/preferences/${citizenId}`,
          payload,
        );
      }

      setSnackbar({
        message: enabled
          ? 'Alertas de clima activadas. Recibirás información cada mañana.'
          : 'Alertas de clima desactivadas.',
        severity: 'success',
      });
      loadPrefs();
    } catch {
      setSnackbar({ message: 'Error al guardar preferencias', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckWeather = async () => {
    setCheckingWeather(true);
    try {
      const { data } = await httpClient.get(
        `${API_URL}/api/weather/forecast/${encodeURIComponent(city)}`,
      );
      setForecast(data as ForecastResult);
    } catch {
      setSnackbar({ message: 'Error al consultar el clima', severity: 'error' });
    } finally {
      setCheckingWeather(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <PageHeader
        title="Alertas de clima"
        subtitle="Activa las alertas meteorológicas para planificar mejor tus viajes."
      />

      {/* Last notification banner */}
      {lastNotification && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => setLastNotification(null)}
            >
              Cerrar
            </Button>
          }
        >
          <Typography variant="body2" fontWeight={600}>
            🌤️ Última alerta de clima ({lastNotification.timestamp})
          </Typography>
          <Typography variant="body2">{lastNotification.message}</Typography>
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Settings form */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Configurar alertas de clima
            </Typography>

            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Activar alertas de clima
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recibe información del clima cada mañana antes de viajar
                    </Typography>
                  </Box>
                }
              />

              <Divider />

              <TextField
                label="Horario habitual de viaje"
                type="time"
                value={travelTime}
                onChange={(e) => setTravelTime(e.target.value)}
                disabled={!enabled}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                helperText="Recibirás la alerta hasta 2 horas antes de esta hora"
              />

              <TextField
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!enabled}
                helperText="Ciudad para la que deseas recibir el pronóstico"
              />

              <FormControl fullWidth disabled={!enabled}>
                <InputLabel>Canal de notificación</InputLabel>
                <Select
                  value={channel}
                  label="Canal de notificación"
                  onChange={(e: any) =>
                    setChannel(e.target.value)
                  }
                >
                  {CHANNEL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                fullWidth
              >
                {saving ? 'Guardando...' : 'Guardar preferencias'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Weather info panel */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Pronóstico del clima
            </Typography>

            <Button
              variant="outlined"
              onClick={handleCheckWeather}
              disabled={checkingWeather}
              startIcon={
                checkingWeather ? (
                  <CircularProgress size={16} />
                ) : (
                  <WbSunnyRounded />
                )
              }
              sx={{ mb: 3 }}
            >
              {checkingWeather
                ? 'Consultando...'
                : `Ver clima en ${city || 'Manizales'}`}
            </Button>

            {forecast?.forecast ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontSize: 48, mb: 1 }}>
                  {forecast.forecast.icon}
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {forecast.forecast.temperature}°C
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {forecast.forecast.condition}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">
                      Probabilidad de lluvia
                    </Typography>
                    <Chip
                      label={`${forecast.forecast.precipitationProbability}%`}
                      size="small"
                      color={
                        forecast.forecast.precipitationProbability > 50
                          ? 'warning'
                          : 'success'
                      }
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Viento</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {forecast.forecast.windSpeed} km/h
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Humedad</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {forecast.forecast.humidity}%
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {forecast.rainLikely ? (
                  <Alert severity="warning" icon={<UmbrellaRounded />}>
                    <Typography variant="body2" fontWeight={600}>
                      ¡No olvides tu paraguas! 🌧️
                    </Typography>
                    <Typography variant="caption">
                      Probabilidad de lluvia:{' '}
                      {forecast.forecast.precipitationProbability}%. Considera
                      salir 15 minutos antes.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="success">
                    <Typography variant="body2" fontWeight={600}>
                      Clima favorable ☀️
                    </Typography>
                    <Typography variant="caption">
                      Sin probabilidad significativa de lluvia. ¡Buen viaje!
                    </Typography>
                  </Alert>
                )}
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Presiona "Ver clima" para consultar el pronóstico del día.
              </Typography>
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

export default WeatherAlertPage;
