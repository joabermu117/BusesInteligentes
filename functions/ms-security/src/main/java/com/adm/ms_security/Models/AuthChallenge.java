package com.adm.ms_security.Models;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "auth_challenges")
public class AuthChallenge {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String email;

    private String otpHash;
    private int attemptsRemaining;
    private int maxAttempts;
    private Instant expiresAt;
    private Instant resendAllowedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private ChallengeStatus status;

    public enum ChallengeStatus {
        ACTIVE,
        VERIFIED,
        CANCELLED,
        EXPIRED,
        BLOCKED
    }
}
