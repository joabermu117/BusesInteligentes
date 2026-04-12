package com.adm.ms_security.Configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "security.otp")
public class OtpProperties {
    private long ttlSeconds = 300;
    private int maxAttempts = 3;
    private long resendCooldownSeconds = 30;
}
