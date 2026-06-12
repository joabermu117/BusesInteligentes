export interface Group {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at?: string;
  created_by_person_id?: string;
  created_by?: {
    person_id: string;
    name?: string;
    email?: string;
  };
  groupPersons?: GroupPerson[];
}

export interface GroupPerson {
  group_id: number;
  person_id: string;
  joined_at?: string;
  role: "admin" | "member";
  is_blocked?: boolean;
  group?: Group;
  person?: {
    person_id: string;
    name?: string;
    birthDate?: string;
    isActive?: boolean;
  };
}

export interface GroupMembershipLog {
  id: number;
  group_id: number;
  person_id: string;
  action_by_person_id?: string;
  action: "joined" | "left" | "removed" | "promoted" | "blocked";
  action_at: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  is_public?: boolean;
  created_by_person_id: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export const GROUP_ACTION_LABELS: Record<string, string> = {
  joined: "Se unió",
  left: "Abandonó",
  removed: "Fue removido",
  promoted: "Fue promovido a admin",
  blocked: "Fue bloqueado",
};