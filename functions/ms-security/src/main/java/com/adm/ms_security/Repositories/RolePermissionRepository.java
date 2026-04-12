package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.RolePermission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {
    @Query("{'role.$id' : ObjectId(?0),'permission.$id' : ObjectId(?1)}")
    public RolePermission getRolePermission(String roleId, String permissionId);

    @Query("{'role.$id' : ObjectId(?0)}")
    public List<RolePermission> getPermissionsByRole(String roleId);

    @Query(value = "{'permission.$id' : ObjectId(?0)}", exists = true)
    boolean existsByPermissionId(String permissionId);

    RolePermission findByRoleAndPermission(Role role, Permission permission);

    List<RolePermission> findAllByRole(Role role);
}
