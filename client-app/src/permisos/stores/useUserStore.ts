import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { User } from "../models/user";
import { UserService } from "../services/UserService";

const USERS_QUERY_KEY = ["permisos", "users"] as const;

export const useUserStore = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const usersQuery = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => UserService.getUsers(),
  });

  const users = usersQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (userData: Omit<User, "id">) =>
      UserService.createUser(userData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) =>
      UserService.updateUser(id, userData),
    onSuccess: async (user: User) => {
      setCurrentUser(user);
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      }
    },
  });

  const loading =
    usersQuery.isPending ||
    usersQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error = useMemo(() => {
    const errors = [
      usersQuery.error,
      createMutation.error,
      updateMutation.error,
      deleteMutation.error,
    ];
    const firstError = errors.find(Boolean);
    return firstError instanceof Error ? firstError.message : null;
  }, [
    usersQuery.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ]);

  const fetchUsers = async () => {
    await usersQuery.refetch();
  };

  const fetchUser = async (id: string): Promise<User> => {
    const user = await UserService.getUser(id);
    setCurrentUser(user);
    return user;
  };

  const createUser = async (userData: Omit<User, "id">): Promise<User> => {
    return createMutation.mutateAsync(userData);
  };

  const updateUser = async (
    id: string,
    userData: Partial<User>,
  ): Promise<User> => {
    return updateMutation.mutateAsync({ id, userData });
  };

  const deleteUser = async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
    return deleteMutation.mutateAsync(id);
  };

  const resetCurrentUser = () => {
    setCurrentUser(null);
  };

  return {
    users,
    currentUser,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    resetCurrentUser,
  };
};
