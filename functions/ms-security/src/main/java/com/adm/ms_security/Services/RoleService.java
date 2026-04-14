package com.adm.ms_security.Services;

import com.adm.ms_security.Dtos.RolePayloadDto;
import com.adm.ms_security.Dtos.RoleResponseDto;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
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

    @Autowired
    private RolePermissionService theRolePermissionService;

    public List<Role> find() {
        return this.theRoleRepository.findAll();
    }

    public Role findById(String id) {
        return this.theRoleRepository.findById(id).orElse(null);
    }

    public Role create(Role newRole) {
        return this.theRoleRepository.save(newRole);
    }

    public List<RoleResponseDto> findWithPermissions() {
        List<Role> roles = this.theRoleRepository.findAll();
        List<RoleResponseDto> response = new ArrayList<>();
        for (Role role : roles) {
            response.add(toResponse(role));
        }
        return response;
    }

    public RoleResponseDto findByIdWithPermissions(String id) {
        Role role = this.theRoleRepository.findById(id).orElse(null);
        if (role == null) {
            return null;
        }
        return toResponse(role);
    }

    public RoleResponseDto createWithPermissions(RolePayloadDto payload) {
        Role role = new Role();
        role.setName(payload.getName());
        role.setDescription(payload.getDescription());
        Role createdRole = this.theRoleRepository.save(role);

        if (payload.getPermissionIds() != null) {
            this.theRolePermissionService.syncPermissionsForRole(createdRole.getId(), payload.getPermissionIds());
        }

        return findByIdWithPermissions(createdRole.getId());
    }

    public RoleResponseDto updateWithPermissions(String id, RolePayloadDto payload) {
        Role role = this.theRoleRepository.findById(id).orElse(null);
        if (role == null) {
            return null;
        }

        role.setName(payload.getName());
        role.setDescription(payload.getDescription());
        this.theRoleRepository.save(role);

        if (payload.getPermissionIds() != null) {
            this.theRolePermissionService.syncPermissionsForRole(id, payload.getPermissionIds());
        }

        return findByIdWithPermissions(id);
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

    private RoleResponseDto toResponse(Role role) {
        RoleResponseDto response = new RoleResponseDto();
        response.setId(role.getId());
        response.setName(role.getName());
        response.setDescription(role.getDescription());
        response.setPermissionIds(this.theRolePermissionService.getPermissionIdsByRole(role.getId()));
        return response;
    }
}
