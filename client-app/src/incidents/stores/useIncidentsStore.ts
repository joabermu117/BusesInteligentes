import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateIncidentBusPayload,
  CreateIncidentPayload,
  CreatePhotoPayload,
  Incident,
  IncidentBus,
  UpdateIncidentPayload,
} from "../models/incident";
import {
  createIncident,
  createIncidentBus,
  createPhoto,
  deleteIncident,
  deletePhoto,
  fetchIncidentBusesByBus,
  fetchIncidents,
  updateIncident,
} from "../services/incidentsService";

export const useIncidents = () =>
  useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
  });

export const useIncidentBusesByBus = (busId: number) =>
  useQuery<IncidentBus[]>({
    queryKey: ["incidents-buses", busId],
    queryFn: () => fetchIncidentBusesByBus(busId),
    enabled: !!busId,
  });

export const useCreateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
};

export const useCreateIncidentBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncidentBusPayload) =>
      createIncidentBus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-buses"] });
    },
  });
};

export const useCreatePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePhotoPayload) => createPhoto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-buses"] });
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateIncidentPayload;
    }) => updateIncident(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePhoto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-buses"] });
    },
  });
};