export interface Schedule {
  id: number;
  routeId: number;
  departureTime: string;
  toleranceMinutes?: number;
  status: string;
  recurrence: string;
  date?: string;
  bus?: Bus;
  tickets?: Ticket[];
}

export interface Bus {
  id: number;
  plate: string;
  model: string;
  year: number;
  totalCapacity: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  status: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  status: string;
  issuedDate: string;
  completedDate?: string;
  expirationDate?: string;
  price: number;
  qrCode?: string;
  isBoardingPass: boolean;
  citizen?: Citizen;
  schedule?: Schedule;
  history?: History[];
  driver?: DriverInfo | null;
}

export interface DriverInfo {
  person_id: string;
  licenseNumber?: string;
  driverUserId?: string;
}

export interface Citizen {
  person_id: string;
}

export interface CitizenPaymentMethod {
  id: number;
  cardNumber?: string;
  cardHolder?: string;
  expirationDate?: string;
  isDefault: boolean;
  isActive: boolean;
  paymentMethod?: PaymentMethod;
  citizen?: Citizen;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
}

export interface History {
  id: number;
  personId: string;
  timestamp: string;
  action: string;
  details?: string;
  nodeId?: string;
}

export interface BoardBusResponse {
  message: string;
  ticket: Ticket;
  remainingBalance: number;
}

export interface AlightBusResponse {
  message: string;
  ticket: Ticket;
}

export interface ValidatePaymentResponse {
  valid: boolean;
  balance?: number;
}

export interface Paradero {
  route_id: number;
  stop_id: number;
  order_index: number;
  stop: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Gps {
  id: number;
  latitude?: number;
  longitude?: number;
  lastUpdate?: string;
  active?: boolean;
}

export interface Shift {
  id: number;
  startTime?: string;
  endTime?: string;
  status: string;
  driverUserId?: string;
  observations?: string;
  busCondition?: string;
  driver?: Driver;
  bus?: Bus & { gps?: Gps };
}

export interface Driver {
  person_id: string;
  name?: string;
  licenseNumber?: string;
  licenseExpiration?: string;
  status?: string;
}
