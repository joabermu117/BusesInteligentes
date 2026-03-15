/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { User } from "../models/user";

const API_URL = `${import.meta.env.VITE_API_URL_PERMISOS}/users`;

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
    try {
      if (this.usersListCache) return this.usersListCache;
      const response = await axios.get<ApiResponse<User[]>>(API_URL);
      if (!response.data.success) throw new Error(response.data.message);
      this.usersListCache = response.data.data;
      // Prellenar cache por uid
      for (const u of this.usersListCache) this.userByUidCache.set(u.uid, u);
      return this.usersListCache;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Obtiene un usuario por su UID
   * @async
   * @param {string} uid - UID del usuario
   * @returns {Promise<User>} Usuario encontrado
   * @throws {Error} Si no se encuentra el usuario
   */
  async getUser(uid: string): Promise<User> {
    try {
      const cached = this.userByUidCache.get(uid);
      if (cached) return cached;
      const response = await axios.get<SingleItemResponse>(`${API_URL}/${uid}`);
      if (!response.data.success) throw new Error(response.data.message);
      this.userByUidCache.set(uid, response.data.data);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Obtiene un usuario por su email
   * @async
   * @param {string} email - Email del usuario
   * @returns {Promise<User>} Usuario encontrado
   * @throws {Error} Si no se encuentra el usuario
   */
  async getUserByEmail(email: string): Promise<User> {
    try {
      const cached = this.userByEmailCache.get(email);
      if (cached) return cached;
      const response = await axios.get<SingleItemResponse>(
        `${API_URL}/email/${email}`,
      );
      if (!response.data.success) throw new Error(response.data.message);
      this.userByEmailCache.set(email, response.data.data);
      // sincroniza cache por uid
      this.userByUidCache.set(response.data.data.uid, response.data.data);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Valida si un usuario existe por email (ruta pública para login)
   * @async
   * @param {string} email - Email del usuario a validar
   * @returns {Promise<User | null>} Usuario encontrado o null si no existe
   * @throws {Error} Si hay error de conexión
   */
  async validateUserByEmail(email: string): Promise<User | null> {
    try {
      // Usa cache de sesión primero
      if (this.userByEmailCache.has(email)) {
        return this.userByEmailCache.get(email) ?? null;
      }

      // Deduplicación de llamadas concurrentes
      const inflight = this.inflightValidations.get(email);
      if (inflight) return inflight;

      const promise = (async () => {
        const response = await axios.get<SingleItemResponse>(
          `${API_URL}/validate/${email}`,
        );
        if (!response.data.success) {
          this.userByEmailCache.set(email, null);
          return null;
        }
        const user = response.data.data;
        this.userByEmailCache.set(email, user);
        this.userByUidCache.set(user.uid, user);
        return user;
      })();

      this.inflightValidations.set(email, promise);
      try {
        return await promise;
      } finally {
        this.inflightValidations.delete(email);
      }
    } catch (error) {
      const err = error as any;
      if (err.response?.status === 404) {
        this.userByEmailCache.set(email, null);
        return null; // Usuario no encontrado
      }
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Crea un nuevo usuario
   * @async
   * @param {Omit<User, 'uid'>} user - Datos del nuevo usuario (sin el campo uid)
   * @returns {Promise<User>} Usuario creado
   * @throws {Error} Si la creación falla
   */
  async createUser(user: Omit<User, "uid">): Promise<User> {
    try {
      const response = await axios.post<SingleItemResponse>(API_URL, user);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Crea un nuevo usuario con UID explícito
   * @async
   * @param {string} uid - UID del usuario
   * @param {Omit<User, 'uid'>} user - Datos del nuevo usuario (sin el campo uid)
   * @returns {Promise<User>} Usuario creado
   * @throws {Error} Si la creación falla
   */
  async createUserWithUid(uid: string, user: Omit<User, "uid">): Promise<User> {
    try {
      const response = await axios.post<SingleItemResponse>(
        `${API_URL}/${uid}`,
        user,
      );
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Actualiza un usuario existente
   * @async
   * @param {string} uid - UID del usuario a actualizar
   * @param {Partial<User>} changes - Campos a actualizar
   * @returns {Promise<User>} Usuario actualizado
   * @throws {Error} Si la actualización falla
   */
  async updateUser(uid: string, changes: Partial<User>): Promise<User> {
    try {
      // Eliminar la propiedad "uid" del objeto changes
      delete changes.uid;
      const response = await axios.put<SingleItemResponse>(
        `${API_URL}/${uid}`,
        changes,
      );
      if (!response.data.success) throw new Error(response.data.message);
      // Actualiza caches
      this.userByUidCache.set(uid, response.data.data);
      // invalidar lista cacheada
      this.usersListCache = null;
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Elimina un usuario
   * @async
   * @param {string} uid - UID del usuario a eliminar
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
   */
  async deleteUser(
    uid: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete<{
        success: boolean;
        message: string;
        data: null;
      }>(`${API_URL}/${uid}`);

      // invalidar caches
      this.userByUidCache.delete(uid);
      this.usersListCache = null;
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      const err = error as any;
      const backendMessage = err.response?.data?.message || err.message;
      return {
        success: false,
        message: backendMessage,
      };
    }
  }

  /**
   * Obtiene los permisos efectivos de un usuario
   * @async
   * @param {string} uid - UID del usuario
   * @returns {Promise<string[]>} Lista de permisos efectivos
   * @throws {Error} Si falla la operación
   */
  async getUserPermissions(uid: string): Promise<string[]> {
    try {
      const response = await axios.get<PermissionsResponse>(
        `${API_URL}/${uid}/permissions`,
      );
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Obtiene las UEN del usuario autenticado
   * @async
   * @returns {Promise<string[]>} Lista de códigos de UEN
   * @throws {Error} Si falla la operación
   */
  async getMyUen(): Promise<string[]> {
    try {
      const response = await axios.get<PermissionsResponse>(
        `${API_URL}/me/uen`,
      );
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Obtiene el SlpCode SAP del usuario autenticado
   * @async
   * @returns {Promise<number | null>} SlpCode del vendedor SAP o null si no tiene asignado
   * @throws {Error} Si falla la operación
   */
  async getMySlpCode(): Promise<number | null> {
    try {
      const response = await axios.get<{
        success: boolean;
        data: { slpCode: number | null };
        message: string;
      }>(`${API_URL}/me/slp-code`);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data.slpCode;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Obtiene los permisos efectivos de un usuario (alias de getUserPermissions)
   * @async
   * @param {string} uid - UID del usuario
   * @returns {Promise<string[]>} Lista de permisos efectivos
   * @throws {Error} Si falla la operación
   */
  async getUserEfectivePermissions(uid: string): Promise<string[]> {
    return this.getUserPermissions(uid);
  }

  async getManyUsersPermissions(
    uids: string[],
  ): Promise<Record<string, string[]>> {
    try {
      const qs = encodeURIComponent(uids.join(","));
      const response = await axios.get<BatchPermissionsResponse>(
        `${API_URL}/permissions?uids=${qs}`,
      );
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Migra un usuario temporal (temp_...) a un UID real de Firebase
   * @param {string} fromUid - UID temporal
   * @param {string} toUid - UID real de Firebase
   * @returns {Promise<User>} Usuario migrado
   */
  async migrateUser(fromUid: string, toUid: string): Promise<User> {
    try {
      const response = await axios.post<SingleItemResponse>(
        `${API_URL}/migrate`,
        {
          fromUid,
          toUid,
        },
      );
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }
}

export const UserService = new UserServiceClass();
