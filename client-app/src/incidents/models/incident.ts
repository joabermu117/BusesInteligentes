export type IncidentType = "mechanical" | "accident" | "delay" | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "pending" | "in_review" | "resolved";

export interface Incident {
  id: number;
  type: IncidentType;
  severity: IncidentSeverity;
  description?: string;
  status: IncidentStatus;
  reportedAt?: string;
  resolvedAt?: string;
  supervisorComment?: string;
  incidentBuses?: IncidentBus[];
}

export interface IncidentBus {
  id: number;
  driverId?: number;
  shiftId?: number;
  latitude?: number;
  longitude?: number;
  reportedAt?: string;
  bus?: { id: number; plate: string; model: string };
  incident?: Incident;
  photos?: Photo[];
}

export interface Photo {
  id: number;
  url: string;
  description?: string;
  uploadedAt?: string;
}

export interface CreateIncidentPayload {
  type: IncidentType;
  severity: IncidentSeverity;
  description?: string;
}

export interface CreateIncidentBusPayload {
  busId: number;
  incidentId: number;
  driverId?: number;
  shiftId?: number;
  latitude?: number;
  longitude?: number;
}

export interface CreatePhotoPayload {
  url: string;
  description?: string;
  incidentBusId: number;
}

export interface UpdateIncidentPayload {
  type?: IncidentType;
  severity?: IncidentSeverity;
  description?: string;
  status?: IncidentStatus;
  supervisorComment?: string;
}

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  mechanical: "Mecánico",
  accident: "Accidente",
  delay: "Retraso",
  other: "Otro",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  critical: "Crítico",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  resolved: "Resuelto",
};

export const INCIDENT_TYPE_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: "mechanical", label: "Mecánico" },
  { value: "accident", label: "Accidente" },
  { value: "delay", label: "Retraso" },
  { value: "other", label: "Otro" },
];

export const INCIDENT_SEVERITY_OPTIONS: { value: IncidentSeverity; label: string }[] = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
  { value: "critical", label: "Crítico" },
];

export const INCIDENT_STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "in_review", label: "En revisión" },
  { value: "resolved", label: "Resuelto" },
];

export const INCIDENT_SEVERITY_COLORS: Record<IncidentSeverity, "success" | "warning" | "error" | "default"> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, "warning" | "info" | "success"> = {
  pending: "warning",
  in_review: "info",
  resolved: "success",
};