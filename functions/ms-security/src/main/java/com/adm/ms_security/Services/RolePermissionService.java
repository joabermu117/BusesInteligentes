package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.RolePermission;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RolePermissionService {
    @Autowired
    private RoleRepository theRoleRepository;

    @Autowired
    private PermissionRepository thePermissionRepository;

    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    public boolean addRolePermission(String roleId,
            String permissionId) {
        Role role = this.theRoleRepository.findById(roleId).orElse(null);
        Permission permission = this.thePermissionRepository.findById(permissionId).orElse(null);
        if (role != null && permission != null) {
            RolePermission existing = this.theRolePermissionRepository.findByRoleAndPermission(role, permission);
            if (existing != null) {
                return true;
            }
            RolePermission theRolePermission = new RolePermission(role, permission);
            this.theRolePermissionRepository.save(theRolePermission);
            return true;
        } else {
            return false;
        }
    }

    public boolean removeRolePermission(String rolePermissionId) {
        RolePermission rolePermission = this.theRolePermissionRepository.findById(rolePermissionId).orElse(null);
        if (rolePermission != null) {
            this.theRolePermissionRepository.delete(rolePermission);
            return true;
        } else {
            return false;
        }
    }

    public List<RolePermission> getPermissionsByRole(String roleId) {
        return this.theRolePermissionRepository.getPermissionsByRole(roleId);
    }
}
