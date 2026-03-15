import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Role } from "../models/Role";
import { RoleService } from "../services/RoleService";

const ROLES_QUERY_KEY = ["permisos", "roles"] as const;

export const useRoleStore = () => {
  const queryClient = useQueryClient();
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const rolesQuery = useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => RoleService.getRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (roleData: Omit<Role, "key">) =>
      RoleService.createRole(roleData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, roleData }: { key: string; roleData: Partial<Role> }) =>
      RoleService.updateRole(key, roleData),
    onSuccess: async (role: Role) => {
      setCurrentRole(role);
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => RoleService.deleteRole(key),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      }
    },
  });

  const roles = rolesQuery.data ?? [];

  const loading =
    rolesQuery.isPending ||
    rolesQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error = useMemo(() => {
    const errors = [
      rolesQuery.error,
      createMutation.error,
      updateMutation.error,
      deleteMutation.error,
    ];
    const firstError = errors.find(Boolean);
    return firstError instanceof Error ? firstError.message : null;
  }, [
    rolesQuery.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ]);

  const fetchRoles = async () => {
    await rolesQuery.refetch();
  };

  const fetchRoleByKey = async (key: string): Promise<Role> => {
    const role = await RoleService.getRoleByKey(key);
    setCurrentRole(role);
    return role;
  };

  const createRole = async (roleData: Omit<Role, "key">): Promise<Role> => {
    return createMutation.mutateAsync(roleData);
  };

  const updateRole = async (
    key: string,
    roleData: Partial<Role>,
  ): Promise<Role> => {
    return updateMutation.mutateAsync({ key, roleData });
  };

  const deleteRole = async (
    key: string,
  ): Promise<{ success: boolean; message: string }> => {
    return deleteMutation.mutateAsync(key);
  };

  const getRoleByKey = (key: string): Role | undefined => {
    return roles.find((role: Role) => role.key === key);
  };

  const resetCurrentRole = () => {
    setCurrentRole(null);
  };

  return {
    roles,
    currentRole,
    loading,
    error,
    fetchRoles,
    fetchRoleByKey,
    createRole,
    updateRole,
    deleteRole,
    getRoleByKey,
    resetCurrentRole,
  };
};
