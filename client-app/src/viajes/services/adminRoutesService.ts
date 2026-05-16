import httpClient from "../../config/httpClient";
import type {
  AddRouteStopPayload,
  CreateRoutePayload,
  Ruta,
  Paradero,
  UpdateRoutePayload,
} from "../models/ruta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchAllRoutes = async (): Promise<Ruta[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/routes`);
  return data;
};

export const fetchRouteById = async (id: number): Promise<Ruta> => {
  const { data } = await httpClient.get(`${API_URL}/api/routes/${id}`);
  return data;
};

export const createRoute = async (
  payload: CreateRoutePayload,
): Promise<Ruta> => {
  const { data } = await httpClient.post(`${API_URL}/api/routes`, payload);
  return data;
};

export const updateRoute = async (
  id: number,
  payload: UpdateRoutePayload,
): Promise<Ruta> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/routes/${id}`,
    payload,
  );
  return data;
};

export const deleteRoute = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/routes/${id}`);
  return data;
};

export const addStopToRoute = async (
  routeId: number,
  payload: AddRouteStopPayload,
): Promise<Paradero> => {
  const { data } = await httpClient.post(
    `${API_URL}/api/routes/${routeId}/stops`,
    payload,
  );
  return data;
};

export const removeStopFromRoute = async (
  routeId: number,
  stopId: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(
    `${API_URL}/api/routes/${routeId}/stops/${stopId}`,
  );
  return data;
};