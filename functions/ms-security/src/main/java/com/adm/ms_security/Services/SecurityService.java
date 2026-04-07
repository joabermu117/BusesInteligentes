package com.adm.ms_security.Services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import com.google.firebase.auth.FirebaseToken;

@Service
public class SecurityService {
    private static final String CITIZEN_ROLE_NAME = "Ciudadano";

    @Autowired
    private UserRepository theUserRepository;
    @Autowired
    private RoleRepository theRoleRepository;
    @Autowired
    private UserRoleRepository theUserRoleRepository;
    @Autowired
    private EncryptionService theEncryptionService;
    @Autowired
    private JwtService theJwtService;

    public String login(User theNewUser) {
        User theActualUser = findByEmailForLogin(theNewUser.getEmail());
        if (theActualUser == null) {
            return null;
        }

        String encryptedPassword = theEncryptionService.convertSHA256(theNewUser.getPassword());
        if (!theActualUser.getPassword().equals(encryptedPassword)) {
            return null;
        }

        return generateToken(theActualUser);
    }

    public User findByEmailForLogin(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        Optional<User> user = this.theUserRepository.findByEmailIgnoreCase(email.trim().toLowerCase());
        return user.orElse(null);
    }

    public String generateToken(User user) {
        if (user == null) {
            return null;
        }

        return theJwtService.generateToken(user);
    }

    public User registerWithEmailPassword(String name, String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null || password == null || password.isBlank()) {
            return null;
        }

        User existing = this.theUserRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existing != null) {
            return null;
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setName(resolveDisplayName(name, normalizedEmail));
        user.setPassword(theEncryptionService.convertSHA256(password));

        User created = this.theUserRepository.save(user);
        assignCitizenRoleIfMissing(created);
        return created;
    }

    public User findOrCreateFromFirebase(FirebaseToken firebaseToken) {
        if (firebaseToken == null) {
            return null;
        }

        String firebaseUid = firebaseToken.getUid();
        if (firebaseUid == null || firebaseUid.isBlank()) {
            return null;
        }

        String email = normalizeEmail(firebaseToken.getEmail());
        if (email == null) {
            return null;
        }

        User byUid = this.theUserRepository.findByFirebaseUid(firebaseUid).orElse(null);
        if (byUid != null) {
            return syncFirebaseFields(byUid, firebaseUid, email, firebaseToken.getName());
        }

        User byEmail = this.theUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (byEmail != null) {
            return syncFirebaseFields(byEmail, firebaseUid, email, firebaseToken.getName());
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFirebaseUid(firebaseUid);
        newUser.setName(resolveDisplayName(firebaseToken.getName(), email));
        newUser.setPassword(generateFirebasePassword(firebaseUid));
        User created = this.theUserRepository.save(newUser);
        assignCitizenRoleIfMissing(created);
        return created;
    }

    private User syncFirebaseFields(User user, String firebaseUid, String email, String name) {
        boolean changed = false;

        if (user.getFirebaseUid() == null || !user.getFirebaseUid().equals(firebaseUid)) {
            user.setFirebaseUid(firebaseUid);
            changed = true;
        }

        if (user.getEmail() == null || !user.getEmail().equalsIgnoreCase(email)) {
            user.setEmail(email);
            changed = true;
        }

        if (name != null && !name.isBlank()) {
            String normalizedName = name.trim();
            if (user.getName() == null || !user.getName().equals(normalizedName)) {
                user.setName(normalizedName);
                changed = true;
            }
        }

        if (changed) {
            return this.theUserRepository.save(user);
        }

        return user;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email.trim().toLowerCase();
    }

    private String resolveDisplayName(String firebaseName, String email) {
        if (firebaseName != null && !firebaseName.isBlank()) {
            return firebaseName.trim();
        }

        int separatorIndex = email.indexOf("@");
        if (separatorIndex > 0) {
            return email.substring(0, separatorIndex);
        }

        return email;
    }

    private void assignCitizenRoleIfMissing(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        Role citizenRole = getOrCreateCitizenRole();
        List<UserRole> currentRoles = this.theUserRoleRepository.getRolesByUser(user.getId());
        boolean alreadyAssigned = currentRoles.stream()
                .map(UserRole::getRole)
                .anyMatch(role -> role != null && role.getId() != null && role.getId().equals(citizenRole.getId()));

        if (!alreadyAssigned) {
            this.theUserRoleRepository.save(new UserRole(user, citizenRole));
        }
    }

    private Role getOrCreateCitizenRole() {
        Role existingRole = this.theRoleRepository.findByNameIgnoreCase(CITIZEN_ROLE_NAME).orElse(null);
        if (existingRole != null) {
            return existingRole;
        }

        Role citizenRole = new Role();
        citizenRole.setName(CITIZEN_ROLE_NAME);
        citizenRole.setDescription("Rol de ciudadano");
        return this.theRoleRepository.save(citizenRole);
    }

    private String generateFirebasePassword(String firebaseUid) {
        return theEncryptionService.convertSHA256("firebase-user-" + firebaseUid);
    }
    /*
     * public boolean permissionsValidation(final HttpServletRequest request,
     * 
     * @RequestBody Permission thePermission) {
     * boolean success=this.theValidatorsService.validationRolePermission(request,
     * thePermission.getUrl(),thePermission.getMethod());
     * return success;
     * }
     */

     public User findOrCreateFromGithub(FirebaseToken firebaseToken) {
        if (firebaseToken == null) return null;

        String firebaseUid = firebaseToken.getUid();
        if (firebaseUid == null || firebaseUid.isBlank()) return null;

        String email = normalizeEmail(firebaseToken.getEmail());
        if (email == null) return null;

        User byUid = this.theUserRepository.findByFirebaseUid(firebaseUid).orElse(null);
        if (byUid != null) {
            return syncFirebaseFields(byUid, firebaseUid, email, firebaseToken.getName());
        }

        User byEmail = this.theUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (byEmail != null) {
            return syncFirebaseFields(byEmail, firebaseUid, email, firebaseToken.getName());
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFirebaseUid(firebaseUid);
        newUser.setName(resolveDisplayName(firebaseToken.getName(), email));
        newUser.setPassword(generateFirebasePassword(firebaseUid));
        return this.theUserRepository.save(newUser);
    }
}
