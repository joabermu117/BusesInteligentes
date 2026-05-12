import httpClient from "../../config/httpClient";
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../models/company";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchCompanies = async (): Promise<Company[]> => {
  const { data } = await httpClient.get(`${API_URL}/api/companies`);
  return data;
};

export const fetchCompanyById = async (id: number): Promise<Company> => {
  const { data } = await httpClient.get(`${API_URL}/api/companies/${id}`);
  return data;
};

export const createCompany = async (
  payload: CreateCompanyPayload,
): Promise<Company> => {
  const { data } = await httpClient.post(`${API_URL}/api/companies`, payload);
  return data;
};

export const updateCompany = async (
  id: number,
  payload: UpdateCompanyPayload,
): Promise<Company> => {
  const { data } = await httpClient.patch(
    `${API_URL}/api/companies/${id}`,
    payload,
  );
  return data;
};

export const deleteCompany = async (
  id: number,
): Promise<{ message: string }> => {
  const { data } = await httpClient.delete(`${API_URL}/api/companies/${id}`);
  return data;
};
