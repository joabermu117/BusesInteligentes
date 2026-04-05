import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { User } from "../models/user";

const USERS_API_URL = `${API_CONFIG.permisosBaseUrl}/users`;
const USER_ROLE_API_URL = `${API_CONFIG.permisosBaseUrl}/user-role`;

interface ApiResponse<T = User[]> {
  success: boolean;
  data: T;
  message: string;
}

interface SingleItemResponse {
  success: boolean;
  data: User;
  message: string;
}

interface PermissionsResponse {
  success: boolean;
  data: string[];
  message: string;
}

interface BatchPermissionsResponse {
  success: boolean;
  data: Record<string, string[]>;
  message: string;
}

class UserServiceClass {
  // Caches simples por sesión para reducir llamadas redundantes
  private userByUidCache = new Map<string, User>();
  private usersListCache: User[] | null = null;
  private userByEmailCache = new Map<string, User | null>();
  private inflightValidations = new Map<string, Promise<User | null>>();

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

  async createUser(user: Omit<User, "id">): Promise<User> {
    const response = await httpClient.post<Partial<User> & { _id?: string }>(
      USERS_API_URL,
      {
        name: user.name,
        email: user.email,
        password: user.password,
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
        password: changes.password,
      },
    );
    return normalizeUser(response.data);
  }

  async deleteUser(id: string): Promise<void> {
    await httpClient.delete(`${USERS_API_URL}/${id}`);
  }

  async addRoleToUser(userId: string, roleId: string): Promise<void> {
    await httpClient.post(`${USER_ROLE_API_URL}/user/${userId}/role/${roleId}`);
  }
}

export const UserService = new UserServiceClass();
