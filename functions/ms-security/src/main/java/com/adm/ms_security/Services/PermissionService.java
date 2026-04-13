package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
/**
 * CRUD de permisos del sistema (URL + metodo HTTP + modulo/modelo).
 * Lo usan controladores administrativos para mantener catalogo de permisos.
 */
public class PermissionService {

    @Autowired
    private PermissionRepository thePermissionRepository;

    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    public List<Permission> find() {
        return this.thePermissionRepository.findAll();
    }

    public Permission findById(String id) {
        Permission thePermission = this.thePermissionRepository.findById(id).orElse(null);
        return thePermission;
    }

    // Crea permiso evitando duplicados por combinacion URL/METODO.
    public Permission create(Permission newPermission) {
        if (newPermission == null) {
            return null;
        }

        String normalizedUrl = normalizeUrl(newPermission.getUrl());
        String normalizedMethod = normalizeMethod(newPermission.getMethod());

        Permission existingPermission = this.thePermissionRepository.getPermission(normalizedUrl, normalizedMethod);
        if (existingPermission != null) {
            if (newPermission.getModel() != null && !newPermission.getModel().isBlank()) {
                existingPermission.setModel(newPermission.getModel().trim());
                return this.thePermissionRepository.save(existingPermission);
            }
            return existingPermission;
        }

        newPermission.setUrl(normalizedUrl);
        newPermission.setMethod(normalizedMethod);
        if (newPermission.getModel() != null) {
            newPermission.setModel(newPermission.getModel().trim());
        }
        return this.thePermissionRepository.save(newPermission);
    }

    public Permission update(String id, Permission newPermission) {
        Permission actualPermission = this.thePermissionRepository.findById(id).orElse(null);
        if (actualPermission != null) {
            actualPermission.setUrl(newPermission.getUrl());
            actualPermission.setMethod(newPermission.getMethod());
            actualPermission.setModel(newPermission.getModel());
            this.thePermissionRepository.save(actualPermission);
            return actualPermission;
        } else {
            return null;
        }
    }

    // Impide borrar permisos que ya esten asociados a roles.
    public void delete(String id) {
        Permission thePermission = this.thePermissionRepository.findById(id).orElse(null);
        if (thePermission == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission not found");
        }

        boolean hasRolesWithPermission = this.theRolePermissionRepository.existsByPermissionId(id);
        if (hasRolesWithPermission) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el permiso porque hay roles asociados");
        }

        this.thePermissionRepository.delete(thePermission);
    }

    private String normalizeUrl(String url) {
        return url == null ? "" : url.trim();
    }

    private String normalizeMethod(String method) {
        return method == null ? "" : method.trim().toUpperCase(Locale.ROOT);
    }

}
