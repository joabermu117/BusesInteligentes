/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { Role } from "../models/Role.ts";

const API_URL = `${import.meta.env.VITE_API_URL_PERMISOS}/roles`;

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
    const response = await axios.get<ApiResponse<Role[]>>(API_URL);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Obtiene un rol por su key
   * @async
   * @param {string} key - Identificador del rol
   * @returns {Promise<Role>} Rol encontrado
   * @throws {Error} Si la solicitud falla
   */
  async getRoleByKey(key: string): Promise<Role> {
    const response = await axios.get<SingleItemResponse>(`${API_URL}/${key}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Crea un nuevo rol
   * @async
   * @param {Omit<Role, 'key'>} role - Datos del nuevo rol (sin el campo key)
   * @returns {Promise<Role>} Rol creado
   * @throws {Error} Si la creación falla
   */
  async createRole(role: Omit<Role, "key">): Promise<Role> {
    try {
      const response = await axios.post<SingleItemResponse>(API_URL, role);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      // LOG DETALLADO
      console.error("Error al crear rol (frontend):", error);
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }

  /**
   * Actualiza un rol existente
   * @async
   * @param {string} key - Identificador único del rol
   * @param {Partial<Role>} changes - Campos a actualizar
   * @returns {Promise<Role>} Rol actualizado
   * @throws {Error} Si la actualización falla
   */
  async updateRole(key: string, changes: Partial<Role>): Promise<Role> {
    try {
      // Eliminar la propiedad "key" del objeto changes
      delete changes.key;
      const response = await axios.put<SingleItemResponse>(
        `${API_URL}/${key}`,
        changes,
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error) {
      // LOG DETALLADO
      console.error("Error al actualizar rol (frontend):", error);
      const err = error as any;
      const message = err.response?.data?.message || err.message;
      throw new Error(message);
    }
  }
  /**
   * Elimina un rol
   * @async
   * @param {string} key - ID del rol a eliminar
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
   */
  async deleteRole(
    key: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete<{
        success: boolean;
        message: string;
        data: null;
      }>(`${API_URL}/${key}`);

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
}

export const RoleService = new RoleServiceClass();
