package com.adm.ms_security.Services;

import com.adm.ms_security.Models.*;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import jakarta.servlet.http.HttpServletRequest;
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

    private final JwtService jwtService;
    private final PermissionRepository thePermissionRepository;
    private final UserRepository theUserRepository;
    private final RolePermissionRepository theRolePermissionRepository;
    private final UserRoleRepository theUserRoleRepository;

    // Bootstrap: se verifica UNA SOLA VEZ y nunca mas
    private volatile boolean bootstrapModeActive = true;

    public ValidatorService(JwtService jwtService,
            PermissionRepository thePermissionRepository,
            UserRepository theUserRepository,
            RolePermissionRepository theRolePermissionRepository,
            UserRoleRepository theUserRoleRepository) {
        this.jwtService = jwtService;
        this.thePermissionRepository = thePermissionRepository;
        this.theUserRepository = theUserRepository;
        this.theRolePermissionRepository = theRolePermissionRepository;
        this.theUserRoleRepository = theUserRoleRepository;
    }

    private static final String BEARER_PREFIX = "Bearer ";

    // Flujo principal ACL: usuario -> roles -> role_permission -> permiso
    // solicitado.
    // RECIBE EL USUARIO YA RESUELTO, EVITANDO LA DOBLE CONSULTA getUser().
    public boolean validationRolePermission(User theUser, String url, String method) {
        // El usuario ya fue resuelto por el interceptor o quien llame
        if (theUser == null) {
            LOGGER.warn("ACL deny: no authenticated user. method={}, url={}", method, url);
            return false;
        }

        if (!authorizationEnabled) {
            LOGGER.debug("ACL bypass enabled. userId={}, email={}, method={}, url={}",
                    theUser.getId(), maskEmail(theUser.getEmail()), method, url);
            return true;
        }

        // Bootstrap mode: while ACL tables are empty, let authenticated users in.
        if (isBootstrapMode()) {
            return true;
        }

        String normalizedMethod = normalizeMethod(method);
        String normalizedUrl = normalizeRequestUrl(url);

        // Realizar la validacion completa contra BD
        return performFullValidation(theUser, normalizedMethod, normalizedUrl);
    }

    // Versión legacy que acepta HttpServletRequest (para compatibilidad).
    // Extrae el usuario del JWT y delega al método principal.
    // Úsalo solo cuando no tengas el User pre-resuelto.
    @Deprecated
    public boolean validationRolePermission(HttpServletRequest request,
            String url,
            String method) {
        User theUser = this.getUser(request);
        return validationRolePermission(theUser, url, method);
    }

    // Verifica UNA SOLA VEZ si hay permisos en BD.
    // Si los hay, desactiva bootstrap mode permanentemente.
    // Si no, se mantiene en bootstrap hasta que se recargue el servicio.
    private boolean isBootstrapMode() {
        if (!bootstrapModeActive) {
            return false;
        }

        boolean hasPerms = this.thePermissionRepository.count() > 0
                && this.theRolePermissionRepository.count() > 0;
        if (hasPerms) {
            bootstrapModeActive = false;
            return false;
        }

        return true;
    }

    // Ejecuta la validacion completa contra BD.
    private boolean performFullValidation(User theUser, String normalizedMethod, String normalizedUrl) {
        // 1) Buscar el permiso solicitado (con y sin slash final)
        Permission thePermission = this.thePermissionRepository.getPermission(normalizedUrl, normalizedMethod);
        if (thePermission == null) {
            String alternateUrl = normalizedUrl.endsWith("/")
                    ? normalizedUrl.substring(0, normalizedUrl.length() - 1)
                    : normalizedUrl + "/";
            thePermission = this.thePermissionRepository.getPermission(alternateUrl, normalizedMethod);
        }

        if (thePermission == null) {
            LOGGER.warn(
                    "ACL deny: permission not found for userId={}, email={}, method={}, normalizedUrl={}",
                    theUser.getId(),
                    maskEmail(theUser.getEmail()),
                    normalizedMethod,
                    normalizedUrl);
            return false;
        }

        // 2) Obtener roles del usuario (solo una consulta, getRolesByUser es por
        // ObjectId)
        List<UserRole> roles = this.theUserRoleRepository.getRolesByUser(theUser.getId());
        if (roles.isEmpty()) {
            LOGGER.warn("ACL deny: user has no roles. userId={}", theUser.getId());
            return false;
        }

        // 3) Recorrer roles para verificar si alguno tiene el permiso
        boolean success = false;
        for (UserRole actual : roles) {
            Role theRole = actual.getRole();
            if (theRole != null && theRole.getId() != null) {
                RolePermission rp = this.theRolePermissionRepository
                        .getRolePermission(theRole.getId(), thePermission.getId());
                if (rp != null) {
                    success = true;
                    break;
                }
            }
        }

        if (!success) {
            LOGGER.warn(
                    "ACL deny: missing role-permission mapping. userId={}, permissionId={}, method={}, normalizedUrl={}, roleIds={}",
                    theUser.getId(),
                    thePermission.getId(),
                    normalizedMethod,
                    normalizedUrl,
                    roles.stream()
                            .map(UserRole::getRole)
                            .filter(r -> r != null)
                            .map(Role::getId)
                            .toList());
        } else {
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

        // Replace numeric IDs and MongoDB ObjectIds with "?"
        normalizedUrl = normalizedUrl.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");

        // Replace any text segment after known parameter patterns with "?"
        // This handles cases like /forecast/Manizales, /preferences/user123, /check/user123
        normalizedUrl = normalizedUrl.replaceAll(
            "/(forecast|preferences|check|subscriptions|unsubscribe|eta|gps-update|active-buses|start|stop|status)/([^?/]+)",
            "/$1/?"
        );

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
