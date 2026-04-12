package com.adm.ms_security.Repositories;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.adm.ms_security.Models.AuthChallenge;

public interface AuthChallengeRepository extends MongoRepository<AuthChallenge, String> {
    Optional<AuthChallenge> findByIdAndStatus(String id, AuthChallenge.ChallengeStatus status);
}
