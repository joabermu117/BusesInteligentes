export enum TicketStatus {
  ISSUED = 'issued',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export enum HistoryAction {
  BOARDED = 'boarded',
  VALIDATED = 'validated',
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export enum BusStatus {
  OPERATIVE = 'operative',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum RouteRecurrence {
  NONE = 'none',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  DAILY = 'daily',
}
