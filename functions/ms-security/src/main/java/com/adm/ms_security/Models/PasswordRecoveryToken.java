package com.adm.ms_security.Models;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "password_recovery_tokens")
public class PasswordRecoveryToken {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String email;

    @Indexed
    private String tokenHash;

    private Instant createdAt;
    private Instant expiresAt;
    private boolean used;
    private Instant usedAt;
}
