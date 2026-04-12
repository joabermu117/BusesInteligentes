package com.adm.ms_security.Services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Dtos.LoginChallengeResponseDto;
import com.adm.ms_security.Dtos.LoginRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpRequestDto;
import com.adm.ms_security.Dtos.VerifyOtpResponseDto;
import com.adm.ms_security.Exceptions.ApiException;
import com.adm.ms_security.Models.AuthChallenge;
import com.adm.ms_security.Models.User;

@Service
public class AuthFlowService {
    private final SecurityService securityService;
    private final AntiBotService antiBotService;
    private final EmailOtpService emailOtpService;

    public AuthFlowService(SecurityService securityService, AntiBotService antiBotService, EmailOtpService emailOtpService) {
        this.securityService = securityService;
        this.antiBotService = antiBotService;
        this.emailOtpService = emailOtpService;
    }

    public LoginChallengeResponseDto startEmailLogin(LoginRequestDto request) {
        antiBotService.validate(request.getRecaptchaToken(), "login");

        User user = securityService.authenticateLocalUser(request.getEmail(), request.getPassword());
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS",
                    "Credenciales invalidas");
        }

        AuthChallenge challenge = emailOtpService.startChallenge(user);
        return new LoginChallengeResponseDto(challenge.getId(), maskEmail(user.getEmail()), remainingSeconds(challenge));
    }

    public VerifyOtpResponseDto verifyOtp(VerifyOtpRequestDto request) {
        AuthChallenge challenge = emailOtpService.verifyCode(request.getChallengeId(), request.getCode());
        User user = securityService.findById(challenge.getUserId());
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_USER_NOT_FOUND",
                    "La sesion de verificacion no es valida");
        }

        return new VerifyOtpResponseDto(securityService.generateToken(user));
    }

    public LoginChallengeResponseDto resendOtp(String challengeId) {
        AuthChallenge challenge = emailOtpService.resend(challengeId);
        return new LoginChallengeResponseDto(challenge.getId(), maskEmail(challenge.getEmail()), remainingSeconds(challenge));
    }

    public void cancelChallenge(String challengeId) {
        emailOtpService.cancel(challengeId);
    }

    private long remainingSeconds(AuthChallenge challenge) {
        return Math.max(0, challenge.getExpiresAt().getEpochSecond() - java.time.Instant.now().getEpochSecond());
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
