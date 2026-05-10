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

export enum HistoryAction {
  BOARDED = 'boarded',
  VALIDATED = 'validated',
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}
