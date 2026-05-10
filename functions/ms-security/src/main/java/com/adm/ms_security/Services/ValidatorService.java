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

    // Cache TTL por defecto (5 minutos)
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(5);

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

    // Cache para evitar consultas repetidas de count()
    private volatile long lastPermissionCountCheck = 0;
    private static final long PERMISSION_COUNT_CACHE_TTL_MS = TimeUnit.SECONDS.toMillis(30);
    private volatile Boolean cachedHasPermissions = null;

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
    public boolean validationRolePermission(HttpServletRequest request,
            String url,
            String method) {
        User theUser = this.getUser(request);
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
        // Usamos cache de conteo para no consultar MongoDB en cada request.
        if (isBootstrapMode()) {
            return true;
        }

        String normalizedMethod = normalizeMethod(method);
        String normalizedUrl = normalizeRequestUrl(url);
        String cacheKey = theUser.getId() + ":" + normalizedMethod + ":" + normalizedUrl;

        // Consultar cache primero
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

        // Almacenar en cache
        permissionCache.put(cacheKey, new CacheEntry<>(success, CACHE_TTL_MS));

        return success;
    }

    // Verifica si el sistema esta en modo bootstrap (sin permisos cargados)
    private boolean isBootstrapMode() {
        long now = System.currentTimeMillis();
        if (now - lastPermissionCountCheck > PERMISSION_COUNT_CACHE_TTL_MS) {
            long permCount = this.thePermissionRepository.count();
            long rpCount = this.theRolePermissionRepository.count();
            cachedHasPermissions = permCount > 0 && rpCount > 0;
            lastPermissionCountCheck = now;
        }
        return cachedHasPermissions != null && !cachedHasPermissions;
    }

    // Ejecuta la validacion completa sin cache
    private boolean performFullValidation(User theUser, String normalizedMethod, String normalizedUrl) {
        List<UserRole> roles = this.theUserRoleRepository.findAllByUser(theUser);

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
            return false;
        }

        boolean success = false;
        int i = 0;
        while (i < roles.size() && !success) {
            UserRole actual = roles.get(i);
            Role theRole = actual.getRole();
            if (theRole != null) {
                RolePermission theRolePermission = this.theRolePermissionRepository
                        .findByRoleAndPermission(theRole, thePermission);
                if (theRolePermission != null) {
                    success = true;
                }
            }
            i += 1;
        }

        if (!success) {
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
