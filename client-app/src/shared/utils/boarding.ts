import type { Ticket, History } from "../../boletos/models/boletos";

export enum TicketStatus {
  ISSUED = "issued",
  USED = "used",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum ScheduleStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum HistoryAction {
  BOARDED = "boarded",
  VALIDATED = "validated",
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
}

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
