package com.adm.ms_security.Repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.adm.ms_security.Models.PasswordRecoveryToken;

public interface PasswordRecoveryTokenRepository extends MongoRepository<PasswordRecoveryToken, String> {
    List<PasswordRecoveryToken> findAllByUserIdAndUsedFalse(String userId);

    Optional<PasswordRecoveryToken> findByTokenHashAndUsedFalse(String tokenHash);
}
