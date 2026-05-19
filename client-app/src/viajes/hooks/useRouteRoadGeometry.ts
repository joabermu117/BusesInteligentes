import { useCallback, useRef, useState } from "react";

export type RoadGeometry = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

type Waypoint = { lat: number; lng: number };

export const useRouteRoadGeometry = () => {
  const [geometry, setGeometry] = useState<RoadGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRoute = useCallback(async (waypoints: Waypoint[]) => {
    if (waypoints.length < 2) {
      setGeometry(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setFailed(false);

    try {
      const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("OSRM request failed");

      const data = await res.json();

      if (!data.routes?.[0]) {
        setGeometry(null);
        setFailed(true);
        return;
      }

      const route = data.routes[0];
      const coordsGeo: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: number[]) => [lat, lng] as [number, number],
      );

      setGeometry({
        coordinates: coordsGeo,
        distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
        durationMin: Math.round(route.duration / 60),
      });
      setFailed(false);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setGeometry(null);
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geometry, isLoading, failed, fetchRoute };
};
