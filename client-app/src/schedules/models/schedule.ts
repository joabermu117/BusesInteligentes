export type ScheduleStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ScheduleRecurrence =
  | "none"
  | "weekdays"
  | "weekends"
  | "daily";

export interface Schedule {
  id: number;
  routeId: number;
  departureTime: string;
  date?: string;
  toleranceMinutes?: number;
  status: ScheduleStatus;
  recurrence: ScheduleRecurrence;
  bus?: {
    id: number;
    plate: string;
    model: string;
    company?: {
      id: number;
      nombre: string;
      email?: string;
    };
  };
  route?: {
    id: number;
    name: string;
    origin: string;
    destination: string;
  };
}

export interface CreateSchedulePayload {
  busId: number;
  routeId: number;
  departureTime: string;
  date?: string;
  toleranceMinutes?: number;
  status?: ScheduleStatus;
  recurrence?: ScheduleRecurrence;
}

export interface UpdateSchedulePayload {
  busId?: number;
  routeId?: number;
  departureTime?: string;
  date?: string;
  toleranceMinutes?: number;
  status?: ScheduleStatus;
  recurrence?: ScheduleRecurrence;
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: "Programado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const SCHEDULE_STATUS_COLORS: Record<
    ScheduleStatus,
  "info" | "warning" | "success" | "error"
> = {
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
};

export const SCHEDULE_RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  none: "Sin recurrencia",
  weekdays: "Lunes a viernes",
  weekends: "Fines de semana",
  daily: "Diaria",
};

export const SCHEDULE_RECURRENCE_OPTIONS: {
  value: ScheduleRecurrence;
  label: string;
}[] = [
  { value: "none", label: "Sin recurrencia" },
  { value: "weekdays", label: "Lunes a viernes" },
  { value: "weekends", label: "Fines de semana" },
  { value: "daily", label: "Diaria" },
];

export const SCHEDULE_STATUS_OPTIONS: {
  value: ScheduleStatus;
  label: string;
}[] = [
  { value: "scheduled", label: "Programado" },
  { value: "in_progress", label: "En curso" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];