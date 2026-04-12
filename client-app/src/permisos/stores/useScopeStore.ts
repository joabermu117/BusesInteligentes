import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { Scope } from "../models/Scope";
import { ScopeService } from "../services/scopeService";

const SCOPES_QUERY_KEY = ["permisos", "scopes"] as const;

export const useScopeStore = () => {
  const queryClient = useQueryClient();
  const [currentScope, setCurrentScope] = useState<Scope | null>(null);

  const scopesQuery = useQuery({
    queryKey: SCOPES_QUERY_KEY,
    queryFn: () => ScopeService.getScopes(),
  });

  const createMutation = useMutation({
    mutationFn: (scopeData: Omit<Scope, "id">) =>
      ScopeService.createScope(scopeData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      scopeData,
    }: {
      id: string;
      scopeData: Partial<Scope>;
    }) => ScopeService.updateScope(id, scopeData),
    onSuccess: async (scope: Scope) => {
      setCurrentScope(scope);
      await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ScopeService.deleteScope(id),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
      }
    },
  });

  const scopes = scopesQuery.data ?? [];

  const isInitialLoading = scopesQuery.isPending;
  const isRefreshing = scopesQuery.isFetching;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const loading =
    scopesQuery.isPending ||
    scopesQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error = useMemo(() => {
    const errors = [
      scopesQuery.error,
      createMutation.error,
      updateMutation.error,
      deleteMutation.error,
    ];
    const firstError = errors.find(Boolean);
    return firstError instanceof Error ? firstError.message : null;
  }, [
    scopesQuery.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ]);

  const fetchScopes = async () => {
    await scopesQuery.refetch();
  };

  const fetchScopeById = async (id: string): Promise<void> => {
    const scope = await ScopeService.getScopeById(id);
    setCurrentScope(scope);
  };

  const createScope = async (scopeData: Omit<Scope, "id">): Promise<Scope> => {
    return createMutation.mutateAsync(scopeData);
  };

  const updateScope = async (
    id: string,
    scopeData: Partial<Scope>,
  ): Promise<Scope> => {
    return updateMutation.mutateAsync({ id, scopeData });
  };

  const deleteScope = async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    return deleteMutation.mutateAsync(id);
  };

  const getScopeById = (id: string): Scope | undefined => {
    return scopes.find((scope: Scope) => scope.id === id);
  };

  const resetCurrentScope = () => {
    setCurrentScope(null);
  };

  return {
    scopes,
    currentScope,
    loading,
    isInitialLoading,
    isRefreshing,
    isMutating,
    error,
    fetchScopes,
    fetchScopeById,
    createScope,
    updateScope,
    deleteScope,
    getScopeById,
    resetCurrentScope,
  };
};
