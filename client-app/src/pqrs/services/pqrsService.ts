import type { Pqrs, UpdatePqrsEstadoPayload } from "../models/pqrs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const N8N_ESTADO_URL =
  import.meta.env.VITE_N8N_PQRS_ESTADO_URL ||
  "http://localhost:5678/webhook/pqrs-estado";

export const fetchPqrsByRadicado = async (radicado: string): Promise<Pqrs> => {
  const res = await fetch(`${API_URL}/api/public/pqrs/${radicado}`);
  if (!res.ok) throw new Error("PQRS no encontrado");
  return await res.json();
};

export const fetchAllPqrs = async (): Promise<Pqrs[]> => {
  const res = await fetch(`${API_URL}/api/public/pqrs`);
  if (!res.ok) throw new Error("Error al obtener PQRS");
  return await res.json();
};

export const updatePqrsEstado = async (
  radicado: string,
  payload: UpdatePqrsEstadoPayload,
): Promise<void> => {
  await fetch(N8N_ESTADO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ radicado, ...payload }),
  });
};