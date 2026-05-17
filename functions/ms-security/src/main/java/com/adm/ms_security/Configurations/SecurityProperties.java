package com.adm.ms_security.Configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "security.tfa")
public class SecurityProperties {
    private boolean enabled = true;
}
