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
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useParaderosCercanos } from "../stores/useParaderosStore";
import { useNearbyStopsWatcher } from "../hooks/useNearbyStopsWatcher";
import MapaParaderosCercanos from "../components/MapaParaderosCercanos";
import { formatDistance } from "../../shared/utils/format";
import type { ParaderoCercano } from "../services/paraderosService";

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
          {formatDistance(paradero.distance)}
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
  const { userLocation, locationError, isLocating, requestLocation } =
    useNearbyStopsWatcher();

  const { data: paraderos, isLoading, isError } = useParaderosCercanos(
    userLocation?.lat ?? 0,
    userLocation?.lng ?? 0
  );

  const mapCenter = useMemo((): [number, number] => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return [-12.0464, -77.0428];
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
        <MapaParaderosCercanos
          userLocation={userLocation}
          paraderos={paraderos}
          center={mapCenter}
        />

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
