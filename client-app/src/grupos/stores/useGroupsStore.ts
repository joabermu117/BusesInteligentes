import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateGroupPayload,
  Group,
  GroupMembershipLog,
  GroupPerson,
  UpdateGroupPayload,
} from "../models/group";
import {
  addMemberByAdmin,
  blockMember,
  createGroup,
  deleteGroup,
  fetchGroupById,
  fetchGroupMembers,
  fetchGroups,
  fetchMembershipLog,
  fetchPublicGroups,
  joinGroup,
  leaveGroup,
  promoteMember,
  removeMember,
  updateGroup,
} from "../services/groupsService";

export const useGroups = () =>
  useQuery<Group[]>({ queryKey: ["groups"], queryFn: fetchGroups });

export const usePublicGroups = (search?: string) =>
  useQuery<Group[]>({
    queryKey: ["groups", "public", search],
    queryFn: () => fetchPublicGroups(search),
  });

export const useGroup = (id: number) =>
  useQuery<Group>({
    queryKey: ["groups", id],
    queryFn: () => fetchGroupById(id),
    enabled: !!id,
  });

export const useGroupMembers = (groupId: number) =>
  useQuery<GroupPerson[]>({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
  });

export const useMembershipLog = (groupId: number) =>
  useQuery<GroupMembershipLog[]>({
    queryKey: ["groups", groupId, "log"],
    queryFn: () => fetchMembershipLog(groupId),
    enabled: !!groupId,
  });

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useUpdateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGroupPayload }) =>
      updateGroup(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useDeleteGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId }: { groupId: number; personId: string }) =>
      joinGroup(groupId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useLeaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId }: { groupId: number; personId: string }) =>
      leaveGroup(groupId, personId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId, actionBy }: { groupId: number; personId: string; actionBy: string }) =>
      removeMember(groupId, personId, actionBy),
    onSuccess: (_, { groupId }) =>
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
};

export const usePromoteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId, actionBy }: { groupId: number; personId: string; actionBy: string }) =>
      promoteMember(groupId, personId, actionBy),
    onSuccess: (_, { groupId }) =>
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
};

export const useAddMemberByAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId, actionBy }: { groupId: number; personId: string; actionBy: string }) =>
      addMemberByAdmin(groupId, personId, actionBy),
    onSuccess: (_, { groupId }) =>
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
};

export const useBlockMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, personId, actionBy }: { groupId: number; personId: string; actionBy: string }) =>
      blockMember(groupId, personId, actionBy),
    onSuccess: (_, { groupId }) =>
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }),
  });
};