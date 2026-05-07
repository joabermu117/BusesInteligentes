import { useQuery } from "@tanstack/react-query";
import {
  fetchParaderosCercanos,
  type ParaderoCercano,
} from "../services/paraderosService";

export const useParaderosCercanos = (lat: number, lng: number) =>
  useQuery<ParaderoCercano[]>({
    queryKey: ["paraderos-cercanos", lat, lng],
    queryFn: () => fetchParaderosCercanos(lat, lng),
    enabled: !!lat && !!lng,
  });
