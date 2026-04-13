import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { User } from "../models/user";

const USERS_API_URL = `${API_CONFIG.permisosBaseUrl}/users`;

type UserApiShape = Partial<User> & {
  _id?: string;
  id?: string;
};

const normalizeUser = (user: UserApiShape): User => ({
  id: user.id ?? user._id ?? "",
  name: user.name ?? "",
  email: user.email ?? "",
  roleIds: Array.isArray(user.roleIds) ? user.roleIds.filter(Boolean) : [],
  password: user.password,
});

class UserServiceClass {
  async getUsers(): Promise<User[]> {
    const response = await httpClient.get<UserApiShape[]>(USERS_API_URL);
    return response.data.map(normalizeUser);
  }

  async getUser(id: string): Promise<User> {
    const response = await httpClient.get<UserApiShape>(
      `${USERS_API_URL}/${id}`,
    );
    return normalizeUser(response.data);
  }

  async createUser(user: Omit<User, "id">): Promise<User> {
    const response = await httpClient.post<UserApiShape>(USERS_API_URL, {
      name: user.name,
      email: user.email,
      password: user.password,
      roleIds: user.roleIds,
    });
    return normalizeUser(response.data);
  }

  async updateUser(id: string, changes: Partial<User>): Promise<User> {
    const response = await httpClient.put<UserApiShape>(
      `${USERS_API_URL}/${id}`,
      {
        name: changes.name,
        email: changes.email,
        password: changes.password,
        roleIds: changes.roleIds,
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
        message:
          err.response?.data?.message ?? "No se pudo eliminar el usuario",
      };
    }
  }
}

export const UserService = new UserServiceClass();
