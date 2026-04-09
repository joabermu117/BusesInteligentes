import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";

const API_URL = `${API_CONFIG.permisosBaseUrl}/role-permission`;

export interface RolePermissionRelation {
  id: string;
  roleId: string;
  permissionId: string;
}

type RolePermissionApiShape = {
  id?: string;
  _id?: string;
  role?: { id?: string; _id?: string };
  permission?: { id?: string; _id?: string };
};

const normalizeRolePermission = (
  relation: RolePermissionApiShape,
): RolePermissionRelation => ({
  id: relation.id ?? relation._id ?? "",
  roleId: relation.role?.id ?? relation.role?._id ?? "",
  permissionId: relation.permission?.id ?? relation.permission?._id ?? "",
});

class RolePermissionServiceClass {
  async getPermissionsByRole(
    roleId: string,
  ): Promise<RolePermissionRelation[]> {
    const response = await httpClient.get<RolePermissionApiShape[]>(
      `${API_URL}/role/${roleId}`,
    );
    return response.data.map(normalizeRolePermission);
  }

  async addRolePermission(roleId: string, permissionId: string): Promise<void> {
    await httpClient.post(
      `${API_URL}/role/${roleId}/permission/${permissionId}`,
    );
  }

  async removeRolePermission(rolePermissionId: string): Promise<void> {
    await httpClient.delete(`${API_URL}/${rolePermissionId}`);
  }
}

export const RolePermissionService = new RolePermissionServiceClass();
