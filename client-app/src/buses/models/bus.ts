export type BusStatus = "operative" | "maintenance" | "out_of_service";

export interface Bus {
  id: number;
  plate: string;
  model: string;
  year: number;
  totalCapacity: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  photo?: string;
  qrCode?: string;
  status: BusStatus;
  company?: {
    id: number;
    nombre: string;
    nit: string;
    email?: string;
  };
  gps?: {
    id: number;
    latitude: number;
    longitude: number;
  };
}

export interface CreateBusPayload {
  plate: string;
  model: string;
  year: number;
  totalCapacity: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  photo?: string;
  status?: BusStatus;
  companyId: number;
}

export interface UpdateBusPayload {
  plate?: string;
  model?: string;
  year?: number;
  totalCapacity?: number;
  seatedCapacity?: number;
  standingCapacity?: number;
  photo?: string;
  status?: BusStatus;
  companyId?: number;
}

export const BUS_STATUS_OPTIONS: { value: BusStatus; label: string }[] = [
  { value: "operative", label: "Operativo" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "out_of_service", label: "Fuera de servicio" },
];

export const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  operative: "Operativo",
  maintenance: "Mantenimiento",
  out_of_service: "Fuera de servicio",
};
