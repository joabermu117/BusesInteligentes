package com.adm.ms_security.Repositories;

import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface UserRoleRepository extends MongoRepository<UserRole, String> {
    @Query("{ 'user.$id' : ObjectId(?0) }")
    public List<UserRole> getRolesByUser(String userId);

    @Query(value = "{ 'role.$id' : ObjectId(?0) }", exists = true)
    boolean existsByRoleId(String roleId);

    List<UserRole> findAllByUser(User user);
}
