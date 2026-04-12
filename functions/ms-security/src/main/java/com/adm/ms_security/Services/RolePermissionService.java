package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.RolePermission;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RolePermissionService {
    @Autowired
    private RoleRepository theRoleRepository;

    @Autowired
    private PermissionRepository thePermissionRepository;

    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    @Autowired
    private UserRoleRepository theUserRoleRepository;

    @Autowired
    private EmailService theEmailService;

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
            notifyUsersByRolePermissionChange(role, permission, "agrego");
            return true;
        } else {
            return false;
        }
    }

    public boolean removeRolePermission(String rolePermissionId) {
        RolePermission rolePermission = this.theRolePermissionRepository.findById(rolePermissionId).orElse(null);
        if (rolePermission != null) {
            Role role = rolePermission.getRole();
            Permission permission = rolePermission.getPermission();
            this.theRolePermissionRepository.delete(rolePermission);
            notifyUsersByRolePermissionChange(role, permission, "removio");
            return true;
        } else {
            return false;
        }
    }

    public List<RolePermission> getPermissionsByRole(String roleId) {
        return this.theRolePermissionRepository.getPermissionsByRole(roleId);
    }

    private void notifyUsersByRolePermissionChange(Role role, Permission permission, String action) {
        if (role == null || role.getId() == null || permission == null) {
            return;
        }

        List<UserRole> usersWithRole = this.theUserRoleRepository.findAllByRole(role);
        Set<String> notifiedUsers = new HashSet<>();
        for (UserRole userRole : usersWithRole) {
            User user = userRole.getUser();
            if (user == null || user.getId() == null || !notifiedUsers.add(user.getId())) {
                continue;
            }
            this.theEmailService.sendPermissionUpdatedEmail(user, role, permission, action);
        }
    }
}
