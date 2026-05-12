import httpClient from "../../config/httpClient";
import type {
  CreatePaymentMethodPayload,
  PaymentMethod,
  UpdatePaymentMethodPayload,
} from "../models/paymentMethod";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/payment-methods`);
  return data;
};

export const fetchPaymentMethodById = async (
  id: number,
): Promise<PaymentMethod> => {
  const { data } = await httpClient.get(`${API_URL}/api/payment-methods/${id}`);
  return data;
};

export const createPaymentMethod = async (
  payload: CreatePaymentMethodPayload,
): Promise<PaymentMethod> => {
  const { data } = await httpClient.post(
    `${API_URL}/api/payment-methods`,
    payload,
  );
  return data;
};

export const updatePaymentMethod = async (
  id: number,
  payload: UpdatePaymentMethodPayload,
): Promise<PaymentMethod> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/payment-methods/${id}`,
    payload,
  );
  return data;
};

export const deletePaymentMethod = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(
    `${API_URL}/api/payment-methods/${id}`,
  );
  return data;
};
