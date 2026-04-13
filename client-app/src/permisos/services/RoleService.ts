import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Role } from "../models/Role";

const API_URL = `${API_CONFIG.permisosBaseUrl}/roles`;

type RoleApiShape = Partial<Role> & { _id?: string };

const normalizeRole = (role: RoleApiShape): Role => ({
  id: role.id ?? role._id ?? "",
  name: role.name ?? "",
  description: role.description ?? "",
  permissionIds: Array.isArray(role.permissionIds)
    ? role.permissionIds.filter(Boolean)
    : [],
});

class RoleServiceClass {
  /**
   * Obtiene todos los roles disponibles
   * @async
   * @returns {Promise<Role[]>} Lista de roles
   * @throws {Error} Si la solicitud falla
   */
  async getRoles(): Promise<Role[]> {
    const response = await httpClient.get<RoleApiShape[]>(API_URL);
    return response.data.map(normalizeRole);
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await httpClient.get<RoleApiShape>(`${API_URL}/${id}`);
    return normalizeRole(response.data);
  }

  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const response = await httpClient.post<RoleApiShape>(API_URL, {
      name: role.name,
      description: role.description,
      permissionIds: role.permissionIds,
    });
    return normalizeRole(response.data);
  }

  async updateRole(id: string, changes: Partial<Role>): Promise<Role> {
    const response = await httpClient.put<RoleApiShape>(`${API_URL}/${id}`, {
      name: changes.name,
      description: changes.description,
      permissionIds: changes.permissionIds,
    });
    return normalizeRole(response.data);
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${API_URL}/${id}`);
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
