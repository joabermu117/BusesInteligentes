import httpClient from "../../config/httpClient";
import type { Paradero, Ruta } from "../models/ruta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchRutas = async (name?: string): Promise<Ruta[]> => {
  const params = name ? { name } : {};
  const { data } = await httpClient.get(`${API_URL}/api/routes`, { params });
  return data;
};

export const fetchRutaById = async (id: number): Promise<Ruta> => {
  const { data } = await httpClient.get(`${API_URL}/api/routes/${id}`);
  return data;
};

export const fetchParaderosByRuta = async (
  routeId: number
): Promise<Paradero[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/routes/${routeId}/stops`
  );
  return data;
};
