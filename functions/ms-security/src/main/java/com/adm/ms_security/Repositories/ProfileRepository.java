package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface ProfileRepository extends MongoRepository<Profile, String> {

    @Query("{ 'user.$id' : ObjectId(?0) }")
    Optional<Profile> findByUserId(String userId);

}
