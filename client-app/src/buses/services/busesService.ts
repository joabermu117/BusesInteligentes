import httpClient from "../../config/httpClient";
import type { Bus, CreateBusPayload, UpdateBusPayload } from "../models/bus";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchBuses = async (): Promise<Bus[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/buses`);
  return data;
};

export const fetchBusById = async (id: number): Promise<Bus> => {
  const { data } = await httpClient.get(`${API_URL}/api/buses/${id}`);
  return data;
};

export const fetchBusesByCompany = async (
  companyId: number,
): Promise<Bus[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/buses/company/${companyId}`,
  );
  return data;
};

export const createBus = async (payload: CreateBusPayload): Promise<Bus> => {
  const { data } = await httpClient.post(`${API_URL}/api/buses`, payload);
  return data;
};

export const updateBus = async (
  id: number,
  payload: UpdateBusPayload,
): Promise<Bus> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/buses/${id}`,
    payload,
  );
  return data;
};

export const deleteBus = async (id: number): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/buses/${id}`);
  return data;
};
