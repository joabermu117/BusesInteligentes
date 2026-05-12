import { useQuery } from "@tanstack/react-query";
import type { RevenueReport } from "../models/reporte";
import { fetchRevenueReport } from "../services/reportesService";

export const useRevenueReport = (months: number = 12) =>
  useQuery<RevenueReport>({
    queryKey: ["revenue-report", months],
    queryFn: () => fetchRevenueReport(months),
  });
