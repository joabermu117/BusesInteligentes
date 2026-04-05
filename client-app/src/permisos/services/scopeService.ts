import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Scope } from "../models/Scope";

const API_URL = `${API_CONFIG.permisosBaseUrl}/permissions`;

interface ApiResponse<T = Scope[]> {
  success: boolean;
  data: T;
  message: string;
}

interface SingleItemResponse {
  success: boolean;
  data: Scope;
  message: string;
}

class ScopeServiceClass {
  /**
   * Obtiene todos los scopes disponibles
   * @async
   * @returns {Promise<Scope[]>} Lista de scopes
   * @throws {Error} Si la solicitud falla
   */
  async getScopes(): Promise<Scope[]> {
    const response =
      await httpClient.get<Array<Partial<Scope> & { _id?: string }>>(API_URL);
    return response.data.map(normalizePermission);
  }

  async getScopeById(id: string): Promise<Scope> {
    const response = await httpClient.get<Partial<Scope> & { _id?: string }>(
      `${API_URL}/${id}`,
    );

    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  async createScope(scope: Omit<Scope, "id">): Promise<Scope> {
    const response = await httpClient.post<Partial<Scope> & { _id?: string }>(
      API_URL,
      {
        url: scope.url,
        method: scope.method,
        model: scope.model,
      },
    );
    return normalizePermission(response.data);
  }

  async updateScope(id: string, changes: Partial<Scope>): Promise<Scope> {
    const response = await httpClient.put<Partial<Scope> & { _id?: string }>(
      `${API_URL}/${id}`,
      {
        url: changes.url,
        method: changes.method,
        model: changes.model,
      },
    );
    return normalizePermission(response.data);
  }

  async deleteScope(id: string): Promise<void> {
    await httpClient.delete(`${API_URL}/${id}`);
  }
}

export const ScopeService = new ScopeServiceClass();
