import { useCallback, useEffect, useRef, useState } from "react";

type Coordinates = { lat: number; lng: number };

const DISTANCE_THRESHOLD = 100; // meters

const haversineDistance = (a: Coordinates, b: Coordinates): number => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
};

interface UseNearbyStopsWatcherReturn {
  userLocation: Coordinates | null;
  locationError: string | null;
  isLocating: boolean;
  requestLocation: () => void;
}

export const useNearbyStopsWatcher = (): UseNearbyStopsWatcherReturn => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  const watchIdRef = useRef<number | null>(null);
  const latestLocationRef = useRef<Coordinates | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;

    clearWatch();

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const prev = latestLocationRef.current;
        if (
          !prev ||
          haversineDistance(prev, newPos) > DISTANCE_THRESHOLD
        ) {
          latestLocationRef.current = newPos;
          setUserLocation(newPos);
        }
      },
      () => {
        /* silent fail for watch */
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
    watchIdRef.current = id;
  }, [clearWatch]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta la geolocalización.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        latestLocationRef.current = pos;
        setUserLocation(pos);
        setIsLocating(false);
        // Start watching for movement after initial position is obtained
        startWatching();
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "No se pudo obtener tu ubicación. Intenta de nuevo."
            );
            break;
          default:
            setLocationError(
              "Error al obtener ubicación. Intenta de nuevo."
            );
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [startWatching]);

  // Initialize on mount
  useEffect(() => {
    requestLocation();
    return () => clearWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userLocation, locationError, isLocating, requestLocation };
};
