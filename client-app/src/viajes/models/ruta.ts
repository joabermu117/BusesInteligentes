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
  routeStops?: Paradero[];
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

export interface RouteStop {
  route_id: number;
  stop_id: number;
  order_index: number;
  stop?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  route?: {
    id: number;
    name: string;
  };
}

export interface CreateRoutePayload {
  name: string;
  description?: string;
  origin: string;
  destination: string;
  distance: number;
  estimated_duration: number;
  tarifa: number;
  is_active: boolean;
}

export interface UpdateRoutePayload {
  name?: string;
  description?: string;
  origin?: string;
  destination?: string;
  distance?: number;
  estimated_duration?: number;
  tarifa?: number;
  is_active?: boolean;
}

export interface AddRouteStopPayload {
  stop_id: number;
  order_index: number;
}