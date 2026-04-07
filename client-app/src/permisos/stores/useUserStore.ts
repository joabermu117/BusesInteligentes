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
    mutationFn: (userData: Omit<User, "uid">) => UserService.createUser(userData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, userData }: { uid: string; userData: Partial<User> }) =>
      UserService.updateUser(uid, userData),
    onSuccess: async (user: User) => {
      setCurrentUser(user);
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => UserService.deleteUser(uid),
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

  const fetchUser = async (uid: string): Promise<User> => {
    const user = await UserService.getUser(uid);
    setCurrentUser(user);
    return user;
  };

  const createUser = async (userData: Omit<User, "uid">): Promise<User> => {
    return createMutation.mutateAsync(userData);
  };

  const updateUser = async (uid: string, userData: Partial<User>): Promise<User> => {
    return updateMutation.mutateAsync({ uid, userData });
  };

  const deleteUser = async (uid: string): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.uid === uid) {
      setCurrentUser(null);
    }
    return deleteMutation.mutateAsync(uid);
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
