import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ScopeCategory } from "../models/ScopeCategory";
import { ScopeCategoryService } from "../services/ScopeCategoryService";

const CATEGORIES_QUERY_KEY = ["permisos", "scope-categories"] as const;

export const useCategoryStore = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => ScopeCategoryService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (category: Omit<ScopeCategory, "id">) =>
      ScopeCategoryService.createCategory(category),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      category,
    }: {
      id: string;
      category: Partial<ScopeCategory>;
    }) => ScopeCategoryService.updateCategory(id, category),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ScopeCategoryService.deleteCategory(id),
    onSuccess: async (result: { success: boolean; message: string }) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      }
    },
  });

  const categories = categoriesQuery.data ?? [];

  const loading =
    categoriesQuery.isPending ||
    categoriesQuery.isFetching ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const error = useMemo(() => {
    const errors = [
      categoriesQuery.error,
      createMutation.error,
      updateMutation.error,
      deleteMutation.error,
    ];
    const firstError = errors.find(Boolean);
    return firstError instanceof Error ? firstError.message : null;
  }, [
    categoriesQuery.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ]);

  const fetchCategories = async () => {
    await categoriesQuery.refetch();
  };

  const createCategory = async (
    category: Omit<ScopeCategory, "id">,
  ): Promise<ScopeCategory> => {
    return createMutation.mutateAsync(category);
  };

  const updateCategory = async (
    id: string,
    category: Partial<ScopeCategory>,
  ): Promise<ScopeCategory> => {
    return updateMutation.mutateAsync({ id, category });
  };

  const deleteCategory = async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
