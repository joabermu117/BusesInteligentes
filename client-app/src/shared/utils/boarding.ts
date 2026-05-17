import type { Ticket, History } from "../../boletos/models/boletos";

export const TicketStatus = {
  ISSUED: "issued",
  USED: "used",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const ScheduleStatus = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const HistoryAction = {
  BOARDED: "boarded",
  VALIDATED: "validated",
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
} as const;
export type HistoryAction = (typeof HistoryAction)[keyof typeof HistoryAction];

/** Lee citizenId de localStorage con fallback */
export const getCitizenId = (): string =>
  localStorage.getItem("citizenId") ?? "default-citizen";

/** Filtra pasajeros activos (solo issued) */
export const countActivePassengers = (
  tickets?: { status?: string }[]
): number =>
  tickets?.filter((t) => t.status === TicketStatus.ISSUED).length ?? 0;

/** Encuentra el ticket activo del ciudadano */
export const findActiveTicket = (tickets?: Ticket[]): Ticket | null =>
  tickets?.find((t) => t.status === TicketStatus.ISSUED) ?? null;

/** Encuentra historial por acción */
export const findHistoryByAction = (
  history: History[] | undefined,
  action: string
) => history?.find((h) => h.action === action);
