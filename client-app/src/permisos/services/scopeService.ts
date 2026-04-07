import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Scope } from "../models/Scope";

const API_URL = `${API_CONFIG.permisosBaseUrl}/permissions`;

const normalizePermission = (
  scope: Partial<Scope> & { _id?: string },
): Scope => ({
  key: scope.key ?? scope._id ?? "",
  name: scope.name ?? "",
  description: scope.description ?? "",
  deprecated: Boolean(scope.deprecated),
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
      await httpClient.get<Array<Partial<Scope> & { _id?: string }>>(API_URL);
    return response.data.map(normalizePermission);
  }

  async getScopeByKey(key: string): Promise<Scope> {
    const response = await httpClient.get<Partial<Scope> & { _id?: string }>(
      `${API_URL}/${key}`,
    );
    return normalizePermission(response.data);
  }

  async createScope(
    scope: Omit<Scope, "key" | "deprecated">,
  ): Promise<Scope> {
    const response = await httpClient.post<Partial<Scope> & { _id?: string }>(
      API_URL,
      {
        name: scope.name,
        description: scope.description,
      },
    );
    return normalizePermission(response.data);
  }

  async updateScope(key: string, changes: Partial<Scope>): Promise<Scope> {
    const response = await httpClient.put<Partial<Scope> & { _id?: string }>(
      `${API_URL}/${key}`,
      {
        name: changes.name,
        description: changes.description,
        deprecated: changes.deprecated,
      },
    );
    return normalizePermission(response.data);
  }

  async deleteScope(
    key: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${API_URL}/${key}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Scope eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message ?? "No se pudo eliminar el scope",
      };
    }
  }
}

export const ScopeService = new ScopeServiceClass();
