import AddRounded from "@mui/icons-material/AddRounded";
import { Box, Chip, Typography } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { memo, useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Stop } from "../models/stop";
import type { RoadGeometry } from "../hooks/useRouteRoadGeometry";

// ── Iconos ────────────────────────────────────────────────────────
const ICON_AVAILABLE = L.divIcon({
  className: "custom-marker-available",
  html: `<div style="background:#90caf9;color:#1565c0;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;">+</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const ICON_SELECTED = (index: number) =>
  L.divIcon({
    className: "custom-marker-selected",
    html: `<div style="background:#cf3b23;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(207,59,35,0.4);">${index}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const ICON_ORIGIN = L.divIcon({
  className: "custom-marker-origin",
  html: `<div style="background:#2e7d32;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(46,125,50,0.5);">O</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const ICON_DESTINATION = L.divIcon({
  className: "custom-marker-destination",
  html: `<div style="background:#d32f2f;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(211,47,47,0.5);">D</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// ── Ajusta bounds del mapa ───────────────────────────────────────
const AutoFitBounds = ({
  points,
}: {
  points: { lat: number; lng: number }[];
}) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map((p) => [p.lat, p.lng] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
};

// ── Tipos ─────────────────────────────────────────────────────────
export type SelectedStopData = {
  stop_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type MapaSeleccionRutaProps = {
  allStops: Stop[];
  selectedStops: SelectedStopData[];
  geometry: RoadGeometry | null;
  isGeometryLoading: boolean;
  onToggleStop: (stop: Stop) => void;
};

const MapaSeleccionRuta = memo(
  ({
    allStops,
    selectedStops,
    geometry,
    isGeometryLoading,
    onToggleStop,
  }: MapaSeleccionRutaProps) => {
    const selectedIds = useMemo(
      () => new Set(selectedStops.map((s) => s.stop_id)),
      [selectedStops],
    );

    const allPoints = useMemo(() => {
      if (allStops.length > 0) {
        return allStops.map((s) => ({
          lat: s.latitude,
          lng: s.longitude,
        }));
      }
      // Si no hay allStops (vista ciudadano), usar los selectedStops
      return selectedStops.map((s) => ({
        lat: s.latitude,
        lng: s.longitude,
      }));
    }, [allStops, selectedStops]);

    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 420,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <MapContainer
          center={[-12.0464, -77.0428]}
          zoom={12}
          style={{ height: "100%", width: "100%", minHeight: 420 }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitBounds points={allPoints} />

          {/* Línea de la ruta POR CALLES usando geometría de OSRM */}
          {geometry && geometry.coordinates.length >= 2 && (
            <Polyline
              positions={geometry.coordinates}
              color="#cf3b23"
              weight={4}
              opacity={0.9}
            />
          )}

          {/* Indicador de carga mientras OSRM resuelve */}
          {isGeometryLoading && selectedStops.length >= 2 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 1000,
                background: "rgba(255,255,255,0.9)",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#666",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              Calculando ruta...
            </div>
          )}

          {/* Marcadores de stops seleccionados (vista ciudadano: cuando allStops está vacío) */}
          {allStops.length === 0 &&
            selectedStops.map((stop, idx) => {
              let icon = ICON_SELECTED(idx + 1);
              if (idx === 0) icon = ICON_ORIGIN;
              else if (idx === selectedStops.length - 1) icon = ICON_DESTINATION;

              return (
                <Marker
                  key={stop.stop_id}
                  position={[stop.latitude, stop.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {stop.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stop.address}
                      </Typography>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}

          {/* Marcadores de todos los stops disponibles (vista admin) */}
          {allStops.map((stop) => {
            const selIdx = selectedStops.findIndex(
              (s) => s.stop_id === stop.id,
            );
            const isSelected = selIdx !== -1;

            let icon = ICON_AVAILABLE;
            if (isSelected) {
              if (selIdx === 0) icon = ICON_ORIGIN;
              else if (selIdx === selectedStops.length - 1) icon = ICON_DESTINATION;
              else icon = ICON_SELECTED(selIdx + 1);
            }

            return (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={icon}
                eventHandlers={{ click: () => onToggleStop(stop) }}
              >
                <Popup>
                  <Box sx={{ minWidth: 180 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {stop.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stop.address}
                    </Typography>
                    {isSelected ? (
                      <Chip
                        label={`#${selIdx + 1} en ruta — Quitar`}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ mt: 1, fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        label="Agregar a ruta"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1, fontWeight: 600 }}
                        icon={<AddRounded sx={{ fontSize: 14 }} />}
                      />
                    )}
                  </Box>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Box>
    );
  },
);

MapaSeleccionRuta.displayName = "MapaSeleccionRuta";
export default MapaSeleccionRuta;
