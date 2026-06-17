import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateAlertPayload,
  InboxItem,
  Message,
  SendGroupMessagePayload,
  SendPersonalMessagePayload,
  UnreadCount,
} from "../models/message";
import {
  deleteGroupMessage,
  fetchAlertStats,
  fetchAlerts,
  fetchInbox,
  fetchReadReceipts,
  fetchSent,
  fetchUnreadCount,
  markGroupMessageRead,
  markPersonalMessageRead,
  searchCitizens,
  sendGroupMessage,
  sendMassAlert,
  sendPersonalMessage,
} from "../services/messagesService";

export const useInbox = (
  personId: string,
  opts?: {
    type?: "personal" | "group";
    unread?: boolean;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  },
) =>
  useQuery<{ items: InboxItem[]; total: number; page: number; limit: number }>({
    queryKey: ["inbox", personId, opts],
    queryFn: () => fetchInbox(personId, opts),
    enabled: !!personId,
  });

export const useUnreadCount = (personId: string) =>
  useQuery<UnreadCount>({
    queryKey: ["unread-count", personId],
    queryFn: () => fetchUnreadCount(personId),
    enabled: !!personId,
    refetchInterval: 15_000,
  });

export const useSent = (personId: string, opts?: { page?: number; limit?: number }) =>
  useQuery<{ items: Message[]; total: number; page: number; limit: number }>({
    queryKey: ["sent", personId, opts],
    queryFn: () => fetchSent(personId, opts),
    enabled: !!personId,
  });

export const useReadReceipts = (messageId: number) =>
  useQuery({
    queryKey: ["read-receipts", messageId],
    queryFn: () => fetchReadReceipts(messageId),
    enabled: !!messageId,
  });

export const useAlerts = () =>
  useQuery<Message[]>({ queryKey: ["alerts"], queryFn: fetchAlerts });

export const useAlertStats = (alertId: number) =>
  useQuery({
    queryKey: ["alert-stats", alertId],
    queryFn: () => fetchAlertStats(alertId),
    enabled: !!alertId,
  });

export const useCitizenSearch = (q: string, excludePersonId?: string) =>
  useQuery({
    queryKey: ["citizens-search", q, excludePersonId],
    queryFn: () => searchCitizens(q, excludePersonId),
    enabled: q.trim().length >= 2,
  });

export const useSendPersonalMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendPersonalMessagePayload) => sendPersonalMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["sent"] });
    },
  });
};

export const useSendGroupMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendGroupMessagePayload) => sendGroupMessage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["sent"] });
    },
  });
};

export const useMarkPersonalRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipientPersonId: number) => markPersonalMessageRead(recipientPersonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};

export const useMarkGroupRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, groupId, personId }: { messageId: number; groupId: number; personId: string }) =>
      markGroupMessageRead(messageId, groupId, personId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};

export const useDeleteGroupMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, groupId, actorPersonId }: { messageId: number; groupId: number; actorPersonId: string }) =>
      deleteGroupMessage(messageId, groupId, actorPersonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};

export const useSendMassAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertPayload) => sendMassAlert(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
};
