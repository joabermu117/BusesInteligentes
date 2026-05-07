import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShiftsByDriver,
  fetchActiveShiftByDriver,
  startShift,
} from "../services/shiftService";
import type { Shift } from "../models/boletos";

export const useShiftsByDriver = (driverUserId: string) =>
  useQuery<Shift[]>({
    queryKey: ["shifts", "driver", driverUserId],
    queryFn: () => fetchShiftsByDriver(driverUserId),
    enabled: !!driverUserId,
  });

export const useActiveShiftByDriver = (driverUserId: string) =>
  useQuery<Shift | null>({
    queryKey: ["shifts", "active", driverUserId],
    queryFn: () => fetchActiveShiftByDriver(driverUserId),
    enabled: !!driverUserId,
  });

export const useStartShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shiftId,
      busCondition,
      observations,
    }: {
      shiftId: number;
      busCondition?: string;
      observations?: string;
    }) => startShift(shiftId, { busCondition, observations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
};
