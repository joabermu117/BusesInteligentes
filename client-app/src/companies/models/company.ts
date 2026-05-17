export interface Company {
  id: number;
  nombre: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}

export interface CreateCompanyPayload {
  nombre: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}

export interface UpdateCompanyPayload {
  nombre?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}
