export interface Tarjeta {
  id: number;
  cardNumber?: string;
  cardHolder?: string;
  expirationDate?: string;
  isDefault: boolean;
  isActive: boolean;
  balance?: number;
  citizen?: { person_id: string };
  paymentMethod?: { id: number; name: string; description?: string };
}

export interface CreateTarjetaPayload {
  citizenId: string;
  paymentMethodId: number;
  cardNumber?: string;
  cardHolder?: string;
  expirationDate?: string;
  isDefault?: boolean;
}

export interface UpdateTarjetaPayload {
  cardNumber?: string;
  cardHolder?: string;
  expirationDate?: string;
  isDefault?: boolean;
  isActive?: boolean;
  paymentMethodId?: number;
}
