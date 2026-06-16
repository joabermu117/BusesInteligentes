export type PqrsTipo = "Petición" | "Queja" | "Reclamo" | "Sugerencia";
export type PqrsCategoria = "Conductor" | "Bus" | "Ruta" | "Tarjeta" | "Otro";
export type PqrsEstado = "recibido" | "en_revision" | "en_proceso" | "resuelto";

export interface Pqrs {
  id: number;
  radicado: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  email: string;
  estado: PqrsEstado;
  respuesta?: string;
  tiempoRespuesta?: string;
  createdAt?: string;
  resolvedAt?: string;
  deadlineAt?: string;
}

export interface CreatePqrsPayload {
  tipo: PqrsTipo;
  categoria: PqrsCategoria;
  descripcion: string;
  email: string;
  fotos?: (string | null)[];
}

export interface UpdatePqrsEstadoPayload {
  estado: PqrsEstado;
  respuesta?: string;
}

export interface PqrsResponse {
  success: boolean;
  radicado: string;
  mensaje: string;
  tiempoRespuesta: string;
}

export const PQRS_TIPO_OPTIONS: PqrsTipo[] = [
  "Petición", "Queja", "Reclamo", "Sugerencia",
];

export const PQRS_CATEGORIA_OPTIONS: PqrsCategoria[] = [
  "Conductor", "Bus", "Ruta", "Tarjeta", "Otro",
];

export const PQRS_ESTADO_LABELS: Record<PqrsEstado, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export const PQRS_ESTADO_COLORS: Record<PqrsEstado, "default" | "info" | "warning" | "success"> = {
  recibido: "default",
  en_revision: "info",
  en_proceso: "warning",
  resuelto: "success",
};