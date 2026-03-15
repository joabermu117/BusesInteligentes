/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { ScopeCategory } from "../models/ScopeCategory.ts";

const API_URL = `${import.meta.env.VITE_API_URL_PERMISOS}/scopeCategories`;

/**
 * Interfaz que representa la estructura de respuesta estándar para múltiples elementos
 * @interface ApiResponse
 * @property {boolean} success - Indica si la solicitud fue exitosa
 * @property {ScopeCategory[]} data - Array de categorías de alcance
 * @property {string} message - Mensaje descriptivo de la respuesta
 */
interface ApiResponse {
  success: boolean;
  data: ScopeCategory[];
  message: string;
}

/**
 * Interfaz que representa la estructura de respuesta estándar para un solo elemento
 * @interface SingleItemResponse
 * @property {boolean} success - Indica si la solicitud fue exitosa
 * @property {ScopeCategory} data - Categoría de alcance individual
 * @property {string} message - Mensaje descriptivo de la respuesta
 */
interface SingleItemResponse {
  success: boolean;
  data: ScopeCategory;
  message: string;
}

/**
 * Clase que encapsula las operaciones CRUD para categorías de alcance
 * @class ScopeCategoryServiceClass
 */
class ScopeCategoryServiceClass {
  /**
   * Obtiene todas las categorías de alcance disponibles
   * @async
   * @method getCategories
   * @returns {Promise<ScopeCategory[]>} Promesa que resuelve con un array de categorías
   * @throws {Error} Si la solicitud no es exitosa
   */
  async getCategories(): Promise<ScopeCategory[]> {
    const response = await axios.get<ApiResponse>(API_URL);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Obtiene una categoría de alcance específica por su ID
   * @async
   * @method getCategoryById
   * @param {string} id - ID de la categoría a buscar
   * @returns {Promise<ScopeCategory>} Promesa que resuelve con la categoría encontrada
   * @throws {Error} Si la solicitud no es exitosa
   */
  async getCategoryById(id: string): Promise<ScopeCategory> {
    const response = await axios.get<SingleItemResponse>(`${API_URL}/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Crea una nueva categoría de alcance
   * @async
   * @method createCategory
   * @param {Omit<ScopeCategory, "id">} category - Datos de la nueva categoría (sin ID)
   * @returns {Promise<ScopeCategory>} Promesa que resuelve con la categoría creada
   * @throws {Error} Si la solicitud no es exitosa
   */
  async createCategory(
    category: Omit<ScopeCategory, "id">,
  ): Promise<ScopeCategory> {
    const response = await axios.post<SingleItemResponse>(API_URL, category);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Actualiza una categoría de alcance existente
   * @async
   * @method updateCategory
   * @param {string} id - ID de la categoría a actualizar
   * @param {Partial<ScopeCategory>} category - Datos parciales de la categoría a actualizar
   * @returns {Promise<ScopeCategory>} Promesa que resuelve con la categoría actualizada
   * @throws {Error} Si la solicitud no es exitosa
   */
  async updateCategory(
    id: string,
    category: Partial<ScopeCategory>,
  ): Promise<ScopeCategory> {
    // Eliminar la propiedad "id" del objeto category
    delete category.id;
    const response = await axios.put<SingleItemResponse>(
      `${API_URL}/${id}`,
      category,
    );

    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Elimina una categoría de alcance específica
   * @async
   * @method deleteCategory
   * @param {string} id - ID de la categoría a eliminar
   * @returns {Promise<{success: boolean, message: string}>} Promesa que resuelve con el estado y mensaje de la operación
   */
  async deleteCategory(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete<{
        success: boolean;
        message: string;
        data: null;
      }>(`${API_URL}/${id}`);

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      // Manejo de errores HTTP (400, 500, etc.)
      const err = error as any;
      const backendMessage = err.response?.data?.message;
      return {
        success: false,
        message: backendMessage, // Mensaje del backend o genérico
      };
    }
  }
}

/**
 * Instancia del servicio de categorías de alcance para uso en la aplicación
 * @constant ScopeCategoryService
 * @type {ScopeCategoryServiceClass}
 */
export const ScopeCategoryService = new ScopeCategoryServiceClass();
