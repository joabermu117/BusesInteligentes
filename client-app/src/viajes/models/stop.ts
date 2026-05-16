export interface Stop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  is_active: boolean;
}

export interface CreateStopPayload {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  is_active?: boolean;
}

export interface UpdateStopPayload {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  is_active?: boolean;
}