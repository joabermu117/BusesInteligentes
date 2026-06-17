import httpClient from "../../config/httpClient";
import type {
  AlertStats,
  CitizenSearchResult,
  CreateAlertPayload,
  GroupMessageRead,
  InboxItem,
  Message,
  ReadReceipt,
  RecipientPerson,
  SendGroupMessagePayload,
  SendPersonalMessagePayload,
  UnreadCount,
} from "../models/message";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ─── Personas ──────────────────────────────────────────────────────────────────

export const searchCitizens = async (
  q: string,
  excludePersonId?: string,
): Promise<CitizenSearchResult[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/citizens/search`, {
    params: { q, excludePersonId },
  });
  return data;
};

// ─── Mensajes directos ─────────────────────────────────────────────────────────

export const sendPersonalMessage = async (payload: SendPersonalMessagePayload): Promise<Message> => {
  const { data } = await httpClient.post(`${API_URL}/api/messages/personal`, payload);
  return data;
};

export const markPersonalMessageRead = async (recipientPersonId: number): Promise<RecipientPerson> => {
  const { data } = await httpClient.patch(`${API_URL}/api/recipient-persons/${recipientPersonId}/read`);
  return data;
};

// ─── Mensajes grupales ─────────────────────────────────────────────────────────

export const sendGroupMessage = async (payload: SendGroupMessagePayload): Promise<Message> => {
  const { data } = await httpClient.post(`${API_URL}/api/messages/group`, payload);
  return data;
};

export const markGroupMessageRead = async (
  messageId: number,
  groupId: number,
  personId: string,
): Promise<GroupMessageRead> => {
  const { data } = await httpClient.patch(`${API_URL}/api/messages/${messageId}/read-group`, {
    group_id: groupId,
    person_id: personId,
  });
  return data;
};

export const fetchReadReceipts = async (messageId: number): Promise<ReadReceipt[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/messages/${messageId}/read-receipts`);
  return data;
};

// ─── Bandeja de entrada ────────────────────────────────────────────────────────

export const fetchInbox = async (
  personId: string,
  opts?: { type?: "personal" | "group"; unread?: boolean; page?: number; limit?: number },
): Promise<{ items: InboxItem[]; total: number; page: number; limit: number }> => {
  const params: Record<string, string> = {};
  if (opts?.type) params.type = opts.type;
  if (opts?.unread) params.unread = "true";
  if (opts?.page) params.page = String(opts.page);
  if (opts?.limit) params.limit = String(opts.limit);
  const { data } = await httpClient.get(`${API_URL}/api/messages/inbox/${personId}`, { params });
  return data;
};

export const fetchUnreadCount = async (personId: string): Promise<UnreadCount> => {
  const { data } = await httpClient.get(`${API_URL}/api/messages/inbox/${personId}/unread-count`);
  return data;
};

// ─── Mensajes enviados ─────────────────────────────────────────────────────────

export const fetchSent = async (
  personId: string,
  opts?: { page?: number; limit?: number },
): Promise<{ items: Message[]; total: number; page: number; limit: number }> => {
  const params: Record<string, string> = {};
  if (opts?.page) params.page = String(opts.page);
  if (opts?.limit) params.limit = String(opts.limit);
  const { data } = await httpClient.get(`${API_URL}/api/messages/sent/${personId}`, { params });
  return data;
};

// ─── Alertas masivas ───────────────────────────────────────────────────────────

export const sendMassAlert = async (payload: CreateAlertPayload): Promise<{ message: Message; recipients: number }> => {
  const { data } = await httpClient.post(`${API_URL}/api/alerts`, payload);
  return data;
};

export const fetchAlerts = async (): Promise<Message[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/alerts`);
  return data;
};

export const fetchAlertStats = async (alertId: number): Promise<AlertStats> => {
  const { data } = await httpClient.get(`${API_URL}/api/alerts/stats/${alertId}`);
  return data;
};
