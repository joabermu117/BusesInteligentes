import httpClient from "../../config/httpClient";
import type { Driver } from "../models/driver";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchDrivers = async (): Promise<Driver[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/drivers`);
  return data;
};

export const fetchDriverById = async (personId: string): Promise<Driver> => {
  const { data } = await httpClient.get(`${API_URL}/api/drivers/${personId}`);
  return data;
};

export const createDriver = async (
  payload: { person_id: string; licenseNumber?: string },
): Promise<Driver> => {
  const { data } = await httpClient.post(`${API_URL}/api/drivers`, payload);
  return data;
};

export const updateDriver = async (
  personId: string,
  payload: Partial<Driver>,
): Promise<Driver> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/drivers/${personId}`,
    payload,
  );
  return data;
};

export const deactivateDriver = async (
  personId: string,
): Promise<{ message: string }> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/drivers/${personId}/deactivate`,
  );
  return data;
};

export const deleteDriver = async (
  personId: string,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/drivers/${personId}`);
  return data;
};
