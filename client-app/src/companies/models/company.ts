export interface Company {
  id: number;
  name: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}

export interface CreateCompanyPayload {
  name: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}

export interface UpdateCompanyPayload {
  name?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
}
