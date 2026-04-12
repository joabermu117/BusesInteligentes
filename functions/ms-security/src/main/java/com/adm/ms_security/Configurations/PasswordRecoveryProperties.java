package com.adm.ms_security.Configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "security.password-recovery")
public class PasswordRecoveryProperties {
    private String resetUrl;
    private String genericMessage = "Si la cuenta existe, recibiras instrucciones para recuperar tu contraseña.";
    private int rateLimitMaxRequests = 5;
    private long rateLimitWindowSeconds = 300;
}
