import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreatePaymentMethodPayload,
  PaymentMethod,
  UpdatePaymentMethodPayload,
} from "../models/paymentMethod";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
} from "../services/paymentMethodsService";

export const usePaymentMethods = () =>
  useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods,
  });

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentMethodPayload) =>
      createPaymentMethod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdatePaymentMethodPayload;
    }) => updatePaymentMethod(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
};
