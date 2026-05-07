import "leaflet/dist/leaflet.css";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import MyLocationRounded from "@mui/icons-material/MyLocationRounded";
import RouteRounded from "@mui/icons-material/RouteRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useParaderosCercanos } from "../stores/useParaderosStore";
import type { ParaderoCercano } from "../services/paraderosService";

type Coordinates = { lat: number; lng: number };

const STOP_ICON = L.divIcon({
  className: "custom-marker-stop",
  html: `<div style="
    background: #1976d2;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">P</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const USER_ICON = L.divIcon({
  className: "custom-marker-user",
  html: `<div style="
    background: #cf3b23;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  ">
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='white'>
      <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getDistanceLabel = (meters: number): string => {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const ParaderoCard = ({ paradero }: { paradero: ParaderoCercano }) => (
  <Card variant="outlined" sx={{ mb: 1.5 }}>
    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {paradero.name}
      </Typography>
      {paradero.address && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {paradero.address}
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
        <LocationOnRounded sx={{ fontSize: 16, color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          {getDistanceLabel(paradero.distance)}
        </Typography>
      </Box>
      {paradero.routeStops && paradero.routeStops.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, flexWrap: "wrap" }}>
          <RouteRounded sx={{ fontSize: 16, color: "text.secondary" }} />
          {paradero.routeStops.map((rs) => (
            <Chip
              key={rs.route_id}
              label={rs.route.name}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}
    </CardContent>
  </Card>
);

const ParaderosCercanos = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);

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
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("No se pudo obtener tu ubicación. Intenta de nuevo.");
            break;
          default:
            setLocationError("Error al obtener ubicación. Intenta de nuevo.");
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch position for auto-update when moving > 100m
  useEffect(() => {
    if (!navigator.geolocation || userLocation === null) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        if (userLocation) {
          const R = 6371000;
          const dLat = ((newLat - userLocation.lat) * Math.PI) / 180;
          const dLng = ((newLng - userLocation.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLocation.lat * Math.PI) / 180) *
              Math.cos((newLat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (distance > 100) {
            setUserLocation({ lat: newLat, lng: newLng });
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
    setWatchId(id);

    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: paraderos, isLoading, isError } = useParaderosCercanos(
    userLocation?.lat ?? 0,
    userLocation?.lng ?? 0
  );

  const mapCenter = useMemo((): [number, number] => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return [-12.0464, -77.0428]; // Lima center as default
  }, [userLocation]);

  if (isLocating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 8 }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Obteniendo tu ubicación...
        </Typography>
      </Box>
    );
  }

  if (locationError) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Paraderos cercanos
        </Typography>
        <Card variant="outlined" sx={{ p: 3, textAlign: "center" }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {locationError}
          </Typography>
          <Button
            variant="contained"
            startIcon={<MyLocationRounded />}
            onClick={requestLocation}
          >
            Reintentar
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Paraderos cercanos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {userLocation && (
          <>
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)} &mdash;
            {isLoading
              ? " buscando paraderos..."
              : ` ${paraderos?.length ?? 0} paradero(s) encontrado(s)`}
          </>
        )}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* Map */}
        <Box sx={{ height: 500, borderRadius: 2, overflow: "hidden" }}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
                <Popup>Tu ubicación</Popup>
              </Marker>
            )}
            {paraderos?.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={STOP_ICON}
              >
                <Popup>
                  <strong>{p.name}</strong>
                  <br />
                  {getDistanceLabel(p.distance)} de ti
                  {p.address && (
                    <>
                      <br />
                      {p.address}
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Box>

        {/* List */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<MyLocationRounded />}
              onClick={requestLocation}
              size="small"
            >
              Actualizar ubicación
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Card variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Typography color="error">
                Error al buscar paraderos cercanos. Intenta de nuevo.
              </Typography>
            </Card>
          ) : paraderos && paraderos.length > 0 ? (
            <List sx={{ pt: 0 }}>
              {paraderos.map((paradero) => (
                <ListItem key={paradero.id} disablePadding sx={{ display: "block" }}>
                  <ParaderoCard paradero={paradero} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Card variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No se encontraron paraderos cercanos.
              </Typography>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ParaderosCercanos;
