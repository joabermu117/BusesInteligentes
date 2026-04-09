import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { Role } from "../models/Role";
import { RolePermissionService } from "./RolePermissionService";

const API_URL = `${API_CONFIG.permisosBaseUrl}/roles`;

type RoleApiShape = Partial<Role> & { _id?: string };

const normalizeRole = (role: RoleApiShape): Role => ({
  id: role.id ?? role._id ?? "",
  name: role.name ?? "",
  description: role.description ?? "",
  permissionIds: [],
});

class RoleServiceClass {
  /**
   * Obtiene todos los roles disponibles
   * @async
   * @returns {Promise<Role[]>} Lista de roles
   * @throws {Error} Si la solicitud falla
   */
  async getRoles(): Promise<Role[]> {
    const response = await httpClient.get<RoleApiShape[]>(API_URL);
    const roles = response.data.map(normalizeRole);

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const relations = await RolePermissionService.getPermissionsByRole(
          role.id,
        );
        return {
          ...role,
          permissionIds: relations
            .map((relation) => relation.permissionId)
            .filter(Boolean),
        };
      }),
    );

    return rolesWithPermissions;
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await httpClient.get<RoleApiShape>(`${API_URL}/${id}`);
    const role = normalizeRole(response.data);
    const relations = await RolePermissionService.getPermissionsByRole(id);
    return {
      ...role,
      permissionIds: relations
        .map((relation) => relation.permissionId)
        .filter(Boolean),
    };
  }

  async createRole(role: Omit<Role, "id">): Promise<Role> {
    const response = await httpClient.post<RoleApiShape>(API_URL, {
      name: role.name,
      description: role.description,
    });
    const createdRole = normalizeRole(response.data);
    const createdRoleId = createdRole.id;

    if (
      createdRoleId &&
      Array.isArray(role.permissionIds) &&
      role.permissionIds.length > 0
    ) {
      await Promise.all(
        role.permissionIds
          .filter(Boolean)
          .map((permissionId) =>
            RolePermissionService.addRolePermission(
              createdRoleId,
              permissionId,
            ),
          ),
      );
    }

    return this.getRoleById(createdRoleId);
  }

  async updateRole(id: string, changes: Partial<Role>): Promise<Role> {
    const response = await httpClient.put<RoleApiShape>(`${API_URL}/${id}`, {
      name: changes.name,
      description: changes.description,
    });

    if (Array.isArray(changes.permissionIds)) {
      const currentRelations =
        await RolePermissionService.getPermissionsByRole(id);
      const currentPermissionIds = currentRelations.map(
        (relation) => relation.permissionId,
      );
      const nextPermissionIds = Array.from(
        new Set(changes.permissionIds.filter(Boolean)),
      );

      const relationsToRemove = currentRelations.filter(
        (relation) => !nextPermissionIds.includes(relation.permissionId),
      );

      const permissionIdsToAdd = nextPermissionIds.filter(
        (permissionId) => !currentPermissionIds.includes(permissionId),
      );

      await Promise.all(
        relationsToRemove.map((relation) =>
          RolePermissionService.removeRolePermission(relation.id),
        ),
      );

      await Promise.all(
        permissionIdsToAdd.map((permissionId) =>
          RolePermissionService.addRolePermission(id, permissionId),
        ),
      );
    }

    const normalizedRole = normalizeRole(response.data);
    return {
      ...normalizedRole,
      permissionIds: (await RolePermissionService.getPermissionsByRole(id)).map(
        (relation) => relation.permissionId,
      ),
    };
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{
        success?: boolean;
        message?: string;
      }>(`${API_URL}/${id}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message ?? "Rol eliminado correctamente",
      };
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message ?? "No se pudo eliminar el rol",
      };
    }
  }
}

export const RoleService = new RoleServiceClass();
