package com.adm.ms_security.Services;

import com.adm.ms_security.Models.*;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Locale;

@Service
/**
 * Motor de autorizacion (ACL): valida si un usuario autenticado
 * tiene permiso para ejecutar una URL/metodo segun sus roles.
 */
public class ValidatorService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ValidatorService.class);

    @Value("${security.authorization.enabled:false}")
    private boolean authorizationEnabled;

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

    // Flujo principal ACL: usuario -> roles -> role_permission -> permiso
    // solicitado.
    public boolean validationRolePermission(HttpServletRequest request,
            String url,
            String method) {
        User theUser = this.getUser(request);
        if (theUser == null) {
            LOGGER.warn("ACL deny: no authenticated user. method={}, url={}", method, url);
            return false;
        }

        if (!authorizationEnabled) {
            LOGGER.warn("ACL bypass enabled. userId={}, email={}, method={}, url={}",
                    theUser.getId(), maskEmail(theUser.getEmail()), method, url);
            return true;
        }

        // Bootstrap mode: while ACL tables are empty, let authenticated users in.
        if (this.thePermissionRepository.count() == 0 || this.theRolePermissionRepository.count() == 0) {
            return true;
        }

        boolean success = false;
        List<UserRole> roles = this.theUserRoleRepository.findAllByUser(theUser);

        String normalizedMethod = normalizeMethod(method);
        String normalizedUrl = normalizeRequestUrl(url);

        // Buscar al permiso solicitado con y sin slash final para evitar falsos
        // negativos por formato de URL.
        Permission thePermission = this.thePermissionRepository.getPermission(normalizedUrl, normalizedMethod);
        if (thePermission == null) {
            String alternateUrl = normalizedUrl.endsWith("/")
                    ? normalizedUrl.substring(0, normalizedUrl.length() - 1)
                    : normalizedUrl + "/";
            thePermission = this.thePermissionRepository.getPermission(alternateUrl, normalizedMethod);
        }

        if (thePermission == null) {
            LOGGER.warn(
                    "ACL deny: permission not found for userId={}, email={}, method={}, normalizedUrl={}, rolesCount={}",
                    theUser.getId(),
                    maskEmail(theUser.getEmail()),
                    normalizedMethod,
                    normalizedUrl,
                    roles.size());
        }

        int i = 0;
        while (i < roles.size() && success == false) {
            UserRole actual = roles.get(i);
            Role theRole = actual.getRole();
            if (theRole != null && thePermission != null) {
                RolePermission theRolePermission = this.theRolePermissionRepository
                        .findByRoleAndPermission(theRole, thePermission);
                if (theRolePermission != null) {
                    success = true;
                }
            } else {
                success = false;
            }
            i += 1;
        }

        if (!success && thePermission != null) {
            LOGGER.warn(
                    "ACL deny: missing role-permission mapping. userId={}, email={}, permissionId={}, method={}, normalizedUrl={}, roleIds={}",
                    theUser.getId(),
                    maskEmail(theUser.getEmail()),
                    thePermission.getId(),
                    normalizedMethod,
                    normalizedUrl,
                    roles.stream()
                            .map(UserRole::getRole)
                            .filter(role -> role != null)
                            .map(Role::getId)
                            .toList());
        }

        if (success) {
            LOGGER.debug("ACL allow: userId={}, method={}, normalizedUrl={}", theUser.getId(), normalizedMethod,
                    normalizedUrl);
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

    private String normalizeMethod(String method) {
        return method == null ? "" : method.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRequestUrl(String url) {
        if (url == null) {
            return "";
        }

        String normalizedUrl = url.trim();
        int queryStartIndex = normalizedUrl.indexOf('?');
        if (queryStartIndex >= 0) {
            normalizedUrl = normalizedUrl.substring(0, queryStartIndex);
        }

        normalizedUrl = normalizedUrl.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");

        if (normalizedUrl.length() > 1 && normalizedUrl.endsWith("/")) {
            normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 1);
        }

        return normalizedUrl;
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            return "***";
        }

        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String visible = local.length() <= 2 ? local.substring(0, 1) : local.substring(0, 2);
        return visible + "***@" + domain;
    }
}
