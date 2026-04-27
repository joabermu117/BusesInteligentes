package com.adm.ms_security.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import com.google.firebase.auth.FirebaseToken;

import jakarta.servlet.http.HttpServletRequest;

@Service
/**
 * Servicio central de autenticacion/registro.
 * Se consume desde los controladores de seguridad para login local/social,
 * emision de JWT y alta de usuarios con rol/perfil inicial.
 */
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
    @Autowired
    private ProfileService theProfileService;
    @Autowired
    private  ValidatorService theValidatorsService;

    @Autowired
    private EmailService theEmailService;

    public String login(User theNewUser) {
        User authenticatedUser = authenticateLocalUser(theNewUser.getEmail(), theNewUser.getPassword());
        if (authenticatedUser == null) {
            return null;
        }

        return generateToken(authenticatedUser);
    }

    public boolean permissionsValidation(final HttpServletRequest request, Permission thePermission) {
        boolean success=this.theValidatorsService.validationRolePermission(request,thePermission.getUrl(),thePermission.getMethod());
        return success;
    }

    public User authenticateLocalUser(String email, String password) {
        User actualUser = findByEmailForLogin(email);
        if (actualUser == null || password == null || password.isBlank()) {
            return null;
        }

        String encryptedPassword = theEncryptionService.convertSHA256(password);
        if (!actualUser.getPassword().equals(encryptedPassword)) {
            return null;
        }

        return actualUser;
    }

    public User findByEmailForLogin(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        Optional<User> user = this.theUserRepository.findByEmailIgnoreCase(email.trim().toLowerCase());
        return user.orElse(null);
    }

    public User findById(String id) {
        if (id == null || id.isBlank()) {
            return null;
        }

        return this.theUserRepository.findById(id).orElse(null);
    }

    public User updatePassword(User user, String rawPassword) {
        if (user == null || user.getId() == null || rawPassword == null || rawPassword.isBlank()) {
            return null;
        }

        user.setPassword(theEncryptionService.convertSHA256(rawPassword));
        return this.theUserRepository.save(user);
    }

    // Punto unico para firmar tokens JWT con los claims base del usuario.
    public String generateToken(User user) {
        if (user == null) {
            return null;
        }

        return theJwtService.generateToken(user);
    }

    // Registro tradicional (email/password): crea usuario, rol Ciudadano y perfil.
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
        this.theProfileService.ensureProfileForUser(created);
        this.theEmailService.sendAccountCreatedEmail(created);
        return created;
    }

    // Login social: sincroniza usuario local y completa datos sociales del perfil.
    public User findOrCreateFromFirebase(
            FirebaseToken firebaseToken,
            String provider,
            String photoUrl,
            String githubUsername) {
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
            User syncedUser = syncFirebaseFields(byUid, firebaseUid, email, firebaseToken.getName());
            this.theProfileService.ensureProfileForUserWithSocialData(
                    syncedUser,
                    resolveProvider(provider, firebaseToken),
                    resolvePhotoUrl(photoUrl, firebaseToken),
                    githubUsername);
            return syncedUser;
        }

        User byEmail = this.theUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (byEmail != null) {
            User syncedUser = syncFirebaseFields(byEmail, firebaseUid, email, firebaseToken.getName());
            this.theProfileService.ensureProfileForUserWithSocialData(
                    syncedUser,
                    resolveProvider(provider, firebaseToken),
                    resolvePhotoUrl(photoUrl, firebaseToken),
                    githubUsername);
            return syncedUser;
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFirebaseUid(firebaseUid);
        newUser.setName(resolveDisplayName(firebaseToken.getName(), email));
        newUser.setPassword(generateFirebasePassword(firebaseUid));
        User created = this.theUserRepository.save(newUser);
        assignCitizenRoleIfMissing(created);
        this.theProfileService.ensureProfileForUserWithSocialData(
                created,
                resolveProvider(provider, firebaseToken),
                resolvePhotoUrl(photoUrl, firebaseToken),
                githubUsername);
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

    public User findOrCreateFromGithub(FirebaseToken firebaseToken, String photoUrl, String githubUsername) {
        return findOrCreateFromFirebase(firebaseToken, "github", photoUrl, githubUsername);
    }

    private String resolveProvider(String provider, FirebaseToken firebaseToken) {
        if (provider != null && !provider.isBlank()) {
            return provider.trim().toLowerCase();
        }

        if (firebaseToken == null || firebaseToken.getClaims() == null) {
            return "";
        }

        Object firebaseClaim = firebaseToken.getClaims().get("firebase");
        if (!(firebaseClaim instanceof Map<?, ?> firebaseData)) {
            return "";
        }

        Object signInProvider = firebaseData.get("sign_in_provider");
        if (!(signInProvider instanceof String providerValue)) {
            return "";
        }

        return providerValue;
    }

    private String resolvePhotoUrl(String photoUrl, FirebaseToken firebaseToken) {
        if (photoUrl != null && !photoUrl.isBlank()) {
            return photoUrl.trim();
        }

        if (firebaseToken == null || firebaseToken.getPicture() == null || firebaseToken.getPicture().isBlank()) {
            if (firebaseToken == null || firebaseToken.getClaims() == null) {
                return null;
            }

            String[] possibleClaimKeys = { "picture", "photo", "photo_url", "photoUrl", "avatar_url", "avatar" };
            for (String key : possibleClaimKeys) {
                Object value = firebaseToken.getClaims().get(key);
                if (value instanceof String stringValue && !stringValue.isBlank()) {
                    return stringValue.trim();
                }
            }

            return null;
        }

        return firebaseToken.getPicture();
    }

    // Login GitHub cuando el usuario tenía email privado y proporcionó uno alternativo
    public User findOrCreateFromGithubWithEmail(
            String firebaseUid,
            String email,
            String name,
            String photoUrl,
            String githubUsername) {

        if (firebaseUid == null || firebaseUid.isBlank()) return null;

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) return null;

        // Si ya existe por UID, sincronizar email alternativo y validar colision.
        User byUid = this.theUserRepository.findByFirebaseUid(firebaseUid).orElse(null);
        if (byUid != null) {
            User emailOwner = this.theUserRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            if (emailOwner != null && emailOwner.getId() != null && !emailOwner.getId().equals(byUid.getId())) {
                return null;
            }

            if (byUid.getEmail() == null || !byUid.getEmail().equalsIgnoreCase(normalizedEmail)) {
                byUid.setEmail(normalizedEmail);
            }

            if (name != null && !name.isBlank()) {
                byUid.setName(name.trim());
            }

            User syncedUser = this.theUserRepository.save(byUid);
            this.theProfileService.ensureProfileForUserWithSocialData(
                    syncedUser, "github", photoUrl, githubUsername);
            return syncedUser;
        }

        // Si ya existe por email con otro método, no permitir
        User byEmail = this.theUserRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (byEmail != null && byEmail.getFirebaseUid() != null) return null;

        // Si existe por email sin Firebase, vincular
        if (byEmail != null) {
            byEmail.setFirebaseUid(firebaseUid);
            User synced = this.theUserRepository.save(byEmail);
            this.theProfileService.ensureProfileForUserWithSocialData(
                    synced, "github", photoUrl, githubUsername);
            return synced;
        }

        // Usuario completamente nuevo
        User newUser = new User();
        newUser.setEmail(normalizedEmail);
        newUser.setFirebaseUid(firebaseUid);
        newUser.setName(resolveDisplayName(name, normalizedEmail));
        newUser.setPassword(generateFirebasePassword(firebaseUid));
        User created = this.theUserRepository.save(newUser);
        assignCitizenRoleIfMissing(created);
        this.theProfileService.ensureProfileForUserWithSocialData(
                created, "github", photoUrl, githubUsername);
        return created;
    }
}
