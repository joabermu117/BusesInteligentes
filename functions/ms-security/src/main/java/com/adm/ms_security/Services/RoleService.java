package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
/**
 * CRUD de roles funcionales del sistema.
 * Incluye validaciones de integridad para evitar eliminar roles en uso.
 */
public class RoleService {

    @Autowired
    private RoleRepository theRoleRepository;

    @Autowired
    private UserRoleRepository theUserRoleRepository;

    public List<Role> find() {
        return this.theRoleRepository.findAll();
    }

    public Role findById(String id) {
        return this.theRoleRepository.findById(id).orElse(null);
    }

    public Role create(Role newRole) {
        return this.theRoleRepository.save(newRole);
    }

    public Role update(String id, Role newRole) {
        Role actualRole = this.theRoleRepository.findById(id).orElse(null);

        if (actualRole != null) {
            actualRole.setName(newRole.getName());
            actualRole.setDescription(newRole.getDescription());
            this.theRoleRepository.save(actualRole);
            return actualRole;
        } else {
            return null;
        }
    }

    // Evita eliminar un rol si existen usuarios asociados via UserRole.
    public void delete(String id) {
        Role theRole = this.theRoleRepository.findById(id).orElse(null);
        if (theRole == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found");
        }

        boolean hasUsersWithRole = this.theUserRoleRepository.existsByRoleId(id);
        if (hasUsersWithRole) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el rol porque hay usuarios asociados");
        }

        this.theRoleRepository.delete(theRole);
    }
}
