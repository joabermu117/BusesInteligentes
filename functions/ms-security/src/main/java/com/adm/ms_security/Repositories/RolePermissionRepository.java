package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.RolePermission;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RolePermissionRepository extends MongoRepository<RolePermission, String> {
}
