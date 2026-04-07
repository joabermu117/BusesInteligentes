import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { User } from "../models/user";

const USERS_API_URL = `${API_CONFIG.permisosBaseUrl}/users`;

const normalizeUser = (user: Partial<User> & { _id?: string; id?: string }): User => ({
  uid: user.uid ?? user.id ?? user._id ?? "",
  name: user.name ?? "",
  email: user.email ?? "",
  roles: Array.isArray(user.roles) ? user.roles : [],
  customScopes: Array.isArray(user.customScopes) ? user.customScopes : [],
  password: "",
});

class UserServiceClass {
  async getUsers(): Promise<User[]> {
    const response = await httpClient.get<Array<Partial<User> & { _id?: string; id?: string }>>(
      USERS_API_URL,
    );
    return response.data.map(normalizeUser);
  }

  async getUser(id: string): Promise<User> {
    const response = await httpClient.get<Partial<User> & { _id?: string; id?: string }>(
      `${USERS_API_URL}/${id}`,
    );
    return normalizeUser(response.data);
  }

  async createUser(user: Omit<User, "uid">): Promise<User> {
    const response = await httpClient.post<Partial<User> & { _id?: string; id?: string }>(
      USERS_API_URL,
      {
        name: user.name,
        email: user.email,
        password: user.password,
        roles: user.roles,
        customScopes: user.customScopes,
      },
    );
    return normalizeUser(response.data);
  }

  async updateUser(id: string, changes: Partial<User>): Promise<User> {
    const response = await httpClient.put<Partial<User> & { _id?: string; id?: string }>(
      `${USERS_API_URL}/${id}`,
      {
        name: changes.name,
        email: changes.email,
        password: changes.password,
        roles: changes.roles,
        customScopes: changes.customScopes,
      },
    );
    return normalizeUser(response.data);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await httpClient.delete(`${USERS_API_URL}/${id}`);
      return {
        success: true,
        message: "Usuario eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message ?? "No se pudo eliminar el usuario",
      };
    }
  }
}

export const UserService = new UserServiceClass();
