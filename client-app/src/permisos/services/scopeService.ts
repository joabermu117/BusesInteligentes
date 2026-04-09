import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Scope } from "../models/Scope";

const API_URL = `${API_CONFIG.permisosBaseUrl}/permissions`;

const normalizePermission = (
  scope: Partial<Scope> & { _id?: string; id?: string },
): Scope => ({
  id: scope.id ?? scope._id ?? "",
  url: scope.url ?? "",
  method: scope.method ?? "",
  model: scope.model ?? "",
});

class ScopeServiceClass {
  /**
   * Obtiene todos los scopes disponibles
   * @async
   * @returns {Promise<Scope[]>} Lista de scopes
   * @throws {Error} Si la solicitud falla
   */
  async getScopes(): Promise<Scope[]> {
    const response =
      await httpClient.get<
        Array<Partial<Scope> & { _id?: string; id?: string }>
      >(API_URL);
    return response.data.map(normalizePermission);
  }

  async getScopeById(id: string): Promise<Scope> {
    const response = await httpClient.get<
      Partial<Scope> & { _id?: string; id?: string }
    >(`${API_URL}/${id}`);
    return normalizePermission(response.data);
  }

  async createScope(scope: Omit<Scope, "id">): Promise<Scope> {
    const response = await httpClient.post<
      Partial<Scope> & { _id?: string; id?: string }
    >(API_URL, {
      url: scope.url,
      method: scope.method,
      model: scope.model,
    });
    return normalizePermission(response.data);
  }

  async updateScope(id: string, changes: Partial<Scope>): Promise<Scope> {
    const response = await httpClient.put<
      Partial<Scope> & { _id?: string; id?: string }
    >(`${API_URL}/${id}`, {
      url: changes.url,
      method: changes.method,
      model: changes.model,
    });
    return normalizePermission(response.data);
  }

  async deleteScope(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${API_URL}/${id}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Permiso eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message:
          err.response?.data?.message ?? "No se pudo eliminar el permiso",
      };
    }
  }
}

export const ScopeService = new ScopeServiceClass();
