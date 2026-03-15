import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { User } from "../models/user";
import { UserService } from "../services/UserService";

const USERS_QUERY_KEY = ["permisos", "users"] as const;
const USER_PERMISSIONS_QUERY_KEY = [
  "permisos",
  "users",
  "permissions-map",
] as const;

export const useUserStore = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const usersQuery = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => UserService.getUsers(),
  });

  const users = usersQuery.data ?? [];

  const userPermissionsQuery = useQuery({
    queryKey: USER_PERMISSIONS_QUERY_KEY,
    enabled: users.length > 0,
    queryFn: async () =>
      UserService.getManyUsersPermissions(users.map((user: User) => user.uid)),
  });

  useEffect(() => {
    if (users.length > 0) {
      void userPermissionsQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const createMutation = useMutation({
    mutationFn: (userData: Omit<User, "uid">) =>
      UserService.createUser(userData),
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
      await queryClient.invalidateQueries({
        queryKey: USER_PERMISSIONS_QUERY_KEY,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => UserService.deleteUser(uid),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        await queryClient.invalidateQueries({
          queryKey: USER_PERMISSIONS_QUERY_KEY,
        });
      }
    },
  });

  const loading =
    usersQuery.isPending ||
    usersQuery.isFetching ||
    userPermissionsQuery.isPending ||
    userPermissionsQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error = useMemo(() => {
    const errors = [
      usersQuery.error,
      userPermissionsQuery.error,
      createMutation.error,
      updateMutation.error,
      deleteMutation.error,
    ];
    const firstError = errors.find(Boolean);
    return firstError instanceof Error ? firstError.message : null;
  }, [
    usersQuery.error,
    userPermissionsQuery.error,
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

  const fetchUserByEmail = async (email: string): Promise<User> => {
    const user = await UserService.getUserByEmail(email);
    setCurrentUser(user);
    return user;
  };

  const createUser = async (userData: Omit<User, "uid">): Promise<User> => {
    const user = await createMutation.mutateAsync(userData);
    if (user.uid) {
      await fetchUserPermissions(user.uid);
    }
    return user;
  };

  const updateUser = async (
    uid: string,
    userData: Partial<User>,
  ): Promise<User> => {
    const user = await updateMutation.mutateAsync({ uid, userData });
    await fetchUserPermissions(uid);
    return user;
  };

  const deleteUser = async (
    uid: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.uid === uid) {
      setCurrentUser(null);
    }
    return deleteMutation.mutateAsync(uid);
  };

  const fetchUserPermissions = async (uid: string): Promise<string[]> => {
    try {
      const permissions = await UserService.getUserPermissions(uid);
      queryClient.setQueryData<Record<string, string[]>>(
        USER_PERMISSIONS_QUERY_KEY,
        (current: Record<string, string[]> | undefined) => ({
          ...(current ?? {}),
          [uid]: permissions,
        }),
      );
      return permissions;
    } catch {
      return [];
    }
  };

  const userPermissions = userPermissionsQuery.data ?? {};

  const getPermissionsForUser = (uid: string): string[] => {
    return userPermissions[uid] ?? [];
  };

  const resetCurrentUser = () => {
    setCurrentUser(null);
  };

  return {
    users,
    currentUser,
    loading,
    error,
    userPermissions,
    fetchUsers,
    fetchUser,
    fetchUserByEmail,
    createUser,
    updateUser,
    deleteUser,
    fetchUserPermissions,
    getPermissionsForUser,
    resetCurrentUser,
  };
};
