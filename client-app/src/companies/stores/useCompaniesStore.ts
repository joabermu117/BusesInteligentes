import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../models/company";
import {
  createCompany,
  deleteCompany,
  fetchCompanies,
  updateCompany,
} from "../services/companiesService";

export const useCompanies = () =>
  useQuery<Company[]>({ queryKey: ["companies"], queryFn: fetchCompanies });

export const useCompany = (id: number) =>
  useQuery<Company>({
    queryKey: ["companies", id],
    queryFn: () =>
      fetchCompanies().then((list) => {
        const c = list.find((x) => x.id === id);
        if (!c) throw new Error("Not found");
        return c;
      }),
    enabled: !!id,
  });

export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateCompanyPayload) => createCompany(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, p }: { id: number; p: UpdateCompanyPayload }) =>
      updateCompany(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
};
