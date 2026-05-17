import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Shift } from "../../boletos/models/boletos";
import {
  fetchAllShifts,
  fetchShiftById,
  createShift,
  updateShift,
  deleteShift,
  type CreateShiftPayload,
  type UpdateShiftPayload,
} from "../services/adminShiftsService";

export const useAllShifts = () =>
  useQuery<Shift[]>({
    queryKey: ["admin-shifts"],
    queryFn: fetchAllShifts,
  });

export const useShift = (id: number) =>
  useQuery<Shift>({
    queryKey: ["admin-shifts", id],
    queryFn: () => fetchShiftById(id),
    enabled: !!id,
  });

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => createShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shifts"] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateShiftPayload }) =>
      updateShift(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shifts"] });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shifts"] });
    },
  });
};
