import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddRouteStopPayload,
  CreateRoutePayload,
  Ruta,
  UpdateRoutePayload,
} from "../models/ruta";
import {
  addStopToRoute,
  createRoute,
  deleteRoute,
  fetchAllRoutes,
  fetchRouteById,
  removeStopFromRoute,
  updateRoute,
} from "../services/adminRoutesService";

export const useAdminRoutes = () =>
  useQuery<Ruta[]>({
    queryKey: ["admin-routes"],
    queryFn: fetchAllRoutes,
  });

export const useAdminRoute = (id: number) =>
  useQuery<Ruta>({
    queryKey: ["admin-routes", id],
    queryFn: () => fetchRouteById(id),
    enabled: !!id,
  });

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoutePayload) => createRoute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateRoutePayload;
    }) => updateRoute(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });
};

export const useAddStopToRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeId,
      payload,
    }: {
      routeId: number;
      payload: AddRouteStopPayload;
    }) => addStopToRoute(routeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });
};

export const useRemoveStopFromRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      routeId,
      stopId,
    }: {
      routeId: number;
      stopId: number;
    }) => removeStopFromRoute(routeId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
    },
  });
};