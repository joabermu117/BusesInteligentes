package com.adm.ms_security.Configurations;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.RolePermission;
import com.adm.ms_security.Models.User;
import com.adm.ms_security.Models.UserRole;
import com.adm.ms_security.Repositories.PermissionRepository;
import com.adm.ms_security.Repositories.RolePermissionRepository;
import com.adm.ms_security.Repositories.RoleRepository;
import com.adm.ms_security.Repositories.UserRepository;
import com.adm.ms_security.Repositories.UserRoleRepository;
import com.adm.ms_security.Services.EncryptionService;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final EncryptionService encryptionService;

    @Value("${admin.bootstrap.enabled:true}")
    private boolean enabled;

    @Value("${admin.bootstrap.email:felipe2006.jm@gmail.com}")
    private String adminEmail;

    @Value("${admin.bootstrap.name:Felipe Admin}")
    private String adminName;

    @Value("${admin.bootstrap.password:Admin#2026Segura}")
    private String adminPassword;

    @Value("${admin.bootstrap.role-name:administrador}")
    private String adminRoleName;

    @Value("${admin.bootstrap.citizen-role-name:ciudadano}")
    private String citizenRoleName;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            UserRoleRepository userRoleRepository,
            RolePermissionRepository rolePermissionRepository,
            EncryptionService encryptionService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.encryptionService = encryptionService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            LOGGER.info("Admin bootstrap is disabled.");
            return;
        }

        String normalizedEmail = normalizeEmail(adminEmail);
        if (normalizedEmail == null || adminPassword == null || adminPassword.length() < 8) {
            LOGGER.error("Admin bootstrap skipped: invalid email or password configuration.");
            return;
        }

        User adminUser = upsertAdminUser(normalizedEmail);
        upsertCitizenRole();
        Role adminRole = upsertAdminRole();
        syncRolePermissions(adminRole);
        ensureUserRole(adminUser, adminRole);

        LOGGER.info("Admin bootstrap completed for user {} with role {}.", normalizedEmail, adminRole.getName());
    }

    private User upsertAdminUser(String normalizedEmail) {
        User existing = this.userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (existing == null) {
            User newAdmin = new User();
            newAdmin.setName(adminName);
            newAdmin.setEmail(normalizedEmail);
            newAdmin.setPassword(encryptionService.convertSHA256(adminPassword));
            return this.userRepository.save(newAdmin);
        }

        boolean changed = false;

        if (existing.getName() == null || existing.getName().isBlank()) {
            existing.setName(adminName);
            changed = true;
        }

        if (existing.getEmail() == null || !existing.getEmail().equalsIgnoreCase(normalizedEmail)) {
            existing.setEmail(normalizedEmail);
            changed = true;
        }

        if (existing.getPassword() == null || existing.getPassword().isBlank()) {
            existing.setPassword(encryptionService.convertSHA256(adminPassword));
            changed = true;
        }

        return changed ? this.userRepository.save(existing) : existing;
    }

    private Role upsertAdminRole() {
        Role existing = this.roleRepository.findByNameIgnoreCase(adminRoleName).orElse(null);

        if (existing != null) {
            return existing;
        }

        Role role = new Role();
        role.setName(adminRoleName);
        role.setDescription("Rol administrador creado automaticamente");
        return this.roleRepository.save(role);
    }

    private Role upsertCitizenRole() {
        Role existing = this.roleRepository.findByNameIgnoreCase(citizenRoleName).orElse(null);
        if (existing != null) {
            return existing;
        }

        Role role = new Role();
        role.setName(citizenRoleName);
        role.setDescription("Rol ciudadano por defecto para nuevos usuarios");
        return this.roleRepository.save(role);
    }

    private void syncRolePermissions(Role adminRole) {
        List<Permission> permissions = this.permissionRepository.findAll();
        int created = 0;

        for (Permission permission : permissions) {
            RolePermission relation = this.rolePermissionRepository.getRolePermission(adminRole.getId(),
                    permission.getId());
            if (relation == null) {
                this.rolePermissionRepository.save(new RolePermission(adminRole, permission));
                created++;
            }
        }

        LOGGER.info("Admin role permission sync completed. Added {} missing permission mappings.", created);
    }

    private void ensureUserRole(User user, Role role) {
        List<UserRole> userRoles = this.userRoleRepository.getRolesByUser(user.getId());
        boolean hasRole = userRoles.stream()
                .map(UserRole::getRole)
                .anyMatch(existingRole -> existingRole != null && existingRole.getId().equals(role.getId()));

        if (!hasRole) {
            this.userRoleRepository.save(new UserRole(user, role));
            LOGGER.info("Assigned admin role {} to user {}.", role.getName(), user.getEmail());
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }
}
