package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.Role;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoleRepository extends MongoRepository<Role, String> {
    Optional<Role> findByNameIgnoreCase(String name);
}
