export interface Ruta {
  id: number;
  name: string;
  description?: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_duration: number;
  tarifa: number;
  is_active: boolean;
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
