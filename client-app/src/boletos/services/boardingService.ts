import httpClient from "../../config/httpClient";
import type {
  BoardBusResponse,
  AlightBusResponse,
  ValidatePaymentResponse,
  Schedule,
  CitizenPaymentMethod,
  Ticket,
} from "../models/boletos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const boardBus = async (
  citizenId: string,
  scheduleId: number,
  paymentMethodId: number,
  stopId: number
): Promise<BoardBusResponse> => {
  const { data } = await httpClient.post(`${API_URL}/api/boarding/board`, {
    citizenId,
    scheduleId,
    paymentMethodId,
    stopId,
  });
  return data;
};

export const alightBus = async (
  ticketId: number,
  stopId: number,
  citizenId: string
): Promise<AlightBusResponse> => {
  const { data } = await httpClient.post(`${API_URL}/api/boarding/alight`, {
    ticketId,
    stopId,
    citizenId,
  });
  return data;
};

export const validatePayment = async (
  citizenId: string,
  paymentMethodId: number
): Promise<ValidatePaymentResponse> => {
  const { data } = await httpClient.post(
    `${API_URL}/api/boarding/validate-payment`,
    { citizenId, paymentMethodId }
  );
  return data;
};

export const fetchActiveSchedules = async (): Promise<Schedule[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/schedules`);
  return data.filter(
    (s: Schedule) =>
      s.status === "in_progress" || s.status === "scheduled"
  );
};

export const fetchPaymentMethodsByCitizen = async (
  citizenId: string
): Promise<CitizenPaymentMethod[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/citizen-payment-methods/citizen/${citizenId}`
  );
  return data;
};

export const fetchTicketsByCitizen = async (
  citizenId: string
): Promise<Ticket[]> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/tickets/by-person/${citizenId}`
  );
  return data;
};

export const fetchActiveTicket = async (
  citizenId: string
): Promise<Ticket | null> => {
  const tickets = await fetchTicketsByCitizen(citizenId);
  return tickets.find((t: Ticket) => t.status === "issued") ?? null;
};
