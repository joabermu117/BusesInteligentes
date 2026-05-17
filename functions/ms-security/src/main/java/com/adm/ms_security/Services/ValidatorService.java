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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
/**
 * Motor de autorizacion (ACL): valida si un usuario autenticado
 * tiene permiso para ejecutar una URL/metodo segun sus roles.
 * 
 * Incluye cache en memoria para reducir consultas a MongoDB
 * en endpoints de alto trafico. El cache expira automaticamente
 * tras el TTL configurado.
 */
public class ValidatorService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ValidatorService.class);

    // Cache TTL: 15 minutos - los permisos cambian poco, no tiene sentido
    // invalidar tan seguido. Si se requiere refresco manual se puede reiniciar.
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(15);

    @Value("${security.authorization.enabled:false}")
    private boolean authorizationEnabled;

    private final JwtService jwtService;
    private final PermissionRepository thePermissionRepository;
    private final UserRepository theUserRepository;
    private final RolePermissionRepository theRolePermissionRepository;
    private final UserRoleRepository theUserRoleRepository;

    // Cache simple en memoria: clave = "userId:normalizedMethod:normalizedUrl",
    // valor = Boolean
    private final ConcurrentHashMap<String, CacheEntry<Boolean>> permissionCache = new ConcurrentHashMap<>();

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
    // Usa cache en memoria para evitar consultas repetidas a MongoDB.
    // AHORA RECIBE EL USUARIO YA RESUELTO, EVITANDO LA DOBLE CONSULTA getUser().
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
        String cacheKey = theUser.getId() + ":" + normalizedMethod + ":" + normalizedUrl;

        // Consultar cache primero (TTL 15 min)
        CacheEntry<Boolean> cached = permissionCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            Boolean result = cached.getValue();
            if (result) {
                LOGGER.debug("ACL cache HIT allow: userId={}, method={}, url={}",
                        theUser.getId(), normalizedMethod, normalizedUrl);
            }
            return result;
        }

        // Cache miss: realizar la validacion completa
        boolean success = performFullValidation(theUser, normalizedMethod, normalizedUrl);

        // Almacenar en cache (TANTO true COMO false para evitar consultas repetidas)
        permissionCache.put(cacheKey, new CacheEntry<>(success, CACHE_TTL_MS));

        return success;
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

    // Ejecuta la validacion completa sin cache.
    // Usa el metodo findByRoleAndPermission (N consultas) pero se mitiga con cache.
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

        // 3) Recorrer roles (N consultas, pero se cachea por 5 min + rolesCount bajo)
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

    // --- Cache helper ---

    /**
     * Simple cache entry with TTL expiration.
     */
    private static class CacheEntry<T> {
        private final T value;
        private final long expiresAt;

        CacheEntry(T value, long ttlMs) {
            this.value = value;
            this.expiresAt = System.currentTimeMillis() + ttlMs;
        }

        T getValue() {
            return value;
        }

        boolean isExpired() {
            return System.currentTimeMillis() >= expiresAt;
        }
    }
}
