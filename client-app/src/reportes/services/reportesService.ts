import httpClient from "../../config/httpClient";
import type { RevenueReport } from "../models/reporte";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchRevenueReport = async (
  months: number = 12,
): Promise<RevenueReport> => {
  const { data } = await httpClient.get(
    `${API_URL}/api/reports/revenue-by-payment?months=${months}`,
  );
  return data;
};
