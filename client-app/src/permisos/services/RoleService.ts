import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Role } from "../models/Role";

const API_URL = `${API_CONFIG.permisosBaseUrl}/roles`;

interface ApiResponse<T = Role[]> {
  success: boolean;
  data: T;
  message: string;
}

interface SingleItemResponse {
  success: boolean;
  data: Role;
  message: string;
}

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

  async getRoleById(id: string): Promise<Role> {
    const response = await httpClient.get<Partial<Role> & { _id?: string }>(
      `${API_URL}/${id}`,
    );
    return normalizeRole(response.data);
  }

  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const response = await httpClient.post<Partial<Role> & { _id?: string }>(
      API_URL,
      {
        name: role.name,
        description: role.description,
      },
    );
    return normalizeRole(response.data);
  }

  async updateRole(id: string, changes: Partial<Role>): Promise<Role> {
    const response = await httpClient.put<Partial<Role> & { _id?: string }>(
      `${API_URL}/${id}`,
      {
        name: changes.name,
        description: changes.description,
      },
    );
    return normalizeRole(response.data);
  }

  async deleteRole(id: string): Promise<void> {
    await httpClient.delete(`${API_URL}/${id}`);
  }
}

export const RoleService = new RoleServiceClass();
