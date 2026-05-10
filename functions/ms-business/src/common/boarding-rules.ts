import { TicketStatus, ScheduleStatus } from "./enums";

/** Valida si un schedule permite abordaje */
export const canBoardSchedule = (status: string): boolean =>
  status === ScheduleStatus.SCHEDULED || status === ScheduleStatus.IN_PROGRESS;

/** Calcula asientos ocupados (solo issued) */
export const countActivePassengers = (tickets?: { status?: string }[]): number =>
  tickets?.filter((t) => t.status === TicketStatus.ISSUED).length ?? 0;

/** Verifica si el bus está lleno */
export const isBusFull = (
  tickets: { status?: string }[] | undefined,
  totalCapacity: number,
): boolean => countActivePassengers(tickets) >= totalCapacity;

/** Determina si un método de pago es prepago por su nombre */
export const isPrepaidMethod = (methodName?: string): boolean => {
  if (!methodName) return false;
  const lower = methodName.toLowerCase();
  return ['prepago', 'prepaid', 'tarjeta'].some((n) => lower.includes(n));
};

export { TicketStatus, ScheduleStatus };
