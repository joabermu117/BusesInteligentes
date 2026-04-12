package com.adm.ms_security.Dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginChallengeResponseDto {
    private String challengeId;
    private String maskedEmail;
    private long expiresInSeconds;
    private long resendCooldownSeconds;
}
