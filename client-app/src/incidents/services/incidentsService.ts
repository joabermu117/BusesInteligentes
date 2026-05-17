import httpClient from "../../config/httpClient";
import type {
  CreateIncidentBusPayload,
  CreateIncidentPayload,
  CreatePhotoPayload,
  Incident,
  IncidentBus,
  Photo,
  UpdateIncidentPayload,
} from "../models/incident";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Incidents
export const fetchIncidents = async (): Promise<Incident[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/incidents`);
  return data;
};

export const fetchIncidentById = async (id: number): Promise<Incident> => {
  const { data } = await httpClient.get(`${API_URL}/api/incidents/${id}`);
  return data;
};

export const createIncident = async (
  payload: CreateIncidentPayload,
): Promise<Incident> => {
  const { data } = await httpClient.post(`${API_URL}/api/incidents`, payload);
  return data;
};

export const updateIncident = async (
  id: number,
  payload: UpdateIncidentPayload,
): Promise<Incident> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/incidents/${id}`,
    payload,
  );
  return data;
};

export const deleteIncident = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/incidents/${id}`);
  return data;
};

// IncidentBuses
export const fetchIncidentBuses = async (): Promise<IncidentBus[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/incidents-buses`);
  return data;
};

export const fetchIncidentBusesByBus = async (
  busId: number,
): Promise<IncidentBus[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/incidents-buses/bus/${busId}`,
  );
  return data;
};

export const createIncidentBus = async (
  payload: CreateIncidentBusPayload,
): Promise<IncidentBus> => {
  const { data } = await httpClient.post(
    `${API_URL}/api/incidents-buses`,
    payload,
  );
  return data;
};

// Photos
export const createPhoto = async (
  payload: CreatePhotoPayload,
): Promise<Photo> => {
  const { data } = await httpClient.post(`${API_URL}/api/photos`, payload);
  return data;
};

export const deletePhoto = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/photos/${id}`);
  return data;
};