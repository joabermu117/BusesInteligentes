import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Role } from "../models/Role";

const API_URL = `${API_CONFIG.permisosBaseUrl}/roles`;

const normalizeRole = (role: Partial<Role> & { _id?: string }): Role => ({
  key: role.key ?? role._id ?? "",
  name: role.name ?? "",
  description: role.description ?? "",
  scopes: Array.isArray(role.scopes) ? role.scopes : [],
});

class RoleServiceClass {
  /**
   * Obtiene todos los roles disponibles
   * @async
   * @returns {Promise<Role[]>} Lista de roles
   * @throws {Error} Si la solicitud falla
   */
  async getRoles(): Promise<Role[]> {
    const response =
      await httpClient.get<Array<Partial<Role> & { _id?: string }>>(API_URL);
    return response.data.map(normalizeRole);
  }

  async getRoleByKey(key: string): Promise<Role> {
    const response = await httpClient.get<Partial<Role> & { _id?: string }>(
      `${API_URL}/${key}`,
    );
    return normalizeRole(response.data);
  }

  async createRole(role: Omit<Role, "key">): Promise<Role> {
    const response = await httpClient.post<Partial<Role> & { _id?: string }>(
      API_URL,
      {
        name: role.name,
        description: role.description,
        scopes: role.scopes,
      },
    );
    return normalizeRole(response.data);
  }

  async updateRole(key: string, changes: Partial<Role>): Promise<Role> {
    const response = await httpClient.put<Partial<Role> & { _id?: string }>(
      `${API_URL}/${key}`,
      {
        name: changes.name,
        description: changes.description,
        scopes: changes.scopes,
      },
    );
    return normalizeRole(response.data);
  }

  async deleteRole(
    key: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${API_URL}/${key}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Rol eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message ?? "No se pudo eliminar el rol",
      };
    }
  }
}

export const RoleService = new RoleServiceClass();
