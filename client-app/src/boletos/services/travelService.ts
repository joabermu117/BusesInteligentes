import httpClient from "../../config/httpClient";
import type { Ticket } from "../models/boletos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchTravelHistory = async (
  personId: string
): Promise<Ticket[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/tickets/by-person/${personId}`
  );
  return data;
};

export const fetchTravelDetail = async (id: number): Promise<Ticket> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/tickets/${id}/detail`
  );
  return data;
};
