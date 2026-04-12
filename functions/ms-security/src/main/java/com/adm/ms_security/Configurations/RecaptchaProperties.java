package com.adm.ms_security.Configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "security.recaptcha")
public class RecaptchaProperties {
    private boolean enabled = true;
    private String secretKey;
    private String verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    private double scoreThreshold = 0.5;
}
