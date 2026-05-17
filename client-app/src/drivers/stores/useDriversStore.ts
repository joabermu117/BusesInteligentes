import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDrivers,
  fetchDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from "../services/driversService";
import type { Driver } from "../models/driver";

export const useDrivers = () =>
  useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

export const useDriver = (personId: string) =>
  useQuery<Driver>({
    queryKey: ["drivers", personId],
    queryFn: () => fetchDriverById(personId),
    enabled: !!personId,
  });

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { person_id: string; licenseNumber?: string }) =>
      createDriver(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      personId,
      payload,
    }: {
      personId: string;
      payload: Partial<Driver>;
    }) => updateDriver(personId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personId: string) => deleteDriver(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
};
