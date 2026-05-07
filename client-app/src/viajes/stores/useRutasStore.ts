import { useQuery } from "@tanstack/react-query";
import {
  fetchParaderosByRuta,
  fetchRutaById,
  fetchRutas,
} from "../services/rutasService";
import type { Paradero, Ruta } from "../models/ruta";

export const useRutas = (name?: string) =>
  useQuery<Ruta[]>({
    queryKey: ["rutas", name],
    queryFn: () => fetchRutas(name),
  });

export const useRuta = (id: number) =>
  useQuery<Ruta>({
    queryKey: ["ruta", id],
    queryFn: () => fetchRutaById(id),
    enabled: !!id,
  });

export const useParaderosByRuta = (routeId: number) =>
  useQuery<Paradero[]>({
    queryKey: ["paraderos", routeId],
    queryFn: () => fetchParaderosByRuta(routeId),
    enabled: !!routeId,
  });
