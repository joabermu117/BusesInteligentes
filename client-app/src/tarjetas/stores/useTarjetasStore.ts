import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTarjetaPayload,
  Tarjeta,
  UpdateTarjetaPayload,
} from "../models/tarjeta";
import {
  createTarjeta,
  deleteTarjeta,
  fetchTarjetasByCitizen,
  updateTarjeta,
} from "../services/tarjetasService";

export const useTarjetasByCitizen = (citizenId: string) =>
  useQuery<Tarjeta[]>({
    queryKey: ["tarjetas", citizenId],
    queryFn: () => fetchTarjetasByCitizen(citizenId),
    enabled: !!citizenId,
  });

export const useCreateTarjeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTarjetaPayload) => createTarjeta(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
    },
  });
};

export const useUpdateTarjeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateTarjetaPayload;
    }) => updateTarjeta(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
    },
  });
};

export const useDeleteTarjeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTarjeta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] });
    },
  });
};
