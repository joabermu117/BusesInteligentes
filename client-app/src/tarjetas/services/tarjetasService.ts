import httpClient from "../../config/httpClient";
import type {
  CreateTarjetaPayload,
  Tarjeta,
  UpdateTarjetaPayload,
} from "../models/tarjeta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchTarjetasByCitizen = async (
  citizenId: string,
): Promise<Tarjeta[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/citizen-payment-methods/citizen/${citizenId}`,
  );
  return data;
};

export const fetchTarjetaById = async (id: number): Promise<Tarjeta> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/citizen-payment-methods/${id}`,
  );
  return data;
};

export const createTarjeta = async (
  payload: CreateTarjetaPayload,
): Promise<Tarjeta> => {
  const { data } = await httpClient.post(
    `${API_URL}/api/citizen-payment-methods`,
    payload,
  );
  return data;
};

export const updateTarjeta = async (
  id: number,
  payload: UpdateTarjetaPayload,
): Promise<Tarjeta> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/citizen-payment-methods/${id}`,
    payload,
  );
  return data;
};

export const deleteTarjeta = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(
    `${API_URL}/api/citizen-payment-methods/${id}`,
  );
  return data;
};
