export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  isPrepaid?: boolean;
}

export interface CreatePaymentMethodPayload {
  name: string;
  description?: string;
  isActive?: boolean;
  isPrepaid?: boolean;
}

export interface UpdatePaymentMethodPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  isPrepaid?: boolean;
}
