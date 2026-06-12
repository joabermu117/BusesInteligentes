import httpClient from "../../config/httpClient";
import type {
  CreateGroupPayload,
  Group,
  GroupMembershipLog,
  GroupPerson,
  UpdateGroupPayload,
} from "../models/group";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Grupos
export const fetchGroups = async (): Promise<Group[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/groups`);
  return data;
};

export const fetchPublicGroups = async (search?: string): Promise<Group[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/groups/public`, {
    params: search ? { search } : {},
  });
  return data;
};

export const fetchGroupById = async (id: number): Promise<Group> => {
  const { data } = await httpClient.get(`${API_URL}/api/groups/${id}`);
  return data;
};

export const createGroup = async (payload: CreateGroupPayload): Promise<Group> => {
  const { data } = await httpClient.post(`${API_URL}/api/groups`, payload);
  return data;
};

export const updateGroup = async (id: number, payload: UpdateGroupPayload): Promise<Group> => {
  const { data } = await httpClient.put(`${API_URL}/api/groups/${id}`, payload);
  return data;
};

export const deleteGroup = async (id: number): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/groups/${id}`);
  return data;
};

// Miembros
export const fetchGroupMembers = async (groupId: number): Promise<GroupPerson[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/groups/${groupId}/persons`);
  return data;
};

export const joinGroup = async (groupId: number, personId: string): Promise<GroupPerson> => {
  const { data } = await httpClient.post(`${API_URL}/api/groups/${groupId}/persons`, {
    person_id: personId,
    role: "member",
  });
  return data;
};

export const leaveGroup = async (groupId: number, personId: string): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(
    `${API_URL}/api/groups/${groupId}/persons/${personId}`,
    { data: { action_by: personId } },
  );
  return data;
};

export const removeMember = async (
  groupId: number,
  personId: string,
  actionBy: string,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(
    `${API_URL}/api/groups/${groupId}/persons/${personId}`,
    { data: { action_by: actionBy } },
  );
  return data;
};

export const promoteMember = async (
  groupId: number,
  personId: string,
  actionBy: string,
): Promise<GroupPerson> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/groups/${groupId}/persons/${personId}/promote`,
    { action_by: actionBy },
  );
  return data;
};

export const blockMember = async (
  groupId: number,
  personId: string,
  actionBy: string,
): Promise<{ message: string }> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/groups/${groupId}/persons/${personId}/block`,
    { action_by: actionBy },
  );
  return data;
};

export const fetchMembershipLog = async (groupId: number): Promise<GroupMembershipLog[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/groups/${groupId}/log`);
  return data;
};