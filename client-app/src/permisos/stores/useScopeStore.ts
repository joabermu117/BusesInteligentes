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
    mutationFn: (
      scopeData: Omit<Scope, "key" | "deprecated" | "categoryName">,
    ) => ScopeService.createScope(scopeData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      key,
      scopeData,
    }: {
      key: string;
      scopeData: Partial<Scope>;
    }) => ScopeService.updateScope(key, scopeData),
    onSuccess: async (scope: Scope) => {
      setCurrentScope(scope);
      await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => ScopeService.deleteScope(key),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: SCOPES_QUERY_KEY });
      }
    },
  });

  const scopes = scopesQuery.data ?? [];

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

  const fetchScopeByKey = async (key: string): Promise<void> => {
    const scope = await ScopeService.getScopeByKey(key);
    setCurrentScope(scope);
  };

  const createScope = async (
    scopeData: Omit<Scope, "key" | "deprecated" | "categoryName">,
  ): Promise<Scope> => {
    return createMutation.mutateAsync(scopeData);
  };

  const updateScope = async (
    key: string,
    scopeData: Partial<Scope>,
  ): Promise<Scope> => {
    return updateMutation.mutateAsync({ key, scopeData });
  };

  const deleteScope = async (
    key: string,
  ): Promise<{ success: boolean; message: string }> => {
    return deleteMutation.mutateAsync(key);
  };

  const toggleDeprecatedStatus = async (key: string): Promise<void> => {
    const scope = scopes.find((item: Scope) => item.key === key);
    if (!scope) {
      return;
    }
    await updateScope(key, { deprecated: !scope.deprecated });
  };

  const getScopeByKey = (key: string): Scope | undefined => {
    return scopes.find((scope: Scope) => scope.key === key);
  };

  const getScopesByCategory = (categoryId: string): Scope[] => {
    return scopes.filter((scope: Scope) => scope.categoryId === categoryId);
  };

  const resetCurrentScope = () => {
    setCurrentScope(null);
  };

  return {
    scopes,
    currentScope,
    loading,
    error,
    fetchScopes,
    fetchScopeByKey,
    createScope,
    updateScope,
    deleteScope,
    toggleDeprecatedStatus,
    getScopeByKey,
    getScopesByCategory,
    resetCurrentScope,
  };
};
