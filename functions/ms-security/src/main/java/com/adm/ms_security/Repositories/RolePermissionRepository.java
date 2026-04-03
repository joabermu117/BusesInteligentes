package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.RolePermission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {
    @Query("{'role.$id' : ObjectId(?0),'permission.$id' : ObjectId(?1)}")
    public RolePermission getRolePermission(String roleId, String permissionId);
}
