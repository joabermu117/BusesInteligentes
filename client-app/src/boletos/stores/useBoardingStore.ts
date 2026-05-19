import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  boardBus,
  alightBus,
  validatePayment,
  fetchActiveSchedules,
  fetchPaymentMethodsByCitizen,
  fetchTicketsByCitizen,
  fetchActiveTicket,
} from "../services/boardingService";

export const useActiveSchedules = () =>
  useQuery({
    queryKey: ["schedules", "active"],
    queryFn: fetchActiveSchedules,
  });

export const usePaymentMethods = (citizenId: string) =>
  useQuery({
    queryKey: ["payment-methods", citizenId],
    queryFn: () => fetchPaymentMethodsByCitizen(citizenId),
    enabled: !!citizenId,
  });

export const useTicketsByCitizen = (citizenId: string) =>
  useQuery({
    queryKey: ["tickets", citizenId],
    queryFn: () => fetchTicketsByCitizen(citizenId),
    enabled: !!citizenId,
  });

export const useActiveTicket = (citizenId: string) =>
  useQuery({
    queryKey: ["tickets", "active", citizenId],
    queryFn: () => fetchActiveTicket(citizenId),
    enabled: !!citizenId,
  });

export const useBoardBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      citizenId,
      scheduleId,
      paymentMethodId,
      stopId,
    }: {
      citizenId: string;
      scheduleId: number;
      paymentMethodId: number;
      stopId: number;
    }) => boardBus(citizenId, scheduleId, paymentMethodId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["schedules", "active"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
    },
  });
};

export const useAlightBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      stopId,
      citizenId,
    }: {
      ticketId: number;
      stopId: number;
      citizenId: string;
    }) => alightBus(ticketId, stopId, citizenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useValidatePayment = () =>
  useMutation({
    mutationFn: ({
      citizenId,
      paymentMethodId,
    }: {
      citizenId: string;
      paymentMethodId: number;
    }) => validatePayment(citizenId, paymentMethodId),
  });
