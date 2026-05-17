package com.adm.ms_security.Services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Configurations.SecurityProperties;
import com.adm.ms_security.Dtos.LoginChallengeResponseDto;
import com.adm.ms_security.Dtos.LoginRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpResponseDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.AuthChallenge;
import com.adm.ms_security.Models.User;

import java.util.List;

@Service
/**
 * Orchestrates authentication flow between credentials/social login,
 * anti-bot checks, OTP challenge lifecycle and final JWT issuance.
 *
 * When security.tfa.enabled is false, login directly returns JWT + roles
 * skipping the OTP step entirely.
 */
public class AuthFlowService {
    private final SecurityService securityService;
    private final AntiBotService antiBotService;
    private final EmailOtpService emailOtpService;
    private final UserRoleService userRoleService;
    private final SecurityProperties securityProperties;

    public AuthFlowService(SecurityService securityService, AntiBotService antiBotService,
            EmailOtpService emailOtpService, UserRoleService userRoleService,
            SecurityProperties securityProperties) {
        this.securityService = securityService;
        this.antiBotService = antiBotService;
        this.emailOtpService = emailOtpService;
        this.userRoleService = userRoleService;
        this.securityProperties = securityProperties;
    }

    /**
     * Local login step 1: validate credentials and create OTP challenge.
     * When 2FA is disabled, returns JWT + roles directly.
     */
    public Object startEmailLogin(LoginRequestDto request) {
        User user = securityService.authenticateLocalUser(request.getEmail(), request.getPassword());
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS",
                    "Credenciales invalidas");
        }

        return createLoginChallengeOrDirectToken(user, request.getRecaptchaToken());
    }

    /**
     * Social login step 1: receives resolved user and creates OTP challenge.
     * When 2FA is disabled, returns JWT + roles directly.
     */
    public Object startSocialLogin(User user, String recaptchaToken) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS",
                    "No fue posible validar la cuenta");
        }

        return createLoginChallengeOrDirectToken(user, recaptchaToken);
    }

    // Creates OTP challenge or directly issues JWT depending on 2FA configuration.
    private Object createLoginChallengeOrDirectToken(User user, String recaptchaToken) {
        antiBotService.validate(recaptchaToken, "login");

        if (!securityProperties.isEnabled()) {
            String token = securityService.generateToken(user);
            List<String> roles = userRoleService.getRoleNamesByUser(user.getId());
            return new VerifyOtpResponseDto(token, roles);
        }

        AuthChallenge challenge = emailOtpService.startChallenge(user);
        return new LoginChallengeResponseDto(
                challenge.getId(),
                maskEmail(user.getEmail()),
                remainingSeconds(challenge),
                remainingResendCooldown(challenge));
    }

    /**
     * Login step 2: verify OTP and issue final JWT for authenticated session.
     * Returns both the JWT and the user's role list so the frontend
     * can determine which modules to render.
     */
    public VerifyOtpResponseDto verifyOtp(VerifyOtpRequestDto request) {
        AuthChallenge challenge = emailOtpService.verifyCode(request.getChallengeId(), request.getCode());
        User user = securityService.findById(challenge.getUserId());
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_USER_NOT_FOUND",
                    "La sesion de verificacion no es valida");
        }

        String token = securityService.generateToken(user);
        List<String> roles = userRoleService.getRoleNamesByUser(user.getId());

        return new VerifyOtpResponseDto(token, roles);
    }

    /**
     * Regenerates OTP code keeping the same challenge id with updated timers.
     */
    public LoginChallengeResponseDto resendOtp(String challengeId) {
        AuthChallenge challenge = emailOtpService.resend(challengeId);
        return new LoginChallengeResponseDto(
                challenge.getId(),
                maskEmail(challenge.getEmail()),
                remainingSeconds(challenge),
                remainingResendCooldown(challenge));
    }

    /**
     * Explicitly invalidates the challenge when user abandons 2FA.
     */
    public void cancelChallenge(String challengeId) {
        emailOtpService.cancel(challengeId);
    }

    private long remainingSeconds(AuthChallenge challenge) {
        return Math.max(0, challenge.getExpiresAt().getEpochSecond() - java.time.Instant.now().getEpochSecond());
    }

    private long remainingResendCooldown(AuthChallenge challenge) {
        return Math.max(0, challenge.getResendAllowedAt().getEpochSecond() - java.time.Instant.now().getEpochSecond());
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }

        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        String localMasked = local.length() <= 2 ? "**" : local.substring(0, 2) + "***";
        String domainMasked = domain.length() <= 3 ? "***" : "***." + domain.substring(domain.lastIndexOf('.') + 1);
        return localMasked + "@" + domainMasked;
    }
}
