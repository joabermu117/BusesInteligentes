import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { formatDistance } from "../../shared/utils/format";
import type { ParaderoCercano } from "../services/paraderosService";

const STOP_ICON = L.divIcon({
  className: "custom-marker-stop",
  html: `<div style="background:#1976d2;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const USER_ICON = L.divIcon({
  className: "custom-marker-user",
  html: `<div style="background:#cf3b23;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='white'>
      <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapaParaderosCercanosProps {
  userLocation: { lat: number; lng: number } | null;
  paraderos: ParaderoCercano[] | undefined;
  center: [number, number];
}

const MapaParaderosCercanos = ({ userLocation, paraderos, center }: MapaParaderosCercanosProps) => (
  <Box sx={{ height: 500, borderRadius: 2, overflow: "hidden" }}>
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
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
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={STOP_ICON}>
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {formatDistance(p.distance)} de ti
            {p.address && <><br />{p.address}</>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </Box>
);

export default MapaParaderosCercanos;
