package com.adm.ms_security.Services;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Configurations.OtpProperties;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.AuthChallenge;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Repositories.AuthChallengeRepository;

@Service
public class EmailOtpService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AuthChallengeRepository challengeRepository;
    private final OtpProperties otpProperties;
    private final EncryptionService encryptionService;
    private final NotificationEmailService notificationEmailService;

    public EmailOtpService(
            AuthChallengeRepository challengeRepository,
            OtpProperties otpProperties,
            EncryptionService encryptionService,
            NotificationEmailService notificationEmailService) {
        this.challengeRepository = challengeRepository;
        this.otpProperties = otpProperties;
        this.encryptionService = encryptionService;
        this.notificationEmailService = notificationEmailService;
    }

    public AuthChallenge startChallenge(User user) {
        String otp = generateOtp();
        Instant now = Instant.now();

        AuthChallenge challenge = new AuthChallenge();
        challenge.setUserId(user.getId());
        challenge.setEmail(user.getEmail());
        challenge.setOtpHash(hashOtp(otp));
        challenge.setAttemptsRemaining(otpProperties.getMaxAttempts());
        challenge.setMaxAttempts(otpProperties.getMaxAttempts());
        challenge.setCreatedAt(now);
        challenge.setUpdatedAt(now);
        challenge.setExpiresAt(now.plusSeconds(otpProperties.getTtlSeconds()));
        challenge.setResendAllowedAt(now.plusSeconds(otpProperties.getResendCooldownSeconds()));
        challenge.setStatus(AuthChallenge.ChallengeStatus.ACTIVE);

        AuthChallenge saved = challengeRepository.save(challenge);
        notificationEmailService.sendOtpCode(saved.getEmail(), otp, otpProperties.getTtlSeconds());
        return saved;
    }

    public AuthChallenge verifyCode(String challengeId, String code) {
        AuthChallenge challenge = getActiveChallenge(challengeId);
        if (isExpired(challenge)) {
            invalidate(challenge, AuthChallenge.ChallengeStatus.EXPIRED);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP_EXPIRED", "El codigo OTP expiro");
        }

        if (isCodeValid(challenge, code)) {
            challenge.setStatus(AuthChallenge.ChallengeStatus.VERIFIED);
            challenge.setUpdatedAt(Instant.now());
            return challengeRepository.save(challenge);
        }

        int remainingAttempts = challenge.getAttemptsRemaining() - 1;
        challenge.setAttemptsRemaining(Math.max(remainingAttempts, 0));
        challenge.setUpdatedAt(Instant.now());

        if (remainingAttempts <= 0) {
            challenge.setStatus(AuthChallenge.ChallengeStatus.BLOCKED);
            challengeRepository.save(challenge);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP_ATTEMPTS_EXCEEDED",
                    "Se agotaron los intentos permitidos", Map.of("remainingAttempts", 0));
        }

        challengeRepository.save(challenge);
        throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP_INVALID", "Codigo OTP invalido",
                Map.of("remainingAttempts", remainingAttempts));
    }

    public AuthChallenge resend(String challengeId) {
        AuthChallenge challenge = getActiveChallenge(challengeId);
        if (isExpired(challenge)) {
            invalidate(challenge, AuthChallenge.ChallengeStatus.EXPIRED);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "OTP_EXPIRED", "El codigo OTP expiro");
        }

        Instant now = Instant.now();
        if (now.isBefore(challenge.getResendAllowedAt())) {
            long remainingCooldown = challenge.getResendAllowedAt().getEpochSecond() - now.getEpochSecond();
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RESEND_COOLDOWN",
                    "Debes esperar antes de reenviar el codigo", Map.of("cooldownSeconds", remainingCooldown));
        }

        String otp = generateOtp();
        challenge.setOtpHash(hashOtp(otp));
        challenge.setAttemptsRemaining(otpProperties.getMaxAttempts());
        challenge.setResendAllowedAt(now.plusSeconds(otpProperties.getResendCooldownSeconds()));
        challenge.setExpiresAt(now.plusSeconds(otpProperties.getTtlSeconds()));
        challenge.setUpdatedAt(now);

        AuthChallenge updated = challengeRepository.save(challenge);
        notificationEmailService.sendOtpCode(updated.getEmail(), otp, otpProperties.getTtlSeconds());
        return updated;
    }

    public void cancel(String challengeId) {
        AuthChallenge challenge = getActiveChallenge(challengeId);
        invalidate(challenge, AuthChallenge.ChallengeStatus.CANCELLED);
    }

    private AuthChallenge getActiveChallenge(String challengeId) {
        return challengeRepository.findByIdAndStatus(challengeId, AuthChallenge.ChallengeStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "OTP_CHALLENGE_INVALID",
                        "La sesion de verificacion no es valida"));
    }

    private boolean isExpired(AuthChallenge challenge) {
        return Instant.now().isAfter(challenge.getExpiresAt());
    }

    private boolean isCodeValid(AuthChallenge challenge, String code) {
        return challenge.getOtpHash().equals(hashOtp(code));
    }

    private void invalidate(AuthChallenge challenge, AuthChallenge.ChallengeStatus status) {
        challenge.setStatus(status);
        challenge.setUpdatedAt(Instant.now());
        challengeRepository.save(challenge);
    }

    private String hashOtp(String code) {
        return encryptionService.convertSHA256(code);
    }

    private String generateOtp() {
        int number = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", number);
    }
}
