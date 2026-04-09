import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";

const API_URL = `${API_CONFIG.permisosBaseUrl}/user-role`;

export interface UserRoleRelation {
  id: string;
  userId: string;
  roleId: string;
}

type UserRoleApiShape = {
  id?: string;
  _id?: string;
  user?: { id?: string; _id?: string };
  role?: { id?: string; _id?: string };
};

const normalizeUserRole = (relation: UserRoleApiShape): UserRoleRelation => ({
  id: relation.id ?? relation._id ?? "",
  userId: relation.user?.id ?? relation.user?._id ?? "",
  roleId: relation.role?.id ?? relation.role?._id ?? "",
});

class UserRoleServiceClass {
  async getRolesByUser(userId: string): Promise<UserRoleRelation[]> {
    const response = await httpClient.get<UserRoleApiShape[]>(
      `${API_URL}/user/${userId}`,
    );
    return response.data.map(normalizeUserRole);
  }

  async addUserRole(userId: string, roleId: string): Promise<void> {
    await httpClient.post(`${API_URL}/user/${userId}/role/${roleId}`);
  }

  async removeUserRole(userRoleId: string): Promise<void> {
    await httpClient.delete(`${API_URL}/${userRoleId}`);
  }
}

export const UserRoleService = new UserRoleServiceClass();
