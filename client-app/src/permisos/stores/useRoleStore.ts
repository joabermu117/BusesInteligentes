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
    mutationFn: (roleData: Omit<Role, "id">) =>
      RoleService.createRole(roleData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, roleData }: { id: string; roleData: Partial<Role> }) =>
      RoleService.updateRole(id, roleData),
    onSuccess: async (role: Role) => {
      setCurrentRole(role);
      await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RoleService.deleteRole(id),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
      }
    },
  });

  const roles = rolesQuery.data ?? [];

  const isInitialLoading = rolesQuery.isPending;
  const isRefreshing = rolesQuery.isFetching;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

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

  const fetchRoleById = async (id: string): Promise<Role> => {
    const role = await RoleService.getRoleById(id);
    setCurrentRole(role);
    return role;
  };

  const createRole = async (roleData: Omit<Role, "id">): Promise<Role> => {
    return createMutation.mutateAsync(roleData);
  };

  const updateRole = async (
    id: string,
    roleData: Partial<Role>,
  ): Promise<Role> => {
    return updateMutation.mutateAsync({ id, roleData });
  };

  const deleteRole = async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    return deleteMutation.mutateAsync(id);
  };

  const getRoleById = (id: string): Role | undefined => {
    return roles.find((role: Role) => role.id === id);
  };

  const resetCurrentRole = () => {
    setCurrentRole(null);
  };

  return {
    roles,
    currentRole,
    loading,
    isInitialLoading,
    isRefreshing,
    isMutating,
    error,
    fetchRoles,
    fetchRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRoleById,
    resetCurrentRole,
  };
};
