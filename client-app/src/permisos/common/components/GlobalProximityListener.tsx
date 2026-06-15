import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUserId } from '../../../config/httpClient';
import useSocketTracking from '../../../shared/hooks/useSocketTracking';
import type { ProximityNotification } from '../../../shared/hooks/useSocketTracking';

/**
 * Global proximity notification listener.
 * Mount this once at the AppShell level — it will:
 *  1. Join the citizen's personal room for proximity alerts.
 *  2. Show a Dialog when a bus proximity notification arrives,
 *     regardless of which page the user is on.
 *  3. Provide a button to "Ver en mapa" that navigates to the tracking page.
 */
const GlobalProximityListener = () => {
  const navigate = useNavigate();
  const citizenId = getAuthUserId() ?? '';
  const [notification, setNotification] = useState<ProximityNotification | null>(null);

  const handleProximity = useCallback((n: ProximityNotification) => {
    setNotification(n);
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const { connected, socket } = useSocketTracking({
    subscribeAll: false,
    onProximityNotification: handleProximity,
  });

  // Join personal room when connected
  useEffect(() => {
    if (connected && citizenId && socket) {
      socket.emit('join', { citizenId });
    }
  }, [connected, citizenId, socket]);

  const handleViewOnMap = () => {
    setNotification(null);
    navigate('/buses/tracking');
  };

  const handleDismiss = () => {
    setNotification(null);
  };

  return (
    <Dialog
      open={!!notification}
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
        {notification && (
          <>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
              {notification.routeName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Bus: <strong>{notification.plate}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Paradero: <strong>{notification.stopName}</strong>
            </Typography>
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Llegada estimada en ~{notification.estimatedMinutes} minutos
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={handleDismiss} color="inherit">
          Descartar
        </Button>
        <Button
          variant="contained"
          onClick={handleViewOnMap}
          startIcon={
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          }
        >
          Ver en mapa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalProximityListener;
