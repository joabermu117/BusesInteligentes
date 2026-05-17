import httpClient from "../../config/httpClient";
import type { Shift } from "../../boletos/models/boletos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface CreateShiftPayload {
  driverUserId: string;
  busId: number;
  startTime: string;
  endTime?: string;
  observations?: string;
}

export interface UpdateShiftPayload {
  driverUserId?: string;
  busId?: number;
  startTime?: string;
  endTime?: string;
  status?: string;
  observations?: string;
}

export const fetchAllShifts = async (): Promise<Shift[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/shifts`);
  return data;
};

export const fetchShiftById = async (id: number): Promise<Shift> => {
  const { data } = await httpClient.get(`${API_URL}/api/shifts/${id}`);
  return data;
};

export const createShift = async (
  payload: CreateShiftPayload,
): Promise<Shift> => {
  const { data } = await httpClient.post(`${API_URL}/api/shifts`, payload);
  return data;
};

export const updateShift = async (
  id: number,
  payload: UpdateShiftPayload,
): Promise<Shift> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/shifts/${id}`,
    payload,
  );
  return data;
};

export const deleteShift = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/shifts/${id}`);
  return data;
};
