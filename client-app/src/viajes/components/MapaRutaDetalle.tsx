import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import type { Paradero } from "../models/ruta";

interface MapaRutaDetalleProps {
  paraderos: Paradero[];
  boardedNodeId: number | null;
  validatedNodeId: number | null;
}

const BOARDING_ICON = L.divIcon({
  className: "custom-marker-boarding",
  html: `<div style="background:#2e7d32;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">A</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ALIGHTING_ICON = L.divIcon({
  className: "custom-marker-alighting",
  html: `<div style="background:#d32f2f;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">D</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const STOP_ICON = L.divIcon({
  className: "custom-marker-stop",
  html: `<div style="background:#cf3b23;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">P</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const MapaRutaDetalle = ({ paraderos, boardedNodeId, validatedNodeId }: MapaRutaDetalleProps) => {
  const sorted = useMemo(
    () => [...paraderos].sort((a, b) => a.order_index - b.order_index),
    [paraderos]
  );

  const center = useMemo((): [number, number] => {
    if (sorted.length === 0) return [-12.0464, -77.0428];
    const lat = sorted.reduce((s, p) => s + p.stop.latitude, 0) / sorted.length;
    const lng = sorted.reduce((s, p) => s + p.stop.longitude, 0) / sorted.length;
    return [lat, lng];
  }, [sorted]);

  const polyline: [number, number][] = sorted.map(
    (p) => [p.stop.latitude, p.stop.longitude] as [number, number]
  );

  if (sorted.length === 0) {
    return (
      <div style={{ height: 400, display: "grid", placeItems: "center", color: "#888" }}>
        No hay paraderos registrados para esta ruta.
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={14} style={{ height: 400, width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={polyline} color="#cf3b23" weight={3} opacity={0.8} />
      {sorted.map((p) => {
        const isBoarding = p.stop_id === boardedNodeId;
        const isAlighting = p.stop_id === validatedNodeId;
        const icon = isAlighting ? ALIGHTING_ICON : isBoarding ? BOARDING_ICON : STOP_ICON;
        return (
          <Marker key={`${p.stop_id}-${p.order_index}`} position={[p.stop.latitude, p.stop.longitude]} icon={icon}>
            <Popup>
              <strong>{p.stop.name}</strong>
              <br />
              {p.stop.address}
              {isBoarding && <><br /><span style={{ color: "#2e7d32", fontWeight: 700 }}>★ Abordaje</span></>}
              {isAlighting && <><br /><span style={{ color: "#d32f2f", fontWeight: 700 }}>★ Descenso</span></>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapaRutaDetalle;
