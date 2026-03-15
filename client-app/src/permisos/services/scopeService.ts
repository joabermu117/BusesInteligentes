/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { Scope } from "../models/Scope.ts";

const API_URL = `${import.meta.env.VITE_API_URL_PERMISOS}/scopes`;

interface ApiResponse<T = Scope[]> {
  success: boolean;
  data: T;
  message: string;
}

interface SingleItemResponse {
  success: boolean;
  data: Scope;
  message: string;
}

class ScopeServiceClass {
  /**
   * Obtiene todos los scopes disponibles
   * @async
   * @returns {Promise<Scope[]>} Lista de scopes
   * @throws {Error} Si la solicitud falla
   */
  async getScopes(): Promise<Scope[]> {
    try {
      const response = await axios.get<ApiResponse<Scope[]>>(API_URL);

      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  }

  /**
   * Obtiene un scope por su key
   * @async
   * @param {string} key - Identificador del scope
   * @returns {Promise<Scope>} Scope encontrado
   * @throws {Error} Si la solicitud falla
   */
  async getScopeByKey(key: string): Promise<Scope> {
    const response = await axios.get<SingleItemResponse>(`${API_URL}/${key}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Crea un nuevo scope
   * @async
   * @param {Omit<Scope, 'key'>} scope - Datos del nuevo scope (sin el campo key)
   * @returns {Promise<Scope>} Scope creado
   * @throws {Error} Si la creación falla
   */
  async createScope(
    scope: Omit<Scope, "key" | "deprecated" | "categoryName">,
  ): Promise<Scope> {
    const response = await axios.post<SingleItemResponse>(API_URL, scope);

    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Actualiza un scope existente
   * @async
   * @param {string} key - Identificador único del scope
   * @param {Partial<Scope>} changes - Campos a actualizar
   * @returns {Promise<Scope>} Scope actualizado
   * @throws {Error} Si la actualización falla
   */
  async updateScope(key: string, changes: Partial<Scope>): Promise<Scope> {
    // Eliminar la propiedad "key" del objeto changes
    delete changes.key;
    const response = await axios.put<SingleItemResponse>(
      `${API_URL}/${key}`,
      changes,
    );

    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Elimina un scope
   * @async
   * @param {string} key - ID del scope a eliminar
   * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
   */
  async deleteScope(
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
      // Manejo de errores HTTP (400, 500, etc.)
      const err = error as any;
      const backendMessage = err.response?.data?.message || err.message;
      return {
        success: false,
        message: backendMessage,
      };
    }
  }
}

export const ScopeService = new ScopeServiceClass();
