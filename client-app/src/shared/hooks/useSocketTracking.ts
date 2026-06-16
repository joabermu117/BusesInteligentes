import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export interface BusLocationData {
  busId: number;
  plate: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  speed?: number;
  routeId?: number;
  routeName?: string;
  currentStopId?: number;
  currentStopName?: string;
  passengers?: number;
  status: string;
}

export interface BusAlert {
  type: string;
  busId: number;
  plate: string;
  message: string;
  severity: string;
  routeId?: number;
  // Weather alert fields
  title?: string;
  forecast?: { temperature: number; condition: string; icon: string };
  city?: string;
}

export interface ProximityNotification {
  busId: number;
  plate: string;
  routeName: string;
  estimatedMinutes: number;
  stopName: string;
  citizenId?: string;
  routeId?: number;
  stopId?: number;
}

interface UseSocketTrackingOptions {
  routeId?: number;
  subscribeAll?: boolean;
  onBusLocationUpdate?: (data: BusLocationData) => void;
  onActiveBusesUpdate?: (buses: BusLocationData[]) => void;
  onBusAlert?: (alert: BusAlert) => void;
  onProximityNotification?: (notification: ProximityNotification) => void;
}

export function useSocketTracking(options: UseSocketTrackingOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeBuses, setActiveBuses] = useState<BusLocationData[]>([]);
  const [lastAlert, setLastAlert] = useState<BusAlert | null>(null);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/tracking`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Conectado a tracking');
      setConnected(true);

      // Subscribe to specific route or all buses
      if (options.routeId) {
        socket.emit('subscribeRoute', { routeId: options.routeId });
      }
      if (options.subscribeAll) {
        socket.emit('subscribeAll');
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Desconectado de tracking');
      setConnected(false);
    });

    socket.on('busLocationUpdate', (data: BusLocationData) => {
      setActiveBuses((prev) => {
        const idx = prev.findIndex((b) => b.busId === data.busId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
      options.onBusLocationUpdate?.(data);
    });

    socket.on('activeBusesUpdate', (buses: BusLocationData[]) => {
      setActiveBuses(buses);
      options.onActiveBusesUpdate?.(buses);
    });

    socket.on('busAlert', (alert: BusAlert) => {
      setLastAlert(alert);
      options.onBusAlert?.(alert);
    });

    socket.on('busProximity', (notification: ProximityNotification) => {
      options.onProximityNotification?.(notification);
    });

    return () => {
      if (options.routeId) {
        socket.emit('unsubscribeRoute', { routeId: options.routeId });
      }
      if (options.subscribeAll) {
        socket.emit('unsubscribeAll');
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options.routeId, options.subscribeAll]);

  const clearAlert = useCallback(() => setLastAlert(null), []);
  const clearBuses = useCallback(() => setActiveBuses([]), []);

  return {
    connected,
    activeBuses,
    lastAlert,
    clearAlert,
    clearBuses,
    socket: socketRef.current,
  };
}

export default useSocketTracking;
