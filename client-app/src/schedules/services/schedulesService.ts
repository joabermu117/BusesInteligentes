import httpClient from "../../config/httpClient";
import type {
  CreateSchedulePayload,
  Schedule,
  UpdateSchedulePayload,
} from "../models/schedule";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchSchedules = async (): Promise<Schedule[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/schedules`);
  return data;
};

export const fetchScheduleById = async (id: number): Promise<Schedule> => {
  const { data } = await httpClient.get(`${API_URL}/api/schedules/${id}`);
  return data;
};

export const fetchSchedulesByBus = async (
  busId: number,
): Promise<Schedule[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/schedules/bus/${busId}`,
  );
  return data;
};

export const fetchSchedulesByRoute = async (
  routeId: number,
): Promise<Schedule[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/schedules/route/${routeId}`,
  );
  return data;
};

export const createSchedule = async (
  payload: CreateSchedulePayload,
): Promise<Schedule> => {
  const { data } = await httpClient.post(`${API_URL}/api/schedules`, payload);
  return data;
};

export const updateSchedule = async (
  id: number,
  payload: UpdateSchedulePayload,
): Promise<Schedule> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/schedules/${id}`,
    payload,
  );
  return data;
};

export const deleteSchedule = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/schedules/${id}`);
  return data;
};