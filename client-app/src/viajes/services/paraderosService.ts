import httpClient from "../../config/httpClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface ParaderoCercano {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  is_active: boolean;
  distance: number;
  routeStops: {
    route_id: number;
    stop_id: number;
    order_index: number;
    route: {
      id: number;
      name: string;
    };
  }[];
}

export const fetchParaderosCercanos = async (
  lat: number,
  lng: number
): Promise<ParaderoCercano[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/stops/nearest`, {
    params: { lat, lng },
  });
  return data;
};
