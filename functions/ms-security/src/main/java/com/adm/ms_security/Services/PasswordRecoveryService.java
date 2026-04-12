package com.adm.ms_security.Services;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Configurations.PasswordRecoveryProperties;
import com.adm.ms_security.Dtos.GenericMessageResponseDto;
import com.adm.ms_security.Dtos.RecoveryRequestDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.User;
import com.google.firebase.auth.ActionCodeSettings;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;

@Service
public class PasswordRecoveryService {
    private final PasswordRecoveryProperties properties;
    private final AntiBotService antiBotService;
    private final RateLimitService rateLimitService;
    private final SecurityService securityService;
    private final NotificationEmailService notificationEmailService;

    public PasswordRecoveryService(
            PasswordRecoveryProperties properties,
            AntiBotService antiBotService,
            RateLimitService rateLimitService,
            SecurityService securityService,
            NotificationEmailService notificationEmailService) {
        this.properties = properties;
        this.antiBotService = antiBotService;
        this.rateLimitService = rateLimitService;
        this.securityService = securityService;
        this.notificationEmailService = notificationEmailService;
    }

    public GenericMessageResponseDto requestRecovery(RecoveryRequestDto request) {
        antiBotService.validate(request.getRecaptchaToken(), "password_recovery");
        applyRateLimit(request.getEmail());

        User user = securityService.findByEmailForLogin(request.getEmail());
        if (user != null) {
            sendFirebaseResetLink(user.getEmail());
        }

        return new GenericMessageResponseDto(properties.getGenericMessage());
    }

    private void applyRateLimit(String email) {
        String key = "password-recovery:" + normalizeEmail(email);
        boolean allowed = rateLimitService.isAllowed(
                key,
                properties.getRateLimitMaxRequests(),
                properties.getRateLimitWindowSeconds());

        if (!allowed) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RECOVERY_RATE_LIMIT",
                    "Se alcanzaron demasiados intentos de recuperacion");
        }
    }

    private void sendFirebaseResetLink(String email) {
        try {
            String resetLink = FirebaseAuth.getInstance().generatePasswordResetLink(email, buildActionCodeSettings());
            notificationEmailService.sendPasswordRecoveryLink(email, resetLink);
        } catch (FirebaseAuthException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "RECOVERY_LINK_ERROR",
                    "No fue posible procesar la recuperacion de contraseña");
        }
    }

    private ActionCodeSettings buildActionCodeSettings() {
        if (properties.getResetUrl() == null || properties.getResetUrl().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "RECOVERY_CONFIG_ERROR",
                    "La URL de recuperacion no esta configurada");
        }

        return ActionCodeSettings.builder()
                .setUrl(properties.getResetUrl())
                .setHandleCodeInApp(true)
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? "unknown" : email.trim().toLowerCase(Locale.ROOT);
    }
}
