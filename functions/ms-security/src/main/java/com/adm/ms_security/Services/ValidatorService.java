package com.adm.ms_security.Services;

import com.adm.ms_security.Models.*;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ValidatorService {
    @Autowired
    private JwtService jwtService;

    @Autowired
    private PermissionRepository thePermissionRepository;
    @Autowired
    private UserRepository theUserRepository;
    @Autowired
    private RolePermissionRepository theRolePermissionRepository;

    @Autowired
    private UserRoleRepository theUserRoleRepository;

    private static final String BEARER_PREFIX = "Bearer ";

    public boolean validationRolePermission(HttpServletRequest request,
            String url,
            String method) {
        User theUser = this.getUser(request);
        if (theUser == null) {
            return false;
        }

        // Bootstrap mode: while ACL tables are empty, let authenticated users in.
        if (this.thePermissionRepository.count() == 0 || this.theRolePermissionRepository.count() == 0) {
            return true;
        }

        boolean success = false;
        List<UserRole> roles = this.theUserRoleRepository.getRolesByUser(theUser.getId());

        // Buscar al permiso solicitado
        url = url.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");
        Permission thePermission = this.thePermissionRepository.getPermission(url, method);

        int i = 0;
        while (i < roles.size() && success == false) {
            UserRole actual = roles.get(i);
            Role theRole = actual.getRole();
            if (theRole != null && thePermission != null) {
                RolePermission theRolePermission = this.theRolePermissionRepository
                        .getRolePermission(theRole.getId(), thePermission.getId());
                if (theRolePermission != null) {
                    success = true;
                }
            } else {
                success = false;
            }
            i += 1;
        }

        return success;
    }

    /***
     * Analiza el token y decifra los datos para re armar el usuario
     * 
     * @param request que contiene el token
     * @return el usuario de base de datos que tiene el id presente en el token
     */
    public User getUser(final HttpServletRequest request) {
        User theUser = null;
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith(BEARER_PREFIX)) {
            String token = authorizationHeader.substring(BEARER_PREFIX.length());
            User theUserFromToken = jwtService.getUserFromToken(token);
            if (theUserFromToken != null) {
                theUser = this.theUserRepository.findById(theUserFromToken.getId())
                        .orElse(null);

            }
        }
        return theUser;
    }
}
