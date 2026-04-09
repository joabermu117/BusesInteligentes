import { API_CONFIG } from "../../config/apiConfig";
import httpClient from "../../config/httpClient";
import type { User } from "../models/user";
import { UserRoleService } from "./UserRoleService";

const USERS_API_URL = `${API_CONFIG.permisosBaseUrl}/users`;

type UserApiShape = Partial<User> & {
  _id?: string;
  id?: string;
};

const normalizeUser = (user: UserApiShape): User => ({
  id: user.id ?? user._id ?? "",
  name: user.name ?? "",
  email: user.email ?? "",
  roleIds: [],
  password: user.password,
});

class UserServiceClass {
  async getUsers(): Promise<User[]> {
    const response = await httpClient.get<UserApiShape[]>(USERS_API_URL);
    const users = response.data.map(normalizeUser);

    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const relations = await UserRoleService.getRolesByUser(user.id);
        return {
          ...user,
          roleIds: relations.map((relation) => relation.roleId).filter(Boolean),
        };
      }),
    );

    return usersWithRoles;
  }

  async getUser(id: string): Promise<User> {
    const response = await httpClient.get<UserApiShape>(
      `${USERS_API_URL}/${id}`,
    );
    const baseUser = normalizeUser(response.data);
    const relations = await UserRoleService.getRolesByUser(id);
    return {
      ...baseUser,
      roleIds: relations.map((relation) => relation.roleId).filter(Boolean),
    };
  }

  async createUser(user: Omit<User, "id">): Promise<User> {
    const response = await httpClient.post<UserApiShape>(USERS_API_URL, {
      name: user.name,
      email: user.email,
      password: user.password,
    });

    const createdUser = normalizeUser(response.data);
    const createdUserId = createdUser.id;

    if (
      createdUserId &&
      Array.isArray(user.roleIds) &&
      user.roleIds.length > 0
    ) {
      await Promise.all(
        user.roleIds
          .filter(Boolean)
          .map((roleId) => UserRoleService.addUserRole(createdUserId, roleId)),
      );
    }

    return this.getUser(createdUserId);
  }

  async updateUser(id: string, changes: Partial<User>): Promise<User> {
    const response = await httpClient.put<UserApiShape>(
      `${USERS_API_URL}/${id}`,
      {
        name: changes.name,
        email: changes.email,
        password: changes.password,
      },
    );

    if (Array.isArray(changes.roleIds)) {
      const currentRelations = await UserRoleService.getRolesByUser(id);
      const currentRoleIds = currentRelations.map(
        (relation) => relation.roleId,
      );
      const nextRoleIds = Array.from(new Set(changes.roleIds.filter(Boolean)));

      const relationsToRemove = currentRelations.filter(
        (relation) => !nextRoleIds.includes(relation.roleId),
      );

      const roleIdsToAdd = nextRoleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId),
      );

      await Promise.all(
        relationsToRemove.map((relation) =>
          UserRoleService.removeUserRole(relation.id),
        ),
      );
      await Promise.all(
        roleIdsToAdd.map((roleId) => UserRoleService.addUserRole(id, roleId)),
      );
    }

    const normalizedUser = normalizeUser(response.data);
    return {
      ...normalizedUser,
      roleIds: (await UserRoleService.getRolesByUser(id)).map(
        (relation) => relation.roleId,
      ),
    };
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
