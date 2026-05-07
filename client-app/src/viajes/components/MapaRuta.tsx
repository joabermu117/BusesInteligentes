import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import type { Paradero } from "../models/ruta";

interface MapaRutaProps {
  paraderos: Paradero[];
}

const MapaRuta = ({ paraderos }: MapaRutaProps) => {
  const sortedParaderos = useMemo(
    () => [...paraderos].sort((a, b) => a.order_index - b.order_index),
    [paraderos]
  );

  const center = useMemo(() => {
    if (sortedParaderos.length === 0) return [51.505, -0.09] as [number, number];
    const latAvg =
      sortedParaderos.reduce((sum, p) => sum + p.stop.latitude, 0) /
      sortedParaderos.length;
    const lngAvg =
      sortedParaderos.reduce((sum, p) => sum + p.stop.longitude, 0) /
      sortedParaderos.length;
    return [latAvg, lngAvg] as [number, number];
  }, [sortedParaderos]);

  const polylinePositions: [number, number][] = sortedParaderos.map(
    (p) => [p.stop.latitude, p.stop.longitude] as [number, number]
  );

  if (sortedParaderos.length === 0) {
    return (
      <div style={{ height: 400, display: "grid", placeItems: "center", color: "#888" }}>
        No hay paraderos registrados para esta ruta.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: 400, width: "100%", borderRadius: 8 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline
        positions={polylinePositions}
        color="#cf3b23"
        weight={3}
        opacity={0.8}
      />

      {sortedParaderos.map((paradero) => {
        const markerIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: #cf3b23;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 700;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${paradero.order_index}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        return (
          <Marker
            key={`${paradero.stop_id}-${paradero.order_index}`}
            position={[paradero.stop.latitude, paradero.stop.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{paradero.stop.name}</strong>
              <br />
              {paradero.stop.address}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapaRuta;
