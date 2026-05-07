import { useQuery } from "@tanstack/react-query";
import {
  fetchTravelHistory,
  fetchTravelDetail,
} from "../services/travelService";
import type { Ticket } from "../models/boletos";

export const useTravelHistory = (personId: string) =>
  useQuery<Ticket[]>({
    queryKey: ["travel-history", personId],
    queryFn: () => fetchTravelHistory(personId),
    enabled: !!personId,
  });

export const useTravelDetail = (id: number) =>
  useQuery<Ticket>({
    queryKey: ["travel-detail", id],
    queryFn: () => fetchTravelDetail(id),
    enabled: !!id,
  });
