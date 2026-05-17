package com.adm.ms_security.Configurations;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

/**
 * Configura índices compuestos en MongoDB para optimizar las consultas
 * más frecuentes del sistema de autorización (ACL).
 *
 * Los índices se crean en segundo plano (background) para no bloquear
 * la base de datos durante la creación.
 */
@Configuration
public class MongoIndexConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(MongoIndexConfig.class);

    private final MongoTemplate mongoTemplate;

    public MongoIndexConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        ensurePermissionUrlMethodIndex();
        ensureRolePermissionRolePermissionIndex();
        ensureUserRoleUserIndex();
        LOGGER.info("MongoDB indexes ensured successfully");
    }

    /**
     * Permite buscar permisos por url+method de forma eficiente.
     * Colección: permission
     * Consulta: getPermission(url, method)
     */
    private void ensurePermissionUrlMethodIndex() {
        mongoTemplate.indexOps("permission")
                .ensureIndex(new Index()
                        .on("url", Sort.Direction.ASC)
                        .on("method", Sort.Direction.ASC)
                        .named("idx_permission_url_method"));
    }

    /**
     * Permite buscar role-permission por roleId+permissionId de forma eficiente.
     * Colección: role_permission
     * Consultas: getRolePermission(roleId, permissionId), findByRoleAndPermission()
     */
    private void ensureRolePermissionRolePermissionIndex() {
        mongoTemplate.indexOps("role_permission")
                .ensureIndex(new Index()
                        .on("role.$id", Sort.Direction.ASC)
                        .on("permission.$id", Sort.Direction.ASC)
                        .named("idx_rolepermission_role_permission"));
    }

    /**
     * Permite buscar roles de un usuario por userId de forma eficiente.
     * Colección: user_role
     * Consulta: getRolesByUser(userId), findAllByUser()
     * Ya existe @Indexed en el campo user.$id por el DBRef,
     * pero aseguramos que sea exactamente el índice que necesitamos.
     */
    private void ensureUserRoleUserIndex() {
        mongoTemplate.indexOps("user_role")
                .ensureIndex(new Index()
                        .on("user.$id", Sort.Direction.ASC)
                        .named("idx_userrole_user"));
    }
}
