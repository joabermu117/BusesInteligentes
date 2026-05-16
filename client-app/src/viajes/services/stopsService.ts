import httpClient from "../../config/httpClient";
import type { CreateStopPayload, Stop, UpdateStopPayload } from "../models/stop";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchStops = async (): Promise<Stop[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/stops`);
  return data;
};

export const fetchStopById = async (id: number): Promise<Stop> => {
  const { data } = await httpClient.get(`${API_URL}/api/stops/${id}`);
  return data;
};

export const createStop = async (
  payload: CreateStopPayload,
): Promise<Stop> => {
  const { data } = await httpClient.post(`${API_URL}/api/stops`, payload);
  return data;
};

export const updateStop = async (
  id: number,
  payload: UpdateStopPayload,
): Promise<Stop> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/stops/${id}`,
    payload,
  );
  return data;
};

export const deleteStop = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/stops/${id}`);
  return data;
};