import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { User } from "../models/user";

const USERS_API_URL = `${API_CONFIG.permisosBaseUrl}/users`;

const normalizeUser = (user: Partial<User> & { _id?: string }): User => ({
  uid: user.uid ?? user._id ?? "",
  name: user.name ?? "",
  email: user.email ?? "",
  roles: Array.isArray(user.roles) ? user.roles : [],
  customScopes: Array.isArray(user.customScopes) ? user.customScopes : [],
});

class UserServiceClass {
  /**
   * Obtiene todos los usuarios disponibles
   * @async
   * @returns {Promise<User[]>} Lista de usuarios
   * @throws {Error} Si la solicitud falla
   */
  async getUsers(): Promise<User[]> {
    const response =
      await httpClient.get<Array<Partial<User> & { _id?: string }>>(
        USERS_API_URL,
      );
    return response.data.map(normalizeUser);
  }

  async getUser(id: string): Promise<User> {
    const response = await httpClient.get<Partial<User> & { _id?: string }>(
      `${USERS_API_URL}/${id}`,
    );
    return normalizeUser(response.data);
  }

  async getUserByEmail(email: string): Promise<User> {
    const response = await httpClient.get<Partial<User> & { _id?: string }>(
      `${USERS_API_URL}/email/${encodeURIComponent(email)}`,
    );
    return normalizeUser(response.data);
  }

  async createUser(user: Omit<User, "uid">): Promise<User> {
    const response = await httpClient.post<Partial<User> & { _id?: string }>(
      USERS_API_URL,
      {
        name: user.name,
        email: user.email,
        roles: user.roles,
        customScopes: user.customScopes,
      },
    );
    return normalizeUser(response.data);
  }

  async updateUser(id: string, changes: Partial<User>): Promise<User> {
    const response = await httpClient.put<Partial<User> & { _id?: string }>(
      `${USERS_API_URL}/${id}`,
      {
        name: changes.name,
        email: changes.email,
        roles: changes.roles,
        customScopes: changes.customScopes,
      },
    );
    return normalizeUser(response.data);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${USERS_API_URL}/${id}`);

      return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Usuario eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message:
          err.response?.data?.message ?? "No se pudo eliminar el usuario",
      };
    }
  }

  async getUserPermissions(uid: string): Promise<string[]> {
    const response = await httpClient.get<string[]>(
      `${USERS_API_URL}/${uid}/permissions`,
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async getManyUsersPermissions(
    uids: string[],
  ): Promise<Record<string, string[]>> {
    if (uids.length === 0) {
      return {};
    }

    const results = await Promise.all(
      uids.map(async (uid) => {
        try {
          const permissions = await this.getUserPermissions(uid);
          return [uid, permissions] as const;
        } catch {
          return [uid, []] as const;
        }
      }),
    );

    return Object.fromEntries(results);
  }
}

export const UserService = new UserServiceClass();
