import CreditCardRounded from '@mui/icons-material/CreditCardRounded';
import GpsFixedRounded from '@mui/icons-material/GpsFixedRounded';
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
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUserId } from '../../../config/httpClient';
import useSocketTracking from '../../../shared/hooks/useSocketTracking';
import type { ProximityNotification } from '../../../shared/hooks/useSocketTracking';

/**
 * Global proximity notification listener.
 * Mount this once at the AppShell level. Shows a dialog with:
 *  - Bus info (route, plate, stop, ETA)
 *  - Button to go pay/board the bus
 *  - Button to view on map
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

  const handlePayAndBoard = () => {
    setNotification(null);
    navigate('/abordar');
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
      <DialogActions sx={{ px: 2.5, py: 1.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button onClick={handleDismiss} color="inherit" fullWidth>
          Descartar
        </Button>
        <Button
          variant="outlined"
          onClick={handleViewOnMap}
          fullWidth
          startIcon={<GpsFixedRounded />}
        >
          Ver en mapa
        </Button>
        <Button
          variant="contained"
          onClick={handlePayAndBoard}
          fullWidth
          startIcon={<CreditCardRounded />}
        >
          Pagar y abordar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalProximityListener;
