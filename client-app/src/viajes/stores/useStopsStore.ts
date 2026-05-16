import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateStopPayload, Stop, UpdateStopPayload } from "../models/stop";
import {
  createStop,
  deleteStop,
  fetchStops,
  updateStop,
} from "../services/stopsService";

export const useStops = () =>
  useQuery<Stop[]>({
    queryKey: ["stops"],
    queryFn: fetchStops,
  });

export const useCreateStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStopPayload) => createStop(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops"] });
    },
  });
};

export const useUpdateStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStopPayload }) =>
      updateStop(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops"] });
    },
  });
};

export const useDeleteStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stops"] });
    },
  });
};