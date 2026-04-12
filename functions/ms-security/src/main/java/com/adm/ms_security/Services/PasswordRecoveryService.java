package com.adm.ms_security.Services;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Configurations.PasswordRecoveryProperties;
import com.adm.ms_security.Dtos.GenericMessageResponseDto;
import com.adm.ms_security.Dtos.PasswordRecoveryConfirmRequestDto;
import com.adm.ms_security.Dtos.RecoveryRequestDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.PasswordRecoveryToken;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Repositories.PasswordRecoveryTokenRepository;

@Service
/**
 * Handles password recovery flow:
 * 1) request with anti-bot and rate-limit,
 * 2) token generation and mail delivery,
 * 3) token validation and password update.
 */
public class PasswordRecoveryService {
    private final PasswordRecoveryProperties properties;
    private final AntiBotService antiBotService;
    private final RateLimitService rateLimitService;
    private final SecurityService securityService;
    private final NotificationEmailService notificationEmailService;
    private final PasswordRecoveryTokenRepository passwordRecoveryTokenRepository;
    private final EncryptionService encryptionService;

    public PasswordRecoveryService(
            PasswordRecoveryProperties properties,
            AntiBotService antiBotService,
            RateLimitService rateLimitService,
            SecurityService securityService,
            NotificationEmailService notificationEmailService,
            PasswordRecoveryTokenRepository passwordRecoveryTokenRepository,
            EncryptionService encryptionService) {
        this.properties = properties;
        this.antiBotService = antiBotService;
        this.rateLimitService = rateLimitService;
        this.securityService = securityService;
        this.notificationEmailService = notificationEmailService;
        this.passwordRecoveryTokenRepository = passwordRecoveryTokenRepository;
        this.encryptionService = encryptionService;
    }

    /**
     * Creates and sends recovery token when email exists.
     * Response remains generic to avoid account enumeration.
     */
    public GenericMessageResponseDto requestRecovery(RecoveryRequestDto request) {
        antiBotService.validate(request.getRecaptchaToken(), "password_recovery");
        applyRateLimit(request.getEmail());

        User user = securityService.findByEmailForLogin(request.getEmail());
        if (user != null) {
            sendCustomResetLink(user);
        }

        return new GenericMessageResponseDto(properties.getGenericMessage());
    }

    /**
     * Confirms recovery token and updates user password.
     * Token is single-use and expires by configured TTL.
     */
    public GenericMessageResponseDto confirmRecovery(PasswordRecoveryConfirmRequestDto request) {
        String tokenHash = encryptionService.convertSHA256(request.getToken());
        if (tokenHash == null || tokenHash.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "RECOVERY_INVALID_TOKEN",
                    "El token de recuperacion es invalido");
        }

        Optional<PasswordRecoveryToken> storedTokenOptional = passwordRecoveryTokenRepository
                .findByTokenHashAndUsedFalse(tokenHash);

        PasswordRecoveryToken storedToken = storedTokenOptional.orElseThrow(() -> new ApiException(
                HttpStatus.BAD_REQUEST,
                "RECOVERY_INVALID_TOKEN",
                "El enlace de recuperacion no es valido o ya fue utilizado"));

        if (storedToken.getExpiresAt() == null || Instant.now().isAfter(storedToken.getExpiresAt())) {
            markTokenAsUsed(storedToken);
            throw new ApiException(HttpStatus.BAD_REQUEST, "RECOVERY_EXPIRED_TOKEN",
                    "El enlace de recuperacion ha expirado");
        }

        User user = securityService.findById(storedToken.getUserId());
        if (user == null) {
            markTokenAsUsed(storedToken);
            throw new ApiException(HttpStatus.BAD_REQUEST, "RECOVERY_INVALID_TOKEN",
                    "El enlace de recuperacion no es valido");
        }

        User updatedUser = securityService.updatePassword(user, request.getNewPassword());
        if (updatedUser == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "RECOVERY_PASSWORD_UPDATE_ERROR",
                    "No fue posible actualizar la contraseña");
        }

        invalidatePreviousTokens(user.getId());
        return new GenericMessageResponseDto("La contraseña fue actualizada correctamente");
    }

    // Per-email throttle to prevent abuse on recovery endpoint.
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

    // Rotates previous tokens and generates fresh secure token.
    private void sendCustomResetLink(User user) {
        invalidatePreviousTokens(user.getId());
        String rawToken = generateRawToken();

        PasswordRecoveryToken token = new PasswordRecoveryToken();
        token.setUserId(user.getId());
        token.setEmail(user.getEmail());
        token.setTokenHash(encryptionService.convertSHA256(rawToken));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusSeconds(properties.getTokenTtlSeconds()));
        token.setUsed(false);

        passwordRecoveryTokenRepository.save(token);
        notificationEmailService.sendPasswordRecoveryLink(user.getEmail(), buildResetLink(rawToken));
    }

    // Builds frontend URL that consumes the token, preserving existing query params.
    private String buildResetLink(String token) {
        if (properties.getResetUrl() == null || properties.getResetUrl().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "RECOVERY_CONFIG_ERROR",
                    "La URL de recuperacion no esta configurada");
        }

        String separator = properties.getResetUrl().contains("?") ? "&" : "?";
        return properties.getResetUrl() + separator
                + "token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private void invalidatePreviousTokens(String userId) {
        passwordRecoveryTokenRepository.findAllByUserIdAndUsedFalse(userId)
                .forEach(this::markTokenAsUsed);
    }

    private void markTokenAsUsed(PasswordRecoveryToken token) {
        token.setUsed(true);
        token.setUsedAt(Instant.now());
        passwordRecoveryTokenRepository.save(token);
    }

    private String generateRawToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizeEmail(String email) {
        return email == null ? "unknown" : email.trim().toLowerCase(Locale.ROOT);
    }
}
