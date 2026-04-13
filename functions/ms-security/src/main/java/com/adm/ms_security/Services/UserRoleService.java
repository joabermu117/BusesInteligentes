package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
/**
 * Gestiona relacion N:N entre usuarios y roles.
 * Tambien envia notificaciones cuando cambia el rol asignado al usuario.
 */
public class UserRoleService {
    @Autowired
    private UserRepository theUserRepository;

    @Autowired
    private RoleRepository theRoleRepository;

    @Autowired
    private UserRoleRepository theUserRoleRepository;

    @Autowired
    private EmailService theEmailService;

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
            return true;
        } else {
            return false;
        }
    }

    public List<UserRole> getRolesByUser(String userId) {
        return this.theUserRoleRepository.getRolesByUser(userId);
    }

}
