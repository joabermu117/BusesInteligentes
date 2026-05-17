package com.adm.ms_security.Configurations;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Configura Caffeine como proveedor de cache para el sistema ACL.
 * 
 * Los permisos y role-permissions cambian con poca frecuencia,
 * por lo que un TTL de 5 minutos reduce drasticamente las consultas
 * a MongoDB sin riesgo de datos desactualizados.
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("permissions", "rolePermissions");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(1000)
                .recordStats());
        cacheManager.setAsyncCacheMode(false);
        return cacheManager;
    }
}
