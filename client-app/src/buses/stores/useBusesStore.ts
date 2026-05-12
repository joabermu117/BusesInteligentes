import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bus, CreateBusPayload, UpdateBusPayload } from "../models/bus";
import {
  createBus,
  deleteBus,
  fetchBuses,
  updateBus,
} from "../services/busesService";

export const useBuses = () =>
  useQuery<Bus[]>({
    queryKey: ["buses"],
    queryFn: fetchBuses,
  });

export const useBus = (id: number) =>
  useQuery<Bus>({
    queryKey: ["buses", id],
    queryFn: async () => {
      const list = await fetchBuses();
      const bus = list.find((b) => b.id === id);
      if (!bus) throw new Error(`Bus #${id} no encontrado`);
      return bus;
    },
    enabled: !!id,
  });

export const useCreateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBusPayload) => createBus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
};

export const useUpdateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBusPayload }) =>
      updateBus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
};

export const useDeleteBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
};
