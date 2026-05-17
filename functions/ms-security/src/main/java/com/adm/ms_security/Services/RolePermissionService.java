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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
/**
 * Gestiona relacion N:N entre roles y permisos.
 * Ademas notifica por correo a usuarios afectados por cambios de permisos.
 */
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

    // Asocia permiso a rol evitando duplicados y notificando impacto.
    // Invalida el cache de rolePermissions para que la vista de roles
    // refleje el cambio inmediatamente.
    @org.springframework.cache.annotation.CacheEvict(value = "rolePermissions", allEntries = true)
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

    // Elimina relacion rol-permiso y dispara notificacion a usuarios del rol.
    @org.springframework.cache.annotation.CacheEvict(value = "rolePermissions", allEntries = true)
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
        if (roleId == null || roleId.isBlank()) {
            return new ArrayList<>();
        }

        Role role = this.theRoleRepository.findById(roleId).orElse(null);
        if (role == null) {
            return new ArrayList<>();
        }

        List<RolePermission> relations = this.theRolePermissionRepository.findAllByRole(role);
        if (!relations.isEmpty()) {
            return relations;
        }

        // Compatibilidad con datos existentes cuando el mapping por entidad no devuelve
        // resultados.
        return this.theRolePermissionRepository.getPermissionsByRole(roleId);
    }

    public List<String> getPermissionIdsByRole(String roleId) {
        if (roleId == null || roleId.isBlank()) {
            return new ArrayList<>();
        }

        Set<String> permissionIds = new HashSet<>();
        for (RolePermission relation : getPermissionsByRole(roleId)) {
            if (relation == null || relation.getPermission() == null || relation.getPermission().getId() == null) {
                continue;
            }
            permissionIds.add(relation.getPermission().getId());
        }

        return new ArrayList<>(permissionIds);
    }

    /**
     * Batch: Obtiene los permissionIds de MULTIPLES roles en UNA SOLA consulta.
     * Los resultados se cachean con Caffeine (TTL 5 min) para evitar consultas
     * repetidas a MongoDB.
     * 
     * Estrategia:
     * 1. findAll() de RolePermission para TODOS los roles en UNA consulta
     * 2. Agrupar en Java por role.getRole().getId()
     * 
     * @param roles Lista de objetos Role (ya resueltos desde BD)
     * @return Mapa roleId -> lista de permissionIds
     */
    @org.springframework.cache.annotation.Cacheable(value = "rolePermissions", key = "'all'")
    public java.util.Map<String, List<String>> getPermissionIdsByRoles(List<Role> roles) {
        java.util.Map<String, List<String>> result = new java.util.LinkedHashMap<>();
        if (roles == null || roles.isEmpty()) {
            return result;
        }

        // Inicializar mapa vacío para todos los roles
        for (Role role : roles) {
            if (role != null && role.getId() != null) {
                result.put(role.getId(), new ArrayList<>());
            }
        }

        // UNA SOLA CONSULTA: findAll() trae todos los role_permission en 1 query.
        // Spring Data resuelve los @DBRef con consultas internas, pero como esto
        // se cachea con Caffeine (TTL 5 min), solo se paga el costo una vez.
        Set<String> targetRoleIds = result.keySet();
        List<RolePermission> allFromDb = this.theRolePermissionRepository.findAll();

        for (RolePermission rp : allFromDb) {
            if (rp == null || rp.getRole() == null || rp.getRole().getId() == null)
                continue;
            if (rp.getPermission() == null || rp.getPermission().getId() == null)
                continue;

            String roleId = rp.getRole().getId();
            if (targetRoleIds.contains(roleId)) {
                result.get(roleId).add(rp.getPermission().getId());
            }
        }

        return result;
    }

    @org.springframework.cache.annotation.CacheEvict(value = "rolePermissions", allEntries = true)
    public boolean syncPermissionsForRole(String roleId, List<String> permissionIds) {
        Role role = this.theRoleRepository.findById(roleId).orElse(null);
        if (role == null) {
            return false;
        }

        Set<String> nextPermissionIds = new HashSet<>();
        if (permissionIds != null) {
            for (String permissionId : permissionIds) {
                if (permissionId != null && !permissionId.isBlank()) {
                    nextPermissionIds.add(permissionId);
                }
            }
        }

        List<RolePermission> currentRelations = this.theRolePermissionRepository.findAllByRole(role);
        Set<String> currentPermissionIds = new HashSet<>();
        List<RolePermission> relationsToRemove = new ArrayList<>();
        for (RolePermission relation : currentRelations) {
            if (relation == null || relation.getPermission() == null || relation.getPermission().getId() == null) {
                continue;
            }

            String currentPermissionId = relation.getPermission().getId();
            currentPermissionIds.add(currentPermissionId);
            if (!nextPermissionIds.contains(currentPermissionId)) {
                relationsToRemove.add(relation);
            }
        }

        Set<String> permissionIdsToAdd = new HashSet<>(nextPermissionIds);
        permissionIdsToAdd.removeAll(currentPermissionIds);

        List<RolePermission> relationsToAdd = new ArrayList<>();
        if (!permissionIdsToAdd.isEmpty()) {
            for (Permission permission : this.thePermissionRepository.findAllById(permissionIdsToAdd)) {
                if (permission == null || permission.getId() == null || permission.getId().isBlank()) {
                    continue;
                }
                relationsToAdd.add(new RolePermission(role, permission));
            }
        }

        if (!relationsToRemove.isEmpty()) {
            this.theRolePermissionRepository.deleteAll(relationsToRemove);
        }

        if (!relationsToAdd.isEmpty()) {
            this.theRolePermissionRepository.saveAll(relationsToAdd);
        }

        if (!relationsToAdd.isEmpty() || !relationsToRemove.isEmpty()) {
            notifyUsersByRolePermissionSync(role, relationsToAdd.size(), relationsToRemove.size());
        }

        return true;
    }

    private void notifyUsersByRolePermissionSync(Role role, int addedCount, int removedCount) {
        if (role == null || role.getId() == null || (addedCount <= 0 && removedCount <= 0)) {
            return;
        }

        List<UserRole> usersWithRole = this.theUserRoleRepository.findAllByRole(role);
        Set<String> notifiedUsers = new HashSet<>();
        for (UserRole userRole : usersWithRole) {
            User user = userRole.getUser();
            if (user == null || user.getId() == null || !notifiedUsers.add(user.getId())) {
                continue;
            }

            this.theEmailService.sendRolePermissionsBulkUpdatedEmail(user, role, addedCount, removedCount);
        }
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
