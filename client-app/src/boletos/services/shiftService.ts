import httpClient from "../../config/httpClient";
import type { Shift } from "../models/boletos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchShiftsByDriver = async (
  driverUserId: string
): Promise<Shift[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/shifts/driver/${driverUserId}`
  );
  return data;
};

export const fetchActiveShiftByDriver = async (
  driverUserId: string
): Promise<Shift | null> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/shifts/driver/${driverUserId}/active`
  );
  return data;
};

export const fetchActiveShiftByBus = async (busId: number): Promise<Shift | null> => {
  const { data } = await httpClient.get(`${API_URL}/api/shifts/bus/${busId}/active`);
  return data;
};

export const startShift = async (
  shiftId: number,
  dto: { busCondition?: string; observations?: string }
): Promise<Shift> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/shifts/${shiftId}/start`,
    dto
  );
  return data;
};
