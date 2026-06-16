package com.adm.ms_security.Services;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;

@Service
/**
 * Gestiona relacion N:N entre usuarios y roles.
 * Tambien envia notificaciones cuando cambia el rol asignado al usuario
 * y sincroniza con el microservicio de negocio via RoleSyncService.
 */
public class UserRoleService {
    private final UserRepository theUserRepository;
    private final RoleRepository theRoleRepository;
    private final UserRoleRepository theUserRoleRepository;
    private final EmailService theEmailService;
    private final RoleSyncService roleSyncService;

    public UserRoleService(UserRepository theUserRepository,
            RoleRepository theRoleRepository,
            UserRoleRepository theUserRoleRepository,
            EmailService theEmailService,
            RoleSyncService roleSyncService) {
        this.theUserRepository = theUserRepository;
        this.theRoleRepository = theRoleRepository;
        this.theUserRoleRepository = theUserRoleRepository;
        this.theEmailService = theEmailService;
        this.roleSyncService = roleSyncService;
    }

    // Asigna rol al usuario evitando reasignaciones duplicadas.
    public boolean addUserRole(String userId,
            String roleId) {
        User user = this.theUserRepository.findById(userId).orElse(null);
        Role role = this.theRoleRepository.findById(roleId).orElse(null);
        if (user != null && role != null) {
            boolean alreadyAssigned = this.theUserRoleRepository.findAllByUser(user).stream()
                    .anyMatch(ur -> ur.getRole() != null
                            && ur.getRole().getId() != null
                            && ur.getRole().getId().equals(role.getId()));
            if (alreadyAssigned) {
                return true;
            }

            UserRole theUserRole = new UserRole(user, role);
            this.theUserRoleRepository.save(theUserRole);
            this.theEmailService.sendRoleUpdatedEmail(user, role, "asignado");
            this.roleSyncService.notifyRoleAssigned(user, role);
            return true;
        } else {
            return false;
        }
    }

    // Remueve asignacion de rol y notifica al usuario afectado.
    public boolean removeUserRole(String userRoleId) {
        UserRole userRole = this.theUserRoleRepository.findById(userRoleId).orElse(null);
        if (userRole != null) {
            User user = userRole.getUser();
            Role role = userRole.getRole();
            this.theUserRoleRepository.delete(userRole);
            this.theEmailService.sendRoleUpdatedEmail(user, role, "removido");
            this.roleSyncService.notifyRoleRemoved(user, role);
            return true;
        } else {
            return false;
        }
    }

    public List<UserRole> getRolesByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return new ArrayList<>();
        }

        User user = this.theUserRepository.findById(userId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }

        List<UserRole> relations = this.theUserRoleRepository.findAllByUser(user);
        if (!relations.isEmpty()) {
            return relations;
        }

        // Fallback para compatibilidad con consultas legacy por ObjectId.
        return this.theUserRoleRepository.getRolesByUser(userId);
    }

    public List<String> getRoleIdsByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return new ArrayList<>();
        }

        Set<String> roleIds = new HashSet<>();
        for (UserRole relation : getRolesByUser(userId)) {
            if (relation == null || relation.getRole() == null || relation.getRole().getId() == null) {
                continue;
            }
            roleIds.add(relation.getRole().getId());
        }

        return new ArrayList<>(roleIds);
    }

    public List<String> getRoleNamesByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return new ArrayList<>();
        }

        List<String> roleNames = new ArrayList<>();
        for (UserRole relation : getRolesByUser(userId)) {
            if (relation == null || relation.getRole() == null || relation.getRole().getName() == null) {
                continue;
            }
            roleNames.add(relation.getRole().getName());
        }

        return roleNames;
    }

    public boolean syncRolesForUser(String userId, List<String> roleIds) {
        User user = this.theUserRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        Set<String> nextRoleIds = new HashSet<>();
        if (roleIds != null) {
            for (String roleId : roleIds) {
                if (roleId != null && !roleId.isBlank()) {
                    nextRoleIds.add(roleId);
                }
            }
        }

        List<UserRole> currentRelations = this.theUserRoleRepository.findAllByUser(user);
        Set<String> currentRoleIds = new HashSet<>();
        for (UserRole relation : currentRelations) {
            if (relation == null || relation.getRole() == null || relation.getRole().getId() == null) {
                continue;
            }

            String currentRoleId = relation.getRole().getId();
            currentRoleIds.add(currentRoleId);
            if (!nextRoleIds.contains(currentRoleId) && relation.getId() != null) {
                removeUserRole(relation.getId());
            }
        }

        for (String roleId : nextRoleIds) {
            if (!currentRoleIds.contains(roleId)) {
                addUserRole(userId, roleId);
            }
        }

        return true;
    }

    public List<java.util.Map<String, String>> getUserEmailsByRoleName(String roleName) {
        Role role = theRoleRepository.findAll().stream()
            .filter(r -> r.getName() != null && r.getName().equalsIgnoreCase(roleName))
            .findFirst()
            .orElse(null);

        if (role == null) return new ArrayList<>();

        List<java.util.Map<String, String>> result = new ArrayList<>();
        for (UserRole ur : theUserRoleRepository.findAllByRole(role)) {
            if (ur.getUser() != null && ur.getUser().getEmail() != null) {
                java.util.Map<String, String> info = new java.util.HashMap<>();
                info.put("email", ur.getUser().getEmail());
                info.put("name", ur.getUser().getName() != null ? ur.getUser().getName() : "Usuario");
                result.add(info);
            }
        }
        return result;
    }

}
