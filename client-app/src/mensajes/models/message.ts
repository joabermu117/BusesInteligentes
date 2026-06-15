export interface Message {
  id: number;
  content: string;
  content_preview?: string;
  sent_at: string;
  sender_person_id: string;
  message_type: "personal" | "group" | "mass_alert";
  latitude?: number;
  longitude?: number;
  is_urgent: boolean;
  is_readonly: boolean;
  scheduled_at?: string;
  sender?: {
    person_id: string;
    name?: string;
  };
  recipientPersons?: RecipientPerson[];
  recipientGroups?: RecipientGroup[];
}

export interface RecipientPerson {
  id: number;
  message_id: number;
  recipient_person_id: string;
  read_at?: string | null;
  recipient?: {
    person_id: string;
    name?: string;
  };
  message?: Message;
}

export interface RecipientGroup {
  id: number;
  message_id: number;
  group_id: number;
  delivered_at?: string;
  group?: {
    id: number;
    name: string;
  };
  message?: Message;
}

export interface GroupMessageRead {
  id: number;
  message_id: number;
  group_id: number;
  person_id: string;
  read_at?: string | null;
  person?: {
    person_id: string;
    name?: string;
  };
}

export interface InboxItem {
  inbox_type: "personal" | "group";
  recipient_id?: number;
  group_read_id?: number | null;
  read_at?: string | null;
  group?: {
    id: number;
    name: string;
    description?: string;
  };
  message: Message;
}

export interface UnreadCount {
  total: number;
  personal: number;
  group: number;
}

export interface SendPersonalMessagePayload {
  content: string;
  sender_person_id: string;
  recipient_person_ids: string[];
  latitude?: number;
  longitude?: number;
  is_urgent?: boolean;
}

export interface SendGroupMessagePayload {
  content: string;
  sender_person_id: string;
  group_ids: number[];
  is_urgent?: boolean;
}

export interface CreateAlertPayload {
  content: string;
  sender_person_id: string;
  scope: "all" | "route" | "zone";
  scope_value?: string;
  is_urgent?: boolean;
  scheduled_at?: string;
}

export interface AlertStats {
  total: number;
  delivered: number;
  read: number;
}

export interface CitizenSearchResult {
  person_id: string;
  name?: string;
  isActive: boolean;
}
